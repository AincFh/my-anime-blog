export async function action({ request, context }: Route.ActionArgs) {
  const { requireAdmin } = await import("~/utils/auth");
  const { anime_db } = (context as any).cloudflare.env;

  const session = await requireAdmin(request, anime_db);
  if (!session) throw redirect("/admin/login");

  const formData = await request.formData();
  const intent = formData.get("intent");
  const commentId = formData.get("commentId");

  try {
    if (intent === "approve") {
      await anime_db.prepare("UPDATE comments SET status = 'approved', is_spam = 0 WHERE id = ?").bind(commentId).run();
      return { success: true, message: "评论已审核通过" };
    }
    if (intent === "markSpam") {
      await anime_db.prepare("UPDATE comments SET status = 'spam', is_spam = 1 WHERE id = ?").bind(commentId).run();
      return { success: true, message: "已标记为垃圾评论" };
    }
    if (intent === "delete") {
      await anime_db.prepare("DELETE FROM comments WHERE id = ?").bind(commentId).run();
      return { success: true, message: "评论已物理抹除" };
    }
    if (intent === "godModeEdit") {
      const content = formData.get("content");
      const guest_name = formData.get("author");
      await anime_db.prepare("UPDATE comments SET content = ?, guest_name = ? WHERE id = ?").bind(content, guest_name, commentId).run();
      return { success: true, message: "上帝指令：评论元数据已篡改" };
    }
    return { success: false, error: "未知指令" };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import type { Route } from "./+types/admin.comments";
import { redirect, useFetcher } from "react-router";
import { getSessionId } from "~/utils/auth";
import { Search, MessageSquare, CheckCircle, ShieldAlert, Trash2, Reply, MoreVertical } from "lucide-react";

export async function loader({ request, context }: Route.LoaderArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/admin/login");
  }

  const { anime_db } = (context as any).cloudflare.env;

  try {
    const { results } = await anime_db
      .prepare(`
        SELECT c.id, c.content, c.status, c.is_spam as isSpam, c.created_at,
               c.guest_name as author, a.title as article
        FROM comments c
        LEFT JOIN articles a ON c.article_id = a.id
        ORDER BY c.created_at DESC
        LIMIT 50
      `)
      .all();

    const comments = (results || []).map((comment: any) => {
      const createdAt = new Date(comment.created_at * 1000);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);

      let time = '';
      if (diffMins < 60) {
        time = `${diffMins}分钟前`;
      } else if (diffHours < 24) {
        time = `${diffHours}小时前`;
      } else {
        time = createdAt.toISOString().split('T')[0];
      }

      return {
        ...comment,
        author: comment.author || '匿名',
        article: comment.article || '未知文章',
        time,
        isSpam: Boolean(comment.isSpam),
      };
    });

    return { comments };
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return { comments: [] };
  }
}

export default function CommentsManager({ loaderData }: Route.ComponentProps) {
  const { comments } = loaderData;
  const [filter, setFilter] = useState<"all" | "pending" | "spam">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingComment, setEditingComment] = useState<any | null>(null);
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setEditingComment(null);
    }
  }, [fetcher.state, fetcher.data]);

  const filteredComments = useMemo(() => {
    return comments.filter((c: any) => {
      const author = c.author || "";
      const content = c.content || "";
      const article = c.article || "";
      const matchesSearch = author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === "all" ? true :
        filter === "pending" ? c.status === "pending" :
          filter === "spam" ? c.isSpam : true;
      return matchesSearch && matchesFilter;
    });
  }, [comments, searchQuery, filter]);

  const handleAction = (commentId: number, intent: string, extra = {}) => {
    const formData = new FormData();
    formData.append("intent", intent);
    formData.append("commentId", commentId.toString());
    Object.entries(extra).forEach(([k, v]) => formData.append(k, v as string));
    fetcher.submit(formData, { method: "POST" });
  };

  const pendingCount = comments.filter((c: any) => c.status === "pending").length;

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight font-orbitron flex items-center gap-3">
              <MessageSquare className="text-fuchsia-500" />
              上帝模式：交互干预
            </h1>
            <p className="text-white/50 text-sm mt-1">监管全站交互体验，支持上帝视角直接编辑评论内容。</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors" size={18} />
            <input
              type="text"
              placeholder="搜索作者、内容或文章标题..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/10 transition-all text-sm"
            />
          </div>

          <div className="bg-white/5 p-1 rounded-2xl inline-flex border border-white/10 shrink-0">
            {[
              { key: "all", label: "全部" },
              { key: "pending", label: `待审核 (${pendingCount})` },
              { key: "spam", label: "垃圾" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as typeof filter)}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filter === tab.key
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                  : "text-white/40 hover:text-white/60"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredComments.length === 0 ? (
            <div className="p-12 text-center text-white/40 glass-card-deep tech-border rounded-2xl italic">
              当前虚空中没有符合条件的信标...
            </div>
          ) : (
            filteredComments.map((comment: any, index: number) => (
              <motion.div
                key={comment.id}
                className={`glass-card-deep rounded-[32px] p-8 flex flex-col sm:flex-row gap-8 hover:border-violet-500/40 transition-all border ${comment.status === 'pending' ? 'bg-amber-500/5 border-amber-500/10' : 'border-white/5'}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex sm:flex-col items-center gap-4">
                  <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-white font-black text-2xl shadow-2xl relative overflow-hidden group ${comment.isSpam ? "bg-red-600" : "bg-gradient-to-br from-violet-600 to-fuchsia-700"}`}>
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {comment.author[0].toUpperCase()}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-white text-xl tracking-tight">{comment.author}</span>
                      <span className="text-[10px] text-white/20 font-mono uppercase tracking-widest">{comment.time} / ID: {comment.id}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${comment.status === "pending" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                        comment.isSpam ? "bg-red-500/20 text-red-500 border-red-500/30" :
                          "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"}`}>
                        {comment.isSpam ? "SPAM" : comment.status}
                      </span>
                      <button onClick={() => setEditingComment(comment)} className="p-2 text-white/20 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all" title="上帝修正: 编辑内容">
                        <ShieldAlert size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-2xl p-6 mb-6 border border-white/5">
                    <p className="text-white/70 text-base leading-relaxed break-words whitespace-pre-wrap font-medium">
                      {comment.content}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-3 text-xs font-bold text-white/30">
                      <MessageSquare size={14} className="text-violet-500" />
                      来自文章：<span className="text-white/50 truncate max-w-[200px] border-b border-white/10 hover:text-white transition-all cursor-pointer italic">{comment.article}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {comment.status === "pending" && (
                        <button onClick={() => handleAction(comment.id, "approve")} className="px-5 py-2.5 bg-emerald-500 text-black text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">APPROVE</button>
                      )}
                      <button onClick={() => handleAction(comment.id, "delete")} className="px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500/20 transition-all">TERMINATE</button>
                      <button className="px-5 py-2.5 bg-violet-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-violet-500 transition-all active:scale-95 shadow-lg shadow-violet-500/20">ENCRYPT_REFLY</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* God Mode Edit Modal */}
      <AnimatePresence>
        {editingComment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={() => setEditingComment(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-xl bg-[#0a0f1e] border border-white/10 rounded-[48px] p-10 relative z-10 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl" />
              <h2 className="text-2xl font-black text-white italic tracking-tighter mb-8 flex items-center gap-4">
                <ShieldAlert className="text-amber-500 w-8 h-8" />
                Interaction Overwrite Protocol
              </h2>
              <fetcher.Form method="post" className="space-y-6">
                <input type="hidden" name="intent" value="godModeEdit" />
                <input type="hidden" name="commentId" value={editingComment.id} />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Author Name (Spoofable)</label>
                    <input name="author" defaultValue={editingComment.author} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Content Payload (Deep Edit)</label>
                    <textarea name="content" defaultValue={editingComment.content} rows={5} className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white/80 text-sm leading-relaxed resize-none focus:border-amber-500/40" />
                  </div>
                </div>

                <button type="submit" className="w-full py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-amber-400 transition-all shadow-2xl">
                  Finalize Protocol Injection
                </button>
              </fetcher.Form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

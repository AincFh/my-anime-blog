import { motion } from "framer-motion";
import { useState, useMemo } from "react";
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
  const fetcher = useFetcher();

  const filteredComments = useMemo(() => {
    return comments.filter((c: any) => {
      const matchesSearch = c.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.article.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === "all" ? true :
        filter === "pending" ? c.status === "pending" :
          filter === "spam" ? c.isSpam : true;
      return matchesSearch && matchesFilter;
    });
  }, [comments, searchQuery, filter]);

  const handleAction = (commentId: number, intent: string) => {
    if (intent === "delete" && !confirm("确定要永久删除这条评论吗？")) return;
    fetcher.submit(
      { intent, commentId: commentId.toString() },
      { method: "POST", action: "/api/admin/comments" }
    );
  };

  const pendingCount = comments.filter((c: any) => c.status === "pending").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-orbitron">评论管理</h1>
          <p className="text-white/50 text-sm mt-1">管理你的博客评论与弹幕互动。</p>
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

      {/* Comment List */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <div className="p-12 text-center text-white/40 glass-card-deep tech-border rounded-2xl">
            该筛选条件下没有评论。
          </div>
        ) : (
          filteredComments.map((comment: any, index: number) => (
            <motion.div
              key={comment.id}
              className="glass-card-deep rounded-2xl p-6 flex flex-col sm:flex-row gap-5 hover:border-violet-500/40 transition-all border border-transparent"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex sm:flex-col items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg relative overflow-hidden flex-shrink-0 group ${comment.isSpam ? "bg-red-500/80" : "bg-gradient-to-br from-violet-500 to-fuchsia-600"
                  }`}>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {comment.author[0].toUpperCase()}
                </div>
                {comment.is_danmaku && (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] font-black rounded border border-purple-500/30 uppercase tracking-tighter sm:w-12 text-center">
                    DANMAKU
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="font-bold text-white text-base">{comment.author}</span>
                    <span className="text-[10px] text-white/30 font-mono tracking-widest">{comment.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border ${comment.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      comment.isSpam ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                      {comment.isSpam ? "SPAM" : comment.status}
                    </span>
                    <button className="p-1.5 text-white/20 hover:text-white transition-colors" title="更多">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/5 hover:bg-white/[0.08] transition-colors">
                  <p className="text-white/80 text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-medium text-white/30">
                    <MessageSquare size={12} className="text-violet-500/50" />
                    来自：<span className="text-white/50 truncate max-w-[150px] sm:max-w-[300px] hover:text-violet-300 transition-colors cursor-pointer underline decoration-dotted decoration-white/10">{comment.article}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {comment.status === "pending" && !comment.isSpam && (
                      <button
                        onClick={() => handleAction(comment.id, "approve")}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-2 rounded-xl hover:bg-emerald-400/20 transition-all active:scale-95"
                      >
                        <CheckCircle size={14} />
                        通过
                      </button>
                    )}
                    {!comment.isSpam && comment.status !== "spam" && (
                      <button
                        onClick={() => handleAction(comment.id, "markSpam")}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-2 rounded-xl hover:bg-amber-400/20 transition-all active:scale-95"
                      >
                        <ShieldAlert size={14} />
                        垃圾
                      </button>
                    )}
                    <button
                      onClick={() => handleAction(comment.id, "delete")}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-xl hover:bg-red-400/20 transition-all active:scale-95"
                    >
                      <Trash2 size={14} />
                      删除
                    </button>
                    <button className="flex items-center gap-1.5 text-[11px] font-bold text-violet-400 bg-violet-400/10 border border-violet-400/20 px-4 py-2 rounded-xl hover:bg-violet-400/20 transition-all active:scale-95">
                      <Reply size={14} />
                      回复
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}


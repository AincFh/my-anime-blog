import { motion, AnimatePresence } from "framer-motion";
import { Link, useFetcher, redirect } from "react-router";
import type { Route } from "./+types/admin.articles";
import { getSessionId } from "~/utils/auth";
import { Edit3, Trash2, Eye, Calendar, Plus, FileText, Search, Filter, CheckCircle2, Circle, ShieldAlert, Heart, Loader2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

export async function loader({ request, context }: Route.LoaderArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/panel/login");
  }

  const { anime_db } = (context as any).cloudflare.env;

  try {
    const { results } = await anime_db
      .prepare("SELECT id, slug, title, views, status, created_at FROM articles ORDER BY created_at DESC")
      .all();

    const articles = (results || []).map((article: any) => ({
      ...article,
      createdAt: new Date(article.created_at * 1000).toISOString().split('T')[0],
    }));

    return { articles };
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return { articles: [] };
  }
}

export async function action({ request, context }: Route.ActionArgs) {
  const { requireAdmin } = await import("~/utils/auth");
  const { anime_db } = (context as any).cloudflare.env;

  const session = await requireAdmin(request, anime_db);
  if (!session) throw redirect("/admin/login");

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "dataCorrection") {
    const articleId = formData.get("articleId");
    const views = parseInt(formData.get("views") as string);
    const likes = parseInt(formData.get("likes") as string);

    try {
      await anime_db.prepare(`
        UPDATE articles SET views = ?, likes = ? WHERE id = ?
      `).bind(views, likes, articleId).run();
      return { success: true, message: "流量数据已强行修正" };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  if (intent === "delete") {
    const articleId = formData.get("articleId");
    await anime_db.prepare("DELETE FROM articles WHERE id = ?").bind(articleId).run();
    return { success: true, message: "内容已物理切除" };
  }

  return { success: false, error: "未知指令" };
}

export default function ArticlesManager({ loaderData, actionData }: Route.ComponentProps) {
  const { articles } = loaderData;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [correctionTarget, setCorrectionTarget] = useState<any | null>(null);
  const fetcher = useFetcher();

  const filteredArticles = useMemo(() => {
    return articles.filter((article: any) => {
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || article.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [articles, searchQuery, statusFilter]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredArticles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredArticles.map((a: any) => a.id));
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-orbitron flex items-center gap-3">
            <FileText className="text-violet-500" />
            上帝模式：内容管制
          </h1>
          <p className="text-white/50 text-sm mt-1">监管全站博文，支持手动修正 PV/Likes 热度数据。</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/article/new">
            <button className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium transition-all active:scale-95 shadow-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-violet-500/30 flex items-center justify-center gap-2 text-sm">
              <Plus size={18} />
              <span>招募新内容</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 搜索与筛选栏 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors" size={18} />
          <input
            type="text"
            placeholder="搜索文章标题或 Slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/10 transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group min-w-[140px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none focus:outline-none focus:border-violet-500/40 transition-all text-sm cursor-pointer"
            >
              <option value="all" className="bg-[#0f1629]">全部状态</option>
              <option value="published" className="bg-[#0f1629]">已发布</option>
              <option value="draft" className="bg-[#0f1629]">草稿</option>
            </select>
          </div>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="glass-card-deep tech-border rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} className="text-white/30" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">指令库空虚</h3>
          <p className="text-white/50 max-w-sm">目前星尘网络中尚无内容沉淀。请即刻通过“新建文章”注入第一份灵魂。</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden" animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {filteredArticles.map((article: any) => (
            <motion.div
              key={article.id}
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              className={`glass-card-deep rounded-3xl p-6 hover:border-violet-500/40 transition-all flex flex-col h-full relative group ${selectedIds.includes(article.id) ? "border-violet-500/60 bg-violet-500/5 shadow-[0_10px_30px_rgba(139,92,246,0.1)]" : "border-white/5"}`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${article.status === "published"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/20"
                  }`}>
                  {article.status === "published" ? "Live" : "Ghost"}
                </span>

                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all translate-x-2 md:translate-x-4 group-hover:translate-x-0">
                  <button onClick={() => setCorrectionTarget(article)} className="p-2 text-white/40 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all" title="上帝修正: 热度调节">
                    <ShieldAlert size={16} />
                  </button>
                  <Link to={`/admin/article/new?edit=${article.id}`} className="p-2 text-white/40 hover:text-violet-400 hover:bg-violet-500/10 rounded-xl transition-all">
                    <Edit3 size={16} />
                  </Link>
                  <button className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-grow">
                <h3 className="text-lg font-bold text-white leading-snug mb-2 line-clamp-2 group-hover:text-violet-300 transition-colors">
                  {article.title}
                </h3>
                <p className="text-[10px] text-white/20 font-mono tracking-tighter truncate">STARDUST_NODE: /{article.slug}</p>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/30">
                    <Eye size={12} /> {article.views}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-pink-400/50">
                    <Heart size={12} /> {article.likes || 0}
                  </div>
                </div>
                <div className="text-[10px] font-mono text-white/20">{article.createdAt}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* God Mode Correction Modal */}
      <AnimatePresence>
        {correctionTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setCorrectionTarget(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md bg-[#0f111a] border border-white/10 rounded-[32px] p-8 relative z-10 shadow-2xl">
              <h2 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-3">
                <ShieldAlert className="text-amber-500" />
                Stat Protocol Overwrite
              </h2>
              <fetcher.Form method="post" className="space-y-6">
                <input type="hidden" name="intent" value="dataCorrection" />
                <input type="hidden" name="articleId" value={correctionTarget.id} />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Page Views (Atomic)</label>
                    <input name="views" type="number" defaultValue={correctionTarget.views} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Total Likes (Artificial)</label>
                    <input name="likes" type="number" defaultValue={correctionTarget.likes || 0} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-pink-400 font-mono" />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-xl active:scale-[0.98]">
                  Authorize Data Correction
                </button>
              </fetcher.Form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}



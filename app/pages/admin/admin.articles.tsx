import { motion } from "framer-motion";
import { Link } from "react-router";
import type { Route } from "./+types/admin.articles";
import { redirect } from "react-router";
import { getSessionId } from "~/utils/auth";
import { Edit3, Trash2, Eye, Calendar, Plus, FileText, Search, Filter, CheckCircle2, Circle } from "lucide-react";
import { useState, useMemo } from "react";

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

export default function ArticlesManager({ loaderData }: Route.ComponentProps) {
  const { articles } = loaderData;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-orbitron">文章管理</h1>
          <p className="text-white/50 text-sm mt-1">管理你的博客文章与内容。</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/article/new">
            <button className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium transition-all active:scale-95 shadow-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-violet-500/30 flex items-center justify-center gap-2">
              <Plus size={18} />
              <span>新建文章</span>
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
          {selectedIds.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-red-500/30 transition-all"
            >
              <Trash2 size={16} />
              <span>删除 ({selectedIds.length})</span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={toggleSelectAll}
          className="text-xs font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2"
        >
          {selectedIds.length === filteredArticles.length && filteredArticles.length > 0 ? (
            <CheckCircle2 size={16} className="text-violet-400" />
          ) : (
            <Circle size={16} />
          )}
          全选当前文章
        </button>
        <span className="text-xs text-white/30 font-mono">
          找到 {filteredArticles.length} 篇文章
        </span>
      </div>

      {articles.length === 0 ? (
        <div className="glass-card-deep tech-border rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} className="text-white/30" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">还没有文章</h3>
          <p className="text-white/50 max-w-sm">你还没有发布任何文章。点击上方的按钮开始创作吧。</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {filteredArticles.map((article: any) => (
            <motion.div
              key={article.id}
              variants={itemVariants}
              onClick={() => toggleSelect(article.id)}
              className={`glass-card-deep rounded-2xl p-6 hover:border-violet-500/40 transition-all flex flex-col h-full relative group cursor-pointer ${selectedIds.includes(article.id) ? "tech-border border-violet-500/60 bg-violet-500/5" : ""
                }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedIds.includes(article.id) ? "bg-violet-500 border-violet-500" : "border-white/20 bg-white/5"
                    }`}>
                    {selectedIds.includes(article.id) && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${article.status === "published"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                    {article.status === "published" ? "已发布" : "草稿"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <Link to={`/admin/article/new?edit=${article.id}`} className="p-2 text-white/40 hover:text-violet-400 hover:bg-violet-500/10 rounded-full transition-colors active:scale-90 inline-flex">
                    <Edit3 size={16} />
                  </Link>
                  <button className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors active:scale-90">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="block-1 flex-grow">
                <h3 className="text-lg font-bold text-white leading-snug mb-2 line-clamp-2 hover:text-violet-300 transition-colors">
                  {article.title}
                </h3>
                <p className="text-xs text-white/30 font-mono mb-4">/{article.slug}</p>
              </div>

              <div className="flex items-center gap-4 mt-auto pt-4 border-t border-white/10 text-xs font-medium text-white/40">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-white/30" />
                  {article.createdAt}
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <Eye size={14} className="text-white/30" />
                  {article.views} 阅
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}


import { motion, AnimatePresence } from "framer-motion";
import { Link, useFetcher, redirect, useLoaderData, useActionData, type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { getSessionId } from "~/utils/auth";
import { Edit3, Trash2, Eye, Calendar, Plus, FileText, Search, Filter, CheckCircle2, Circle, ShieldAlert, Heart, Loader2, RefreshCw, ExternalLink, Cloud, Server } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { confirmModal } from "~/components/ui/Modal";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/panel/login");
  }

  const { anime_db } = context.cloudflare.env as { anime_db: import('~/services/db.server').Database };
  const { verifySession } = await import("~/utils/auth");
  const session = await verifySession(sessionId, anime_db);

  if (!session) {
    throw redirect("/panel/login");
  }

  // 验证管理员权限
  if (session.user.role !== "admin") {
    throw redirect("/");
  }

  try {
    const { results } = await anime_db
      .prepare(`
        SELECT id, slug, title, summary, views, status, created_at, updated_at, 
               source, notion_id, notion_url, last_synced_at
        FROM articles 
        ORDER BY created_at DESC
      `)
      .all();

    const articles = (results || []).map((article: Record<string, unknown>) => ({
      ...article,
      createdAt: new Date(article.created_at * 1000).toISOString().split('T')[0],
      updatedAt: new Date(article.updated_at * 1000).toISOString().split('T')[0],
      lastSyncedAt: article.last_synced_at 
        ? new Date(article.last_synced_at).toLocaleString('zh-CN')
        : null,
    }));

    return { articles };
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return { articles: [] };
  }
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { requireAdmin } = await import("~/utils/auth");
  const { anime_db } = context.cloudflare.env as { anime_db: import('~/services/db.server').Database };

  const session = await requireAdmin(request, anime_db);
  if (!session) throw redirect("/panel/login");

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
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  if (intent === "delete") {
    const articleId = formData.get("articleId");
    await anime_db.prepare("DELETE FROM articles WHERE id = ?").bind(articleId).run();
    return { success: true, message: "内容已物理切除" };
  }

  if (intent === "publish") {
    const articleId = formData.get("articleId");
    await anime_db
      .prepare("UPDATE articles SET status = 'published', updated_at = unixepoch() WHERE id = ?")
      .bind(articleId)
      .run();
    return { success: true, message: "文章已发布" };
  }

  if (intent === "unpublish") {
    const articleId = formData.get("articleId");
    await anime_db
      .prepare("UPDATE articles SET status = 'draft', updated_at = unixepoch() WHERE id = ?")
      .bind(articleId)
      .run();
    return { success: true, message: "文章已下架" };
  }

  return { success: false, error: "未知指令" };
}

export default function ArticlesManager() {
    const loaderData = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const { articles } = loaderData;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [correctionTarget, setCorrectionTarget] = useState<Record<string, unknown> | null>(null);
  const fetcher = useFetcher();
  
  // 同步状态
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // 加载同步状态
  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch('/api/notion/sync?action=status');
      const data = await res.json();
      if (data.lastSync) {
        setLastSyncTime(new Date(data.lastSync.timestamp).toLocaleString('zh-CN'));
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSync = async () => {
    setSyncStatus('syncing');
    setSyncMessage('正在从 Notion 同步文章...');
    
    try {
      const res = await fetch('/api/notion/sync?action=sync');
      const data = await res.json();
      
      if (data.success) {
        setSyncStatus('success');
        setSyncMessage(data.message);
        setLastSyncTime(new Date(data.timestamp).toLocaleString('zh-CN'));
        // 刷新页面以显示新文章
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSyncStatus('error');
        setSyncMessage(data.message || '同步失败');
      }
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : '同步失败';
      setSyncStatus('error');
      setSyncMessage(err);
    }
    
    setTimeout(() => setSyncStatus('idle'), 5000);
  };

  const filteredArticles = useMemo(() => {
    return articles.filter((article: Record<string, unknown>) => {
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || article.status === statusFilter;
      const matchesSource = sourceFilter === "all" || article.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [articles, searchQuery, statusFilter, sourceFilter]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredArticles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredArticles.map((a: Record<string, unknown>) => a.id as number));
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
          {/* Notion 同步按钮 */}
          <motion.button
            onClick={handleSync}
            disabled={syncStatus === 'syncing'}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 text-sm ${
              syncStatus === 'syncing' 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 cursor-wait'
                : syncStatus === 'success'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : syncStatus === 'error'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {syncStatus === 'syncing' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} className={syncStatus === 'success' ? 'text-green-400' : ''} />
            )}
            <span>{syncStatus === 'syncing' ? '同步中...' : '同步 Notion'}</span>
          </motion.button>
          
          {/* 最后同步时间 */}
          {lastSyncTime && (
            <span className="text-xs text-white/30 hidden md:flex items-center gap-1">
              <Cloud size={12} />
              {lastSyncTime}
            </span>
          )}
          
          <Link to="/admin/article/new">
            <button className="px-5 py-2.5 rounded-xl font-medium transition-all active:scale-95 shadow-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-violet-500/30 flex items-center justify-center gap-2 text-sm">
              <Plus size={18} />
              <span>新建文章</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 同步状态提示 */}
      {syncMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${
            syncStatus === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            syncStatus === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}
        >
          {syncStatus === 'syncing' && <Loader2 size={14} className="animate-spin" />}
          {syncStatus === 'success' && <CheckCircle2 size={14} />}
          {syncStatus === 'error' && <ShieldAlert size={14} />}
          {syncMessage}
        </motion.div>
      )}

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
          {/* 来源筛选 */}
          <div className="relative group min-w-[120px]">
            <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none focus:outline-none focus:border-violet-500/40 transition-all text-sm cursor-pointer"
            >
              <option value="all" className="bg-[#0f1629]">全部来源</option>
              <option value="local" className="bg-[#0f1629]">本地撰写</option>
              <option value="notion" className="bg-[#0f1629]">Notion</option>
            </select>
          </div>
          
          {/* 状态筛选 */}
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
          {filteredArticles.map((article: Record<string, unknown>) => (
            <motion.div
              key={article.id}
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              className={`glass-card-deep rounded-3xl p-6 hover:border-violet-500/40 transition-all flex flex-col h-full relative group ${selectedIds.includes(article.id) ? "border-violet-500/60 bg-violet-500/5 shadow-[0_10px_30px_rgba(139,92,246,0.1)]" : "border-white/5"}`}
            >
              {/* 顶部栏：状态 + 来源 */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${article.status === "published"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/20"
                    }`}>
                    {article.status === "published" ? "已发布" : "草稿"}
                  </span>
                  
                  {/* 来源标签 */}
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-medium flex items-center gap-1 ${
                    article.source === 'notion'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/20'
                  }`}>
                    {article.source === 'notion' ? (
                      <>
                        <Cloud size={10} />
                        Notion
                      </>
                    ) : (
                      <>
                        <Server size={10} />
                        本地
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all translate-x-2 md:translate-x-4 group-hover:translate-x-0">
                  {/* Notion 原始链接 */}
                  {article.source === 'notion' && article.notion_url && (
                    <a 
                      href={article.notion_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-white/40 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
                      title="查看 Notion 原文"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  
                  {/* 发布/下架按钮 */}
                  <fetcher.Form method="post" className="inline">
                    <input type="hidden" name="intent" value={article.status === "published" ? "unpublish" : "publish"} />
                    <input type="hidden" name="articleId" value={article.id} />
                    <button 
                      type="submit"
                      className={`p-2 rounded-xl transition-all ${article.status === "published" 
                        ? "text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                        : "text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                      }`}
                      title={article.status === "published" ? "下架文章" : "发布文章"}
                    >
                      {article.status === "published" ? <Circle size={16} /> : <CheckCircle2 size={16} />}
                    </button>
                  </fetcher.Form>
                  
                  <button onClick={() => setCorrectionTarget(article)} className="p-2 text-white/40 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all" title="上帝修正: 热度调节">
                    <ShieldAlert size={16} />
                  </button>
                  <Link to={`/admin/article/new?edit=${article.id}`} className="p-2 text-white/40 hover:text-violet-400 hover:bg-violet-500/10 rounded-xl transition-all">
                    <Edit3 size={16} />
                  </Link>
                  <button
                    onClick={() => {
                      confirmModal({ title: "危险操作", message: `确定要永久删除「${article.title}」吗？此操作不可撤销。` }).then(res => {
                        if (res) {
                          const formData = new FormData();
                          formData.append("intent", "delete");
                          formData.append("articleId", article.id.toString());
                          fetcher.submit(formData, { method: "POST" });
                        }
                      });
                    }}
                    className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-grow">
                <h3 className="text-lg font-bold text-white leading-snug mb-2 line-clamp-2 group-hover:text-violet-300 transition-colors">
                  {article.title}
                </h3>
                <p className="text-[10px] text-white/20 font-mono tracking-tighter truncate">STARDUST_NODE: /{article.slug}</p>
                
                {/* 摘要预览 */}
                {article.summary && (
                  <p className="text-xs text-white/40 mt-2 line-clamp-2">{article.summary}</p>
                )}
                
                {/* 同步信息 */}
                {article.source === 'notion' && article.lastSyncedAt && (
                  <p className="text-[9px] text-white/20 mt-2 flex items-center gap-1">
                    <RefreshCw size={8} />
                    最后同步: {article.lastSyncedAt}
                  </p>
                )}
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
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md bg-[#0f111a] border border-white/10 rounded-2xl p-8 relative z-10 shadow-2xl">
              <h2 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-3">
                <ShieldAlert className="text-amber-500" />
                热度数据修正
              </h2>
              <fetcher.Form method="post" className="space-y-6">
                <input type="hidden" name="intent" value="dataCorrection" />
                <input type="hidden" name="articleId" value={correctionTarget.id} />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">页面浏览量 (PV)</label>
                    <input name="views" type="number" defaultValue={correctionTarget.views} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">点赞总数</label>
                    <input name="likes" type="number" defaultValue={correctionTarget.likes || 0} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-pink-400 font-mono" />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-xl active:scale-[0.98]">
                  执行数据修正
                </button>
              </fetcher.Form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}



import { motion } from "framer-motion";
import { GlassCard } from "~/components/layout/GlassCard";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import { useState, useMemo } from "react";
import { Filter, SortDesc, Calendar, Star, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import type { Route } from "./+types/bangumi";

/**
 * 番剧墙（Bangumi模式）
 * 功能：
 * 1. 海报流展示
 * 2. 支持评分（⭐⭐⭐⭐⭐）
 * 3. 短评显示
 * 4. 状态标签（在看/看过/想看/弃番）
 */
export async function loader({ context }: Route.LoaderArgs) {
  const { anime_db } = (context as any).cloudflare.env;

  try {
    const animesResult = await anime_db
      .prepare(
        `SELECT id, title, cover_url, status, progress, rating, review, created_at
         FROM animes
         ORDER BY 
           CASE status
             WHEN 'watching' THEN 1
             WHEN 'completed' THEN 2
             WHEN 'plan' THEN 3
             WHEN 'dropped' THEN 4
           END,
           rating DESC,
           created_at DESC`
      )
      .all();

    let animes = animesResult.results || [];
    return { animes };
  } catch (error) {
    console.error("Failed to fetch animes:", error);
    return { animes: [] };
  }
}

const statusConfig = {
  watching: { label: "在看", color: "text-blue-400", bgColor: "bg-blue-500/20", borderColor: "border-blue-400/30" },
  completed: { label: "看过", color: "text-green-400", bgColor: "bg-green-500/20", borderColor: "border-green-400/30" },
  dropped: { label: "弃番", color: "text-gray-400", bgColor: "bg-gray-500/20", borderColor: "border-gray-400/30" },
  plan: { label: "想看", color: "text-purple-400", bgColor: "bg-purple-500/20", borderColor: "border-purple-400/30" },
};

// 渲染星级评分
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating / 2);
  const hasHalfStar = rating % 2 === 1;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <span key={i} className="text-yellow-400 text-sm">★</span>
      ))}
      {hasHalfStar && <span className="text-yellow-400 text-sm">☆</span>}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <span key={i} className="text-gray-400 text-sm">☆</span>
      ))}
      <span className="ml-2 text-xs text-slate-400">{rating}/10</span>
    </div>
  );
}

// 提取的单个番剧卡片组件
function AnimeCardItem({ anime, index, config, onClick }: { anime: any, index: number, config: any, onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="group cursor-pointer flex flex-col h-full relative"
    >
      {/* 修改卡片比例为 3/4 或 2/3 并增加苹果的轻薄边框和软高光反光效果 */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-[16px] md:rounded-[20px] bg-slate-100 dark:bg-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] border border-black/5 dark:border-white/5 mx-auto w-full transition-all duration-300">
        {anime.cover_url ? (
          <img
            src={anime.cover_url}
            alt={anime.title}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/400x600/1e293b/ffffff?text=No+Cover"
            }}
            className="w-full h-full object-cover object-[center_top] transform group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-4xl opacity-50">
            🎬
          </div>
        )}

        {/* 悬浮黑色渐变压暗层（仅悬停显现） */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* 顶部微状态徽章 (极简) */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-[10px] bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/20">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color.replace('text-', 'text-white drop-shadow-sm ')}`}>
            {config.label}
          </span>
        </div>

        {/* 隐藏的悬浮短评 */}
        {anime.review && (
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <p className="text-white text-xs font-medium leading-relaxed drop-shadow-md line-clamp-3">
              {anime.review}
            </p>
          </div>
        )}
      </div>

      {/* 底部信息裸露，苹果系最常用的去卡片化布局 */}
      <div className="pt-3 px-1 flex-1 flex flex-col">
        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-blue-500 transition-colors">
            {anime.title}
        </h3>
        
        <div className="flex items-center justify-between mt-auto">
            {anime.progress && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {anime.progress}
            </span>
            )}
            
            {anime.rating && (
            <div className="scale-90 origin-right opacity-80 group-hover:opacity-100 transition-opacity">
                <StarRating rating={anime.rating} />
            </div>
            )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Bangumi({ loaderData }: Route.ComponentProps) {
  const { animes } = loaderData || { animes: [] };
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"default" | "rating" | "date">("default");
  const [selectedAnime, setSelectedAnime] = useState<any>(null);

  // Process data based on filter and sort
  const processedAnimes = useMemo(() => {
    let result = [...animes];

    // 1. Filter
    if (filterStatus !== "all") {
      result = result.filter((a: any) => a.status === filterStatus);
    }

    // 2. Sort
    if (sortBy === "rating") {
      result.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "date") {
      result.sort((a: any, b: any) => b.created_at - a.created_at);
    }
    // 'default' keeps DB order (grouped by status)

    return result;
  }, [animes, filterStatus, sortBy]);

  // Group for default view
  const groupedAnimes = useMemo(() => {
    if (sortBy !== "default") return {}; // No grouping when sorting

    return processedAnimes.reduce((acc: any, anime: any) => {
      const status = anime.status || "plan";
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(anime);
      return acc;
    }, {});
  }, [processedAnimes, sortBy]);


  return (
    <div className="w-full max-w-[1920px] mx-auto pt-[90px] md:pt-[120px] pb-24 md:pb-24 px-6 sm:px-10 lg:px-16 2xl:px-24">
      {/* 极简标题 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 md:mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-sans font-black tracking-tight text-slate-900 dark:text-white mb-3">
          番剧墙
        </h1>
        <p className="text-xl md:text-2xl font-medium text-slate-400 dark:text-slate-500 tracking-tight">
          被框在屏幕里的二次元轨迹
        </p>
      </motion.div>

      {/* 筛选和排序工具栏 - Apple Segmented Control Style */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 mb-12"
      >
        {/* 状态筛选 - iOS 风格切换器 */}
        <div className="flex overflow-x-auto hide-scrollbar p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-[20px] md:max-w-fit shadow-inner">
          {[
            { id: 'all', label: '全部' },
            { id: 'watching', label: '在看' },
            { id: 'completed', label: '看过' },
            { id: 'plan', label: '想看' },
            { id: 'dropped', label: '弃番' }
          ].map(status => (
            <button
              key={status.id}
              onClick={() => setFilterStatus(status.id)}
              className={`px-5 py-2.5 rounded-[14px] text-[15px] font-semibold tracking-wide transition-all duration-300 whitespace-nowrap flex-1 md:flex-none ${filterStatus === status.id
                ? 'bg-white text-slate-900 shadow-md dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* 排序方式 - Apple 极简胶囊 */}
        <div className="flex items-center gap-1.5 self-end md:self-auto overflow-x-auto hide-scrollbar">
          {[
            { id: 'default', label: '默认', icon: Filter },
            { id: 'rating', label: '评分', icon: Star },
            { id: 'date', label: '最新', icon: Calendar },
          ].map(sort => (
            <button
              key={sort.id}
              onClick={() => setSortBy(sort.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[16px] text-sm font-semibold transition-all duration-300 ${sortBy === sort.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              <sort.icon size={16} className={sortBy === sort.id ? "" : "opacity-70"} />
              {sort.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* 番剧墙 - 海报流布局 */}
      {/* 内容区域：分组视图 或 扁平视图 */}
      <div className="space-y-16 md:space-y-20">
        {sortBy === "default" ? (
          // 分组视图 (保持原有逻辑)
          Object.entries(groupedAnimes).map(([status, statusAnimes]) => {
            const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.plan;

            return (
              <motion.section
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* 状态分割标题 */}
                <div className="flex items-baseline gap-4 mb-6 md:mb-8">
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {config.label}
                  </h2>
                  <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                    {(statusAnimes as any[]).length} 部
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
                  {(statusAnimes as any[]).map((anime: any, index: number) => (
                    <AnimeCardItem key={anime.id} anime={anime} index={index} config={config} onClick={() => setSelectedAnime(anime)} />
                  ))}
                </div>
              </motion.section>
            );
          })
        ) : (
          // 扁平视图 (排序后)
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
            {processedAnimes.map((anime: any, index: number) => {
              const status = anime.status || 'plan';
              const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.plan;
              return <AnimeCardItem key={anime.id} anime={anime} index={index} config={config} onClick={() => setSelectedAnime(anime)} />;
            })}
          </div>
        )}
      </div>

      {animes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl opacity-50">📺</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-700 dark:text-white mb-2">还未收录任何番剧</h3>
          <p className="text-slate-500 max-w-sm">去后台添加你的第一部番剧吧！</p>
        </div>
      )}

      {/* 沉浸式番剧详情视窗 */}
      <AnimatePresence>
        {selectedAnime && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-[env(safe-area-inset-bottom)]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAnime(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] bg-white dark:bg-[#0A0A0A] rounded-[32px] overflow-hidden shadow-2xl flex flex-col sm:flex-row z-10 border border-slate-200 dark:border-white/10"
            >
              {/* Cover Area */}
              <div className="w-full sm:w-2/5 md:w-1/2 h-[30vh] sm:h-auto min-h-[250px] relative shrink-0">
                <img 
                  src={selectedAnime.cover_url} 
                  alt={selectedAnime.title} 
                  className="absolute inset-0 w-full h-full object-cover object-center" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent sm:hidden" />
                <button
                  onClick={() => setSelectedAnime(null)}
                  className="absolute top-4 right-4 sm:hidden p-2 bg-black/40 backdrop-blur-md border border-white/20 hover:bg-black/60 rounded-full transition-colors z-20 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-6 sm:p-10 lg:p-12 overflow-y-auto relative flex flex-col selection:bg-blue-500/30">
                <button
                  onClick={() => setSelectedAnime(null)}
                  className="hidden sm:block absolute top-6 right-6 p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors z-10"
                >
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>

                <div className="mb-6 sm:mb-8 mt-2 sm:mt-0 relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider ${
                      (statusConfig as any)[selectedAnime.status]?.bgColor || 'bg-slate-100'
                    } ${
                      (statusConfig as any)[selectedAnime.status]?.color || 'text-slate-500'
                    }`}>
                      {(statusConfig as any)[selectedAnime.status]?.label || '未知状态'}
                    </span>
                    {selectedAnime.progress && (
                      <span className="text-[13px] font-bold text-slate-400">
                        {selectedAnime.progress}
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                    {selectedAnime.title}
                  </h2>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                    <Calendar className="w-4 h-4 opacity-70" />
                    {new Date(selectedAnime.created_at * 1000).toLocaleDateString()}
                  </div>
                </div>

                {selectedAnime.rating && (
                  <div className="mb-6 sm:mb-8 p-5 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/5">
                    <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">总体评价</div>
                    <StarRating rating={selectedAnime.rating} />
                  </div>
                )}

                <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {selectedAnime.review ? (
                    <p className="text-[15px] sm:text-[16px] whitespace-pre-wrap">{selectedAnime.review}</p>
                  ) : (
                    <p className="italic opacity-50">暂无任何评语留下...</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


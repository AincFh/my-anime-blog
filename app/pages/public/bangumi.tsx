import { motion } from "framer-motion";
import { GlassCard } from "~/components/layout/GlassCard";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import { useState, useMemo } from "react";
import { Filter, SortDesc, Calendar, Star } from "lucide-react";
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

    return {
      animes: animesResult.results || [],
    };
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
function AnimeCardItem({ anime, index, config }: { anime: any, index: number, config: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -8, scale: 1.05 }}
      className="group cursor-pointer"
    >
      <GlassCard className="overflow-hidden p-0 h-full">
        {/* 封面图 */}
        <div className="relative aspect-[2/3] overflow-hidden">
          {anime.cover_url ? (
            <OptimizedImage
              src={anime.cover_url}
              alt={anime.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/30 to-pink-900/30 flex items-center justify-center text-6xl opacity-20">
              🎬
            </div>
          )}

          {/* 状态标签 */}
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full ${config.bgColor} backdrop-blur-sm border ${config.borderColor}`}>
            <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
          </div>

          {/* 评分悬浮显示 */}
          {anime.rating && (
            <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <StarRating rating={anime.rating} />
            </div>
          )}

          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* 标题和进度 */}
        <div className="p-3">
          <h3 className="text-sm font-bold text-slate-800 mb-1 line-clamp-2 group-hover:text-primary-start transition-colors">
            {anime.title}
          </h3>
          {anime.progress && (
            <p className="text-xs text-slate-500 mb-2">
              进度: <span className="text-slate-700 font-medium">{anime.progress}</span>
            </p>
          )}
          {anime.rating && (
            <div className="hidden group-hover:block">
              <StarRating rating={anime.rating} />
            </div>
          )}
        </div>

        {/* 短评（悬浮时显示） */}
        {anime.review && (
          <div className="px-3 pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs text-slate-600 line-clamp-2 italic">
              "{anime.review}"
            </p>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

export default function Bangumi({ loaderData }: Route.ComponentProps) {
  const { animes } = loaderData || { animes: [] };
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"default" | "rating" | "date">("default");

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
    <div className="container mx-auto px-4 py-20">
      {/* 标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          我的番剧墙
        </h1>
        <p className="text-slate-600 text-lg">记录每一个追番的瞬间</p>
      </motion.div>

      {/* 筛选和排序工具栏 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12 bg-white/5 dark:bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10"
      >
        {/* 状态筛选 */}
        <div className="flex flex-wrap gap-2">
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
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === status.id
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-white/20'
                }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* 排序方式 */}
        <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1">
          {[
            { id: 'default', label: '默认', icon: Filter },
            { id: 'rating', label: '评分', icon: Star },
            { id: 'date', label: '最新', icon: Calendar },
          ].map(sort => (
            <button
              key={sort.id}
              onClick={() => setSortBy(sort.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === sort.id
                ? 'bg-white shadow-sm text-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
            >
              <sort.icon size={14} />
              {sort.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* 番剧墙 - 海报流布局 */}
      {/* 内容区域：分组视图 或 扁平视图 */}
      <div className="space-y-12">
        {sortBy === "default" ? (
          // 分组视图 (保持原有逻辑)
          Object.entries(groupedAnimes).map(([status, statusAnimes]) => {
            const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.plan;

            return (
              <motion.section
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
              >
                <div className="flex items-center gap-4 mb-6">
                  <h2 className={`text-2xl font-bold ${config.color}`}>{config.label}</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-30" style={{ color: config.color }} />
                  <span className="text-sm text-slate-500">{(statusAnimes as any[]).length} 部</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {(statusAnimes as any[]).map((anime: any, index: number) => (
                    <AnimeCardItem key={anime.id} anime={anime} index={index} config={config} />
                  ))}
                </div>
              </motion.section>
            );
          })
        ) : (
          // 扁平视图 (排序后)
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {processedAnimes.map((anime: any, index: number) => {
              const status = anime.status || 'plan';
              const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.plan;
              return <AnimeCardItem key={anime.id} anime={anime} index={index} config={config} />;
            })}
          </div>
        )}
      </div>

      {animes.length === 0 && (
        <div className="text-center text-slate-500 py-20">
          <p className="text-xl mb-4">还没有番剧记录</p>
          <p className="text-sm">去后台添加你的第一部番剧吧！</p>
        </div>
      )}
    </div>
  );
}


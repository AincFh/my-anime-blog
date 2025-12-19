import { motion } from "framer-motion";
import { GlassCard } from "~/components/ui/layout/GlassCard";
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
  // 检查环境，避免在本地开发时出错
  if (!context.cloudflare || !context.cloudflare.env) {
    // 本地开发环境返回模拟数据
    return {
      animes: [
        {
          id: 1,
          title: "葬送的芙莉莲",
          cover_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
          status: "watching",
          progress: "24/28",
          rating: 9.5,
          review: "平淡中见真章，这才是真正的神作。",
          created_at: Date.now() / 1000
        },
        {
          id: 2,
          title: "进击的巨人 最终季",
          cover_url: "https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=800",
          status: "completed",
          progress: "完结",
          rating: 10,
          review: "献出心脏！跨越十年的史诗。",
          created_at: Date.now() / 1000 - 86400
        },
        {
          id: 3,
          title: "间谍过家家",
          cover_url: "https://images.unsplash.com/photo-1620503374956-c942862f0372?q=80&w=800",
          status: "watching",
          progress: "12/24",
          rating: 8.5,
          review: "哇库哇库！",
          created_at: Date.now() / 1000 - 172800
        },
        {
          id: 4,
          title: "鬼灭之刃",
          cover_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800",
          status: "plan",
          progress: "0/26",
          rating: 0,
          review: "",
          created_at: Date.now() / 1000 - 259200
        },
        {
          id: 5,
          title: "新世纪福音战士",
          cover_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800",
          status: "completed",
          progress: "完结",
          rating: 10,
          review: "勇敢的少年啊，快去创造奇迹！",
          created_at: Date.now() / 1000 - 345600
        }
      ],
    };
  }

  const { anime_db } = context.cloudflare.env;

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

export default function Bangumi({ loaderData }: Route.ComponentProps) {
  const { animes } = loaderData || { animes: [] };

  // 按状态分组
  const groupedAnimes = animes.reduce((acc: any, anime: any) => {
    const status = anime.status || "plan";
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(anime);
    return acc;
  }, {});

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

      {/* 番剧墙 - 海报流布局 */}
      <div className="space-y-12">
        {Object.entries(groupedAnimes).map(([status, statusAnimes]: [string, any[]]) => {
          const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.plan;

          return (
            <motion.section
              key={status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              {/* 状态标题 */}
              <div className="flex items-center gap-4 mb-6">
                <h2 className={`text-2xl font-bold ${config.color}`}>{config.label}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-30" style={{ color: config.color }} />
                <span className="text-sm text-slate-500">{statusAnimes.length} 部</span>
              </div>

              {/* 海报流 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {statusAnimes.map((anime: any, index: number) => (
                  <motion.div
                    key={anime.id}
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
                          <img
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
                ))}
              </div>
            </motion.section>
          );
        })}
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


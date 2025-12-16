import { Outlet, Link, useLocation } from "react-router";
import { motion } from "framer-motion";
import { GlassCard } from "~/components/ui/GlassCard";
import type { Route } from "./+types/articles";

export async function loader({ context }: Route.LoaderArgs) {
  const { anime_db } = context.cloudflare.env;

  try {
    const articlesResult = await anime_db
      .prepare(
        `SELECT id, slug, title, description, category, cover_image, views, created_at
         FROM articles
         ORDER BY created_at DESC`
      )
      .all();

    return {
      articles: articlesResult.results || [],
    };
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return { articles: [] };
  }
}

export default function Articles({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  const { articles } = loaderData || { articles: [] };

  // 如果有子路由（如文章详情），显示Outlet
  if (location.pathname !== '/articles') {
    return <Outlet />;
  }

  return (
    <div className="container mx-auto px-4 py-20">
      {/* 标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-primary-start via-primary-end to-pink-500 bg-clip-text text-transparent">
          所有文章
        </h1>
        <p className="text-slate-600 text-lg">错落有致，像散落的回忆</p>
      </motion.div>

      {/* Masonry 瀑布流布局 */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
        {articles.map((article: any, index: number) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
            className="break-inside-avoid mb-8"
          >
            <Link to={`/articles/${article.slug}`} className="block">
              <GlassCard className="overflow-hidden">
                {/* 封面图 */}
                {article.cover_image && (
                  <motion.div 
                    className="relative h-64 overflow-hidden rounded-t-3xl"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                  >
                    <img
                      src={article.cover_image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                    {/* 内部光泽效果 */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
                        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.2), inset 0 -20px 40px rgba(0,0,0,0.15)',
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                    {/* 分类标签 */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="inline-block px-4 py-1 bg-white/80 backdrop-blur-sm text-primary-start rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                        {article.category}
                      </span>
                    </div>
                  </motion.div>
                )}

                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 line-clamp-2 text-slate-800 hover:text-primary-start transition-colors">
                    {article.title}
                  </h3>

                  {article.description && (
                    <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                      {article.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-200/50">
                    <span>
                      {new Date(article.created_at * 1000).toLocaleDateString("zh-CN")}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>👁</span>
                      {article.views || 0}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center text-slate-500 py-20">
          <p className="text-xl">还没有文章，去后台创建第一篇吧！</p>
        </div>
      )}
    </div>
  );
}
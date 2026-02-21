import { GlassCard } from "~/components/layout/GlassCard";
import { GlitchText } from "~/components/animations/GlitchText";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import type { Route } from "./+types/home";
import { AnimeCard } from "~/components/anime/AnimeCard";

import type { Env } from "~/types/env";
import { getWithCache, CacheKeys } from "~/services/cache.server";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";

export async function loader({ context }: Route.LoaderArgs) {
  const env = context.cloudflare.env as unknown as Env;
  const { anime_db, CACHE_KV } = env;

  // 1. 数据库连接检查
  if (!anime_db) {
    console.error("CRITICAL: Database 'anime_db' is not bound or configured.");
    return {
      articles: [],
      animes: [],
      error: "Database connection failed"
    };
  }

  try {
    const data = await getWithCache(
      CACHE_KV,
      CacheKeys.HOME_DATA,
      async () => {
        // 2. 获取最新文章
        const articlesQuery = `
          SELECT id, slug, title, description, category, cover_image, views, created_at
          FROM articles
          ORDER BY created_at DESC
          LIMIT 6
        `;

        // 3. 获取正在追的番剧
        const animesQuery = `
          SELECT id, title, cover_url, status, progress, rating, review
          FROM animes
          WHERE status IN ('watching', 'completed')
          ORDER BY 
            CASE status
              WHEN 'watching' THEN 1
              WHEN 'completed' THEN 2
            END,
            created_at DESC
          LIMIT 4
        `;

        //并行执行查询以提高性能
        const [articlesResult, animesResult] = await Promise.all([
          anime_db.prepare(articlesQuery).all(),
          anime_db.prepare(animesQuery).all()
        ]);

        // 4. 检查查询错误
        if (!articlesResult.success) {
          console.error("Articles query failed:", articlesResult.error);
        }
        if (!animesResult.success) {
          console.error("Animes query failed:", animesResult.error);
        }

        return {
          articles: articlesResult.results || [],
          animes: animesResult.results || [],
        };
      },
      { ttl: 300 }
    );

    return data;
  } catch (error: any) {
    // 5. 详细错误日志
    console.error("Failed to fetch home data:", error);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }

    // 返回空数据而不是抛出500，保证页面至少能渲染部分内容
    return { articles: [], animes: [] };
  }
}

function GreetingText() {
  const [greeting, setGreeting] = useState("你好，旅人");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting("夜深了，旅人");
    else if (hour < 12) setGreeting("早上好，旅人");
    else if (hour < 18) setGreeting("下午好，旅人");
    else setGreeting("晚上好，旅人");
  }, []);

  return <>{greeting}</>;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { articles, animes } = loaderData;

  return (
    <div className="container mx-auto px-4 py-20">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col lg:flex-row items-center justify-between min-h-[70vh] px-4"
      >
        {/* Left: Greeting Text */}
        <div className="lg:w-1/2 mb-12 lg:mb-0 text-center lg:text-left">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent"
          >
            <GreetingText />
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl md:text-2xl text-slate-700 max-w-2xl font-light tracking-wide mb-8"
          >
            在这里分享关于动漫、游戏和技术的一切
          </motion.p>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-base md:text-lg text-slate-600 max-w-xl font-light mb-12"
          >
            沉浸在京阿尼/新海诚风格的世界中
          </motion.p>

          {/* Navigation Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex gap-4 flex-wrap justify-center lg:justify-start"
          >
            {[
              { name: "文章", path: "/articles" },
              { name: "归档", path: "/archive" },
              { name: "商城", path: "/shop" },
            ].map((item, index) => (
              <Link
                key={item.name}
                to={item.path}
              >
                <motion.div
                  className="px-8 py-3 bg-gradient-to-r from-primary-start to-primary-end text-white rounded-full font-bold text-lg uppercase tracking-wider"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.name}
                </motion.div>
              </Link>
            ))}
          </motion.div>
        </div>

        {/* Right: 3D Tilt Card */}
        <motion.div
          initial={{ opacity: 0, y: 50, rotateY: 20 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="lg:w-1/3 relative"
          style={{ perspective: 1000 }}
        >
          <motion.div
            className="glass-card rounded-3xl overflow-hidden shadow-xl"
            whileHover={{ scale: 1.05, rotateY: 5, rotateX: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="relative h-96">
              <OptimizedImage
                src="https://api.paugram.com/wallpaper/"
                alt="Anime illustration"
                className="w-full h-full object-cover"
                aspectRatio="portrait"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 right-6 z-10">
                <h3 className="text-white text-2xl font-bold mb-2">最新插画</h3>
                <p className="text-white/80 text-sm">沉浸在美好的二次元世界中</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Latest Articles Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="mt-32 mb-24"
      >
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            最新文章
          </h2>
          <Link
            to="/articles"
            className="text-gray-400 hover:text-pink-500 transition-colors flex items-center gap-2"
          >
            查看全部 <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article: any, index: number) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
            >
              <Link to={`/articles/${article.slug}`} className="block">
                <GlassCard
                  className="h-full flex flex-col overflow-hidden"
                  hoverEffect={false}
                >
                  {/* 封面图 - 占据卡片50%以上面积 */}
                  {article.cover_image && (
                    <motion.div
                      className="relative h-64 overflow-hidden rounded-t-3xl"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                    >
                      <OptimizedImage
                        src={article.cover_image}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                      {/* 内部光泽效果 - 防止图片太白导致文字看不清 */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
                          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.2), inset 0 -20px 40px rgba(0,0,0,0.15)',
                        }}
                      />
                      {/* 顶部高光，增加通透感 */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                      {/* 分类标签 - 悬浮在封面图上 */}
                      <div className="absolute top-4 left-4 z-10">
                        <span className="inline-block px-4 py-1 bg-white/80 backdrop-blur-sm text-primary-start rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                          {article.category}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <div className="p-6 flex-1 flex flex-col">
                    {/* 标题 */}
                    <h3 className="text-xl font-bold mb-3 line-clamp-2 text-slate-800 hover:text-primary-start transition-colors">
                      {article.title}
                    </h3>

                    {/* 摘要 */}
                    {article.description && (
                      <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">
                        {article.description}
                      </p>
                    )}

                    {/* 底部信息 */}
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
          <div className="text-center text-gray-500 py-20">
            <p className="text-xl">还没有文章，去后台创建第一篇吧！</p>
          </div>
        )}
      </motion.section>

      {/* Anime Section */}
      {animes.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mb-24"
        >
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
              追番记录
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {animes.map((anime: any, index: number) => (
              <motion.div
                key={anime.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + index * 0.1, duration: 0.5 }}
              >
                <AnimeCard {...anime} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}

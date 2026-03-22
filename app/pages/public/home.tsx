import { GlassCard } from "~/components/layout/GlassCard";
import { GlitchText } from "~/components/ui/animations/GlitchText";
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
    <div className="w-full max-w-[1400px] mx-auto pt-safe pb-24 md:pt-32 md:pb-32 px-4 sm:px-6 lg:px-8">
      {/* Hero Section - 极致留白与大呼吸感 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col lg:flex-row items-center justify-between min-h-[50vh] md:min-h-[60vh] px-2 mb-20 md:mb-32 gap-16 lg:gap-8"
      >
        {/* Left: 问候文本群 */}
        <div className="lg:w-1/2 text-left w-full">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-sans font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]"
          >
            <GreetingText />
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl md:text-3xl text-slate-500 dark:text-slate-400 font-medium tracking-tight mb-4"
          >
            在这里分享关于动漫、游戏和技术的一切
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg text-slate-400 dark:text-slate-500 font-normal mb-12"
          >
            沉浸在京阿尼与新海诚世界交错的平行线中。
          </motion.p>

          {/* iOS 风格的胶囊入口按钮组 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap gap-4"
          >
            {[
              { name: "全部文章", path: "/articles", isPrimary: true },
              { name: "时光机", path: "/archive", isPrimary: false },
              { name: "杂货铺", path: "/shop", isPrimary: false },
            ].map((item, index) => (
              <Link key={item.name} to={item.path}>
                <div
                  className={`px-8 py-3.5 rounded-full font-bold text-[15px] transition-all duration-300 ${
                    item.isPrimary
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md hover:shadow-lg hover:scale-[1.02]"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-[1.02]"
                  }`}
                >
                  {item.name}
                </div>
              </Link>
            ))}
          </motion.div>
        </div>

        {/* Right: Apple Store 巨幕焦点图 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:w-1/2 w-full max-w-2xl mx-auto relative group flex items-center justify-center"
        >
          {/* 取消了锁死的 4/5 比例，改为自适应或横向偏好的流体边框，防止原生大图被暴力覆盖与裁切 */}
          <div className="w-full relative rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl shadow-indigo-500/10 dark:shadow-none border border-black/5 dark:border-white/10 group-hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-700">
            {/* 使用 aspect-video 或宽幅比例更适合二次元插画的展示而不丢失头部 */}
            <div className="relative aspect-auto md:aspect-video w-full min-h-[300px]">
                <OptimizedImage
                src="https://api.paugram.com/wallpaper/"
                alt="Anime illustration"
                className="absolute inset-0 w-full h-full object-cover md:object-contain bg-slate-100 dark:bg-[#0A0A0A] transform group-hover:scale-105 transition-transform duration-1000 ease-out"
                />
            </div>
            {/* 渐变遮罩压身 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none opacity-80" />
            <div className="absolute bottom-8 left-8 right-8 z-10 flex flex-col items-start translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-bold tracking-wider uppercase mb-3 border border-white/20">
                编辑精选
              </span>
              <h3 className="text-white text-2xl md:text-3xl font-black tracking-tight mb-2 leading-tight drop-shadow-lg">次元倒影</h3>
              <p className="text-white/80 text-sm md:text-base font-medium drop-shadow-md">每天发现不一样的梦境瞬间</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Latest Articles Section - iOS Matrix 卡片 */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mb-20 md:mb-32"
      >
        <div className="flex items-end justify-between mb-8 md:mb-12 px-2">
          <div>
            <h2 className="text-4xl md:text-5xl font-sans font-black tracking-tight text-slate-900 dark:text-white mb-2">
              最新文章
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">新世界的资讯</p>
          </div>
          <Link
            to="/articles"
            className="text-slate-600 dark:text-slate-300 font-semibold hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 text-[15px] bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200/50 dark:border-white/5"
          >
            浏览全部 <span className="font-serif">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {articles.map((article: any, index: number) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link to={`/articles/${article.slug}`} className="block h-full group">
                <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/40 rounded-[28px] md:rounded-[32px] overflow-hidden border border-slate-200/50 dark:border-white/5 transition-all duration-500 hover:shadow-xl hover:shadow-slate-200 dark:hover:shadow-none dark:hover:border-white/10">
                  {/* 极简无界封面 */}
                  {article.cover_image && (
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <OptimizedImage
                        src={article.cover_image}
                        alt={article.title}
                        className="w-full h-full object-cover transform group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                      />
                      <div className="absolute top-4 left-4 z-10">
                        <span className="px-3 py-1.5 bg-white/90 dark:bg-black/50 backdrop-blur-md text-slate-900 dark:text-white shadow-sm rounded-full text-[11px] font-bold uppercase tracking-wider">
                          {article.category}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3 line-clamp-2 leading-snug group-hover:text-amber-500 transition-colors">
                        {article.title}
                      </h3>
                      {article.description && (
                        <p className="text-[15px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-normal mb-8">
                          {article.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[13px] font-medium text-slate-400">
                      <span>{new Date(article.created_at * 1000).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                        <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        {article.views || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                 <span className="text-3xl opacity-50">📰</span>
             </div>
             <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">暂无文章记录</p>
          </div>
        )}
      </motion.section>

      {/* Anime Section - 稳固排列 */}
      {animes.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 md:mb-24"
        >
          <div className="flex items-end justify-between mb-8 md:mb-12 px-2">
            <div>
              <h2 className="text-4xl md:text-5xl font-sans font-black tracking-tight text-slate-900 dark:text-white mb-2">
                在看番剧
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">当前轨迹</p>
            </div>
            <Link
              to="/bangumi"
              className="text-slate-600 dark:text-slate-300 font-semibold hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 text-[15px] bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200/50 dark:border-white/5"
            >
              所有番剧 <span className="font-serif">→</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
            {animes.map((anime: any, index: number) => (
              <motion.div
                key={anime.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
              >
                {/* 套用原先 AnimeCard，并将其隐匿在 Apple 包装下，此处复用我们改造 AnimeCard 之后的极简版本 */}
                <AnimeCard {...anime} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}

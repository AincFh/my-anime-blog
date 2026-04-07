import { GlassCard } from "~/components/layout/GlassCard";
import { GlitchText } from "~/components/ui/animations/GlitchText";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { BookOpen, Clapperboard, ShoppingBag, Sparkles, FileText } from "lucide-react";
import type { Route } from "./+types/home";
import { AnimeCard } from "~/components/anime/AnimeCard";

import type { Env } from "~/types/env";
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
    // 直接查询数据库，不使用缓存
    // 获取最新文章（仅查询已发布的）
    const articlesQuery = `
      SELECT id, slug, title, summary, category, cover_image, views, created_at
      FROM articles
      WHERE status = 'published'
      ORDER BY created_at DESC
      LIMIT 6
    `;

    // 获取正在追的番剧
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
      LIMIT 8
    `;

    // 并行执行查询以提高性能
    const [articlesResult, animesResult] = await Promise.all([
      anime_db.prepare(articlesQuery).all(),
      anime_db.prepare(animesQuery).all()
    ]);

    // 检查查询错误
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
    if (hour >= 0 && hour < 5) setGreeting("凌晨好，旅人");
    else if (hour >= 5 && hour < 8) setGreeting("黎明将至，旅人");
    else if (hour >= 8 && hour < 12) setGreeting("早安，旅人");
    else if (hour >= 12 && hour < 14) setGreeting("午安，旅人");
    else if (hour >= 14 && hour < 18) setGreeting("下午好，旅人");
    else if (hour >= 18 && hour < 20) setGreeting("傍晚好，旅人");
    else if (hour >= 20 && hour < 24) setGreeting("晚上好，旅人");
  }, []);

  return <>{greeting}</>;
}

// 时间指示器组件
function TimeIndicator() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      setTime(now.toLocaleTimeString('zh-CN', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400 tracking-wide">
      {time}
    </span>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { articles, animes } = loaderData;

  return (
    <div className="w-full max-w-[1600px] mx-auto pt-[70px] md:pt-[80px] pb-24 md:pb-32 px-4 md:px-6 lg:px-10 xl:px-12">
      {/* Hero Section - 放大占满首屏 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col lg:flex-row items-center justify-between min-h-[80vh] lg:min-h-[70vh] mb-16 md:mb-24 gap-8 lg:gap-16"
      >
        {/* Left: 问候文本群 */}
        <div className="lg:w-3/5 text-left w-full">
          {/* 时间指示器 */}
          <div className="flex items-center gap-3 mb-6">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-start opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-start"></span>
            </span>
            <TimeIndicator />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-sans font-black tracking-tight text-slate-800 dark:text-slate-100 mb-6 leading-[1.05]"
          >
            <GreetingText />
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap gap-4"
          >
            {[
              { name: "探索文章", path: "/articles", isPrimary: true, icon: BookOpen },
              { name: "时光机", path: "/archive", isPrimary: false, icon: Clapperboard },
              { name: "杂货铺", path: "/shop", isPrimary: false, icon: ShoppingBag },
            ].map((item, index) => (
              <Link key={item.name} to={item.path} className="group">
                <div
                  className={`flex items-center gap-3 px-6 md:px-8 py-3.5 rounded-full font-bold text-[15px] transition-all duration-300 backdrop-blur-xl ${
                    item.isPrimary
                      ? "bg-gradient-to-r from-primary-start to-primary-end text-white shadow-lg shadow-primary-start/25 hover:shadow-xl hover:shadow-primary-start/30 hover:scale-[1.02]"
                      : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700/80 border border-slate-200/50 dark:border-white/10 hover:scale-[1.02]"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </div>
              </Link>
            ))}
          </motion.div>

          {/* 底部统计数据 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex items-center gap-6 mt-10 text-sm text-slate-500 dark:text-slate-400"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-start" />
              <span>{articles.length || 0} 篇内容</span>
            </div>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-primary-end" />
              <span>{animes.length || 0} 部番剧</span>
            </div>
          </motion.div>
        </div>

        {/* Right: Apple Store 巨幕焦点图 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:w-2/5 w-full max-w-2xl mx-auto relative group"
        >
          {/* 玻璃态框架 */}
          <div className="relative rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl shadow-primary-start/10 dark:shadow-none border border-white/50 dark:border-white/10 backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 group-hover:shadow-[0_25px_70px_-15px_rgba(255,159,67,0.2)] transition-all duration-700">
            {/* 图片容器 */}
            <div className="relative aspect-[4/3] w-full">
              <OptimizedImage
                src="https://api.paugram.com/wallpaper/"
                alt="Anime illustration"
                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-out"
              />
              {/* 渐变遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              
              {/* 内容层 */}
              <div className="absolute bottom-6 left-6 right-6 z-10">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-bold tracking-wider uppercase mb-3 border border-white/20">
                  <Sparkles className="w-3 h-3" />
                  编辑精选
                </span>
                <h3 className="text-white text-xl md:text-2xl font-black tracking-tight mb-1 leading-tight drop-shadow-lg">次元倒影</h3>
                <p className="text-white/70 text-sm font-medium drop-shadow-md">每天发现不一样的梦境瞬间</p>
              </div>
            </div>
          </div>
          
          {/* 装饰性光晕 */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-start/20 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary-end/20 rounded-full blur-3xl -z-10" />
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
            <h2 className="text-4xl md:text-5xl font-sans font-black tracking-tight text-slate-700 dark:text-slate-200 mb-2">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8 md:gap-10 2xl:gap-12">
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
                      <h3 className="text-xl md:text-2xl font-bold tracking-tight text-slate-700 dark:text-slate-200 mb-3 line-clamp-2 leading-snug group-hover:text-amber-500 transition-colors">
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
              <h2 className="text-4xl md:text-5xl font-sans font-black tracking-tight text-slate-700 dark:text-slate-200 mb-2">
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

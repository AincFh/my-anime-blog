import { GlassCard } from "~/components/ui/layout/GlassCard";
import { GlitchText } from "~/components/ui/animations/GlitchText";
import { motion } from "framer-motion";
import { Link } from "react-router";
import type { Route } from "./+types/home";
import { AnimeCard } from "~/components/anime/AnimeCard";

export async function loader({ context }: Route.LoaderArgs) {
  // 在本地开发环境中，context.cloudflare 可能是 undefined
  // 因此需要添加适当的检查和回退数据
  if (!context || !context.cloudflare || !context.cloudflare.env) {
    // 本地开发环境：返回模拟数据（不使用外部图片API）
    console.log("Running in local development mode, returning mock data");
    return {
      articles: [
        {
          id: 1,
          slug: "welcome-to-my-blog",
          title: "欢迎来到我的动漫博客",
          description: "这是我的第一篇博客文章，介绍了这个博客的功能和特色。",
          category: "公告",
          cover_image: null, // 不使用外部图片
          views: 123,
          created_at: Date.now() / 1000
        },
        {
          id: 2,
          slug: "my-favorite-anime-2024",
          title: "2024年我最喜爱的动漫推荐",
          description: "分享我在2024年观看的一些优秀动漫作品。",
          category: "动漫推荐",
          cover_image: null,
          views: 456,
          created_at: Date.now() / 1000 - 86400
        }
      ],
      animes: [
        {
          id: 1,
          title: "进击的巨人",
          cover_url: null,
          status: "completed",
          progress: 139,
          rating: 9.5,
          review: "史诗级的故事，震撼的结局。"
        },
        {
          id: 2,
          title: "鬼灭之刃",
          cover_url: null,
          status: "watching",
          progress: 45,
          rating: 9.2,
          review: "精美的画面，感人的故事。"
        }
      ]
    };
  }

  try {
    // Cloudflare Workers 环境：从数据库获取真实数据
    const { anime_db } = context.cloudflare.env;

    // 获取最新文章
    const articlesResult = await anime_db
      .prepare(
        `SELECT id, slug, title, description, category, cover_image, views, created_at
         FROM articles
         ORDER BY created_at DESC
         LIMIT 6`
      )
      .all();

    // 获取正在追的番剧
    const animesResult = await anime_db
      .prepare(
        `SELECT id, title, cover_url, status, progress, rating, review
         FROM animes
         WHERE status IN ('watching', 'completed')
         ORDER BY 
           CASE status
             WHEN 'watching' THEN 1
             WHEN 'completed' THEN 2
           END,
           created_at DESC
         LIMIT 4`
      )
      .all();

    return {
      articles: articlesResult.results || [],
      animes: animesResult.results || [],
    };
  } catch (error) {
    console.error("Failed to fetch home data:", error);
    return { articles: [], animes: [] };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { articles, animes } = loaderData;

  return (
    <div className="container mx-auto px-4 py-20">
      {/* Hero Section - 优化版：减少动画延迟，提升 LCP */}
      <div className="flex flex-col lg:flex-row items-center justify-between min-h-[80vh] px-4 relative z-10">
        {/* Left: Greeting Text - 立即显示，无延迟 */}
        <div className="lg:w-1/2 mb-12 lg:mb-0 text-center lg:text-left">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-display text-at-orange tracking-[0.2em] uppercase mb-2">
              System Online
            </h2>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-at-orange via-at-red to-at-purple bg-clip-text text-transparent font-display leading-tight">
              A.T. FIELD
              <br />
              <span className="text-4xl md:text-6xl lg:text-7xl text-slate-800 dark:text-slate-200 font-sans font-light">
                下午好，旅人
              </span>
            </h1>
          </div>

          {/* LCP 元素 - 立即显示，无动画延迟 */}
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl font-light tracking-wide mb-8 border-l-4 border-at-orange pl-6">
            绝对领域展开中... <br />
            在这里分享关于动漫、游戏和技术的一切
          </p>

          {/* Navigation Links - 轻量动画 */}
          <div className="flex gap-6 flex-wrap justify-center lg:justify-start">
            {[
              { name: "文章", path: "/articles", color: "from-at-orange to-at-red" },
              { name: "归档", path: "/archive", color: "from-at-purple to-blue-500" },
            ].map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`px-10 py-4 bg-gradient-to-r ${item.color} text-white rounded-xl font-display font-bold text-lg uppercase tracking-widest shadow-lg relative overflow-hidden group transition-transform hover:scale-105 hover:-translate-y-1 active:scale-95`}
              >
                <span className="relative z-10">{item.name}</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Hero Card - 简化版，使用 CSS 渐变替代外部图片 */}
        <div className="lg:w-5/12 relative">
          <div className="glass-card rounded-3xl overflow-hidden shadow-2xl border border-white/20 animate-float">
            <div className="relative aspect-[4/5]">
              {/* 使用 CSS 渐变替代外部图片 */}
              <div
                className="w-full h-full"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #fda085 100%)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Card Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-at-orange text-white text-xs font-display font-bold rounded">LIVE</span>
                  <span className="text-at-orange font-display text-xs tracking-widest">SYNC RATE: 400%</span>
                </div>
                <h3 className="text-white text-3xl font-bold mb-2 font-display">LATEST VISUAL</h3>
                <p className="text-white/80 text-sm font-light">沉浸在美好的二次元世界中</p>
              </div>

              {/* Decorative HUD Elements - 使用 CSS 动画 */}
              <div className="absolute top-4 right-4 w-12 h-12 border-2 border-white/30 rounded-full border-t-at-orange animate-spin-slow" />
              <div className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center text-white/50 text-[10px] font-display">01</div>
            </div>
          </div>

          {/* Floating Elements - 使用 CSS 动画 */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-at-orange/20 blur-2xl animate-pulse-slow" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-at-purple/20 blur-2xl animate-pulse-slower" />
        </div>
      </div>

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
                      <img
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

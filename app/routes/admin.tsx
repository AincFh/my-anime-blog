import { motion } from "framer-motion";
import { Link, Outlet, useLocation, redirect } from "react-router";
import type { Route } from "./+types/admin";
import { TrafficRadar } from "~/components/admin/TrafficRadar";
import { CommentManager } from "~/components/admin/CommentManager";
import { MemoPad } from "~/components/admin/MemoPad";
import { SystemHealth } from "~/components/admin/SystemHealth";
import { DailyQuests } from "~/components/admin/DailyQuests";

export async function loader({ request, context }: Route.LoaderArgs) {
  // 检查 admin_session cookie
  const sessionId = request.headers.get("Cookie")?.match(/admin_session=([^;]+)/)?.[1];

  const { anime_db } = context.cloudflare.env;

  // 如果没有 session，跳转登录
  if (!sessionId) {
    throw redirect("/admin/login");
  }

  // 验证 session 是否有效
  try {
    const session = await anime_db.prepare(
      "SELECT * FROM sessions WHERE token = ? AND expires_at > unixepoch()"
    ).bind(sessionId).first();

    if (!session) {
      throw redirect("/admin/login");
    }
  } catch (e) {
    console.error("Session validation error:", e);
    throw redirect("/admin/login");
  }

  // 获取真实统计数据
  let stats = {
    pv: 0,
    uv: 0,
    articles: 0,
    words: 0,
    comments: 0,
    likes: 0,
    storage: 0,
  };

  try {
    // 文章数
    const articlesCount = await anime_db.prepare("SELECT COUNT(*) as count FROM articles").first();
    stats.articles = (articlesCount as any)?.count || 0;

    // 评论数
    const commentsCount = await anime_db.prepare("SELECT COUNT(*) as count FROM comments").first();
    stats.comments = (commentsCount as any)?.count || 0;

    // 番剧数 (作为 likes 展示)
    const animesCount = await anime_db.prepare("SELECT COUNT(*) as count FROM animes").first();
    stats.likes = (animesCount as any)?.count || 0;

    // 总浏览量
    const totalViews = await anime_db.prepare("SELECT SUM(views) as total FROM articles").first();
    stats.pv = (totalViews as any)?.total || 0;
  } catch (e) {
    console.error("Failed to fetch stats:", e);
  }

  // Fetch pending comments
  let pendingComments: any[] = [];
  try {
    const result = await anime_db.prepare(
      "SELECT * FROM comments WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5"
    ).all();
    if (result.results) {
      pendingComments = result.results;
    }
  } catch (e) {
    console.error("Failed to fetch pending comments", e);
  }

  return {
    stats,
    pendingComments,
  };
}

export default function Admin({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  const isRoot = location.pathname === "/admin";
  const { stats, pendingComments } = loaderData;

  if (!isRoot) {
    return <Outlet />;
  }

  // RPG风格状态卡片（使用等宽字体）
  const StatCard = ({
    title,
    value,
    max,
    color,
    icon,
    unit = "",
    percentage,
  }: {
    title: string;
    value: number;
    max: number;
    color: string;
    icon: string;
    unit?: string;
    percentage: number;
  }) => {
    return (
      <motion.div
        className="glass-card-deep p-6 tech-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{icon}</span>
            <h3 className="font-bold text-white/90 tracking-wide">{title}</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-neon" style={{ color, textShadow: `0 0 10px ${color}` }}>
              {value.toLocaleString()}
              <span className="text-sm ml-1 opacity-70">{unit}</span>
            </div>
            {max > 0 && (
              <div className="text-xs text-white/40 font-mono">/ {max.toLocaleString()}</div>
            )}
          </div>
        </div>
        {/* 进度条 */}
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full relative overflow-hidden"
            style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite]"></div>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  // 系统日志
  const systemLogs = [
    { time: "10:00", action: "数据库备份成功", icon: "✅" },
    { time: "09:30", action: "拦截一次恶意攻击", icon: "🛡️" },
    { time: "08:15", action: "缓存刷新完成", icon: "🔄" },
  ];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-white mb-8 font-orbitron tracking-wider flex items-center gap-3">
          <span className="text-violet-400">///</span> 指挥中心
        </h1>

        {/* 第一行：RPG 属性卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="HP (今日访问)"
            value={stats.pv}
            max={2000}
            color="#EF4444"
            icon="❤️"
            unit=" PV"
            percentage={70}
          />
          <StatCard
            title="MP (文章数)"
            value={stats.articles}
            max={100}
            color="#3B82F6"
            icon="💙"
            unit=" 篇"
            percentage={42}
          />
          <StatCard
            title="EXP (总互动)"
            value={stats.comments}
            max={100}
            color="#F59E0B"
            icon="⭐"
            unit=" 评"
            percentage={88}
          />
          <StatCard
            title="Bag (R2存储)"
            value={stats.storage}
            max={10000}
            color="#10B981"
            icon="🎒"
            unit=" MB"
            percentage={12}
          />
        </div>

        {/* 第二行：主控区 - 3栏布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* 流量雷达 (50%) */}
          <div className="lg:col-span-6">
            <TrafficRadar />
          </div>

          {/* 每日任务 (25%) */}
          <div className="lg:col-span-3">
            <DailyQuests />
          </div>

          {/* 灵感便签 (25%) */}
          <div className="lg:col-span-3">
            <MemoPad />
          </div>
        </div>

        {/* 第三行：日志区 - 2栏布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 系统日志 */}
          <div className="glass-card-deep p-6 tech-border">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-orbitron">
              <span className="text-violet-400">::</span> 系统日志
            </h2>
            <div className="space-y-3">
              {systemLogs.map((log, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="text-xl">{log.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm text-white/90">{log.action}</p>
                    <p className="text-xs text-white/40 font-mono">{log.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 最新留言 */}
          <div className="glass-card-deep p-6 tech-border">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-orbitron">
              <span className="text-violet-400">::</span> 待审核留言
            </h2>
            <div className="space-y-3">
              <CommentManager initialComments={pendingComments || []} />
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/admin/article/new">
            <motion.div
              className="glass-card-deep p-6 tech-border cursor-pointer group"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col items-center text-center">
                <span className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">✍️</span>
                <h3 className="font-bold text-pink-400 mb-2 font-orbitron tracking-wide group-hover:text-pink-300">撰写手记</h3>
                <p className="text-sm text-white/50">开始创作新内容</p>
              </div>
            </motion.div>
          </Link>

          <Link to="/admin/anime/manage">
            <motion.div
              className="glass-card-deep p-6 tech-border cursor-pointer group"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col items-center text-center">
                <span className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🎬</span>
                <h3 className="font-bold text-blue-400 mb-2 font-orbitron tracking-wide group-hover:text-blue-300">番剧记录</h3>
                <p className="text-sm text-white/50">管理我的追番</p>
              </div>
            </motion.div>
          </Link>

          <Link to="/admin/gallery">
            <motion.div
              className="glass-card-deep p-6 tech-border cursor-pointer group"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col items-center text-center">
                <span className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🖼️</span>
                <h3 className="font-bold text-purple-400 mb-2 font-orbitron tracking-wide group-hover:text-purple-300">影像仓库</h3>
                <p className="text-sm text-white/50">管理图片资源</p>
              </div>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

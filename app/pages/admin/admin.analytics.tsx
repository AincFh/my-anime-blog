import { motion } from "framer-motion";
import type { Route } from "./+types/admin.analytics";
import { redirect } from "react-router";
import { getSessionId } from "~/utils/auth";
import { BarChart3, Eye, FileText, MessageSquare, Users, TrendingUp, Heart, Clock } from "lucide-react";

// ==================== 数据加载 ====================
export async function loader({ request, context }: Route.LoaderArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) throw redirect("/panel/login");

  const { anime_db } = (context as any).cloudflare.env;

  // 文章浏览量 TOP 10
  let topArticles: { title: string; views: number; likes: number }[] = [];
  // 评论统计
  let commentStats = { total: 0, pending: 0, spam: 0, approved: 0 };
  // 用户统计
  let userStats = { total: 0, recentSignups: 0 };
  // 内容概览
  let contentStats = { articles: 0, totalViews: 0, totalLikes: 0, avgViews: 0 };

  try {
    // 文章 TOP 10
    const articlesResult = await anime_db
      .prepare("SELECT title, views, likes FROM articles ORDER BY views DESC LIMIT 10")
      .all();
    topArticles = (articlesResult.results || []).map((r: any) => ({
      title: r.title,
      views: r.views || 0,
      likes: r.likes || 0,
    }));

    // 内容概览
    const contentResult = await anime_db
      .prepare("SELECT COUNT(*) as count, SUM(views) as totalViews, SUM(likes) as totalLikes, AVG(views) as avgViews FROM articles")
      .first();
    if (contentResult) {
      contentStats = {
        articles: (contentResult as any).count || 0,
        totalViews: (contentResult as any).totalViews || 0,
        totalLikes: (contentResult as any).totalLikes || 0,
        avgViews: Math.round((contentResult as any).avgViews || 0),
      };
    }

    // 评论分类统计
    const totalComments = await anime_db.prepare("SELECT COUNT(*) as c FROM comments").first();
    const pendingComments = await anime_db.prepare("SELECT COUNT(*) as c FROM comments WHERE status = 'pending'").first();
    const spamComments = await anime_db.prepare("SELECT COUNT(*) as c FROM comments WHERE is_spam = 1").first();
    commentStats = {
      total: (totalComments as any)?.c || 0,
      pending: (pendingComments as any)?.c || 0,
      spam: (spamComments as any)?.c || 0,
      approved: ((totalComments as any)?.c || 0) - ((pendingComments as any)?.c || 0) - ((spamComments as any)?.c || 0),
    };

    // 用户统计
    const totalUsers = await anime_db.prepare("SELECT COUNT(*) as c FROM users").first();
    const recentUsers = await anime_db.prepare("SELECT COUNT(*) as c FROM users WHERE created_at > ?").bind(Math.floor(Date.now() / 1000) - 7 * 86400).first();
    userStats = {
      total: (totalUsers as any)?.c || 0,
      recentSignups: (recentUsers as any)?.c || 0,
    };
  } catch (e) {
    console.error("Analytics data fetch failed:", e);
  }

  return { topArticles, commentStats, userStats, contentStats };
}

// ==================== 组件 ====================
export default function AdminAnalytics({ loaderData }: Route.ComponentProps) {
  const { topArticles, commentStats, userStats, contentStats } = loaderData;

  const maxViews = topArticles.length > 0 ? Math.max(...topArticles.map(a => a.views)) : 1;

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight font-orbitron flex items-center gap-3">
          <BarChart3 className="text-blue-500" />
          数据分析中心
        </h1>
        <p className="text-white/50 text-sm mt-1">基于 D1 数据库的实时统计面板，所有数据均为真实生产数据。</p>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<FileText size={20} />} label="文章总数" value={contentStats.articles} color="violet" />
        <MetricCard icon={<Eye size={20} />} label="总浏览量" value={contentStats.totalViews} color="blue" />
        <MetricCard icon={<Heart size={20} />} label="总点赞" value={contentStats.totalLikes} color="pink" />
        <MetricCard icon={<TrendingUp size={20} />} label="篇均浏览" value={contentStats.avgViews} color="emerald" />
      </div>

      {/* 双列布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 文章浏览量 TOP 10 */}
        <motion.div
          className="lg:col-span-8 bg-[#0f1629]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-xl"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-2 h-6 bg-gradient-to-b from-blue-400 to-indigo-600 rounded-full" />
            文章浏览量 TOP {topArticles.length}
          </h2>
          <div className="space-y-3">
            {topArticles.length === 0 ? (
              <p className="text-white/30 text-center py-8">暂无文章数据</p>
            ) : (
              topArticles.map((article, index) => (
                <div key={index} className="flex items-center gap-4 group">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${index < 3 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-white/5 text-white/30 border border-white/10"}`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white/80 truncate group-hover:text-violet-300 transition-colors">{article.title}</p>
                    <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(article.views / maxViews) * 100}%` }}
                        transition={{ duration: 0.6, delay: index * 0.05 }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs font-mono text-white/40 flex items-center gap-1">
                      <Eye size={12} /> {article.views}
                    </span>
                    <span className="text-xs font-mono text-pink-400/50 flex items-center gap-1">
                      <Heart size={12} /> {article.likes}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* 右侧面板 */}
        <div className="lg:col-span-4 space-y-6">
          {/* 评论健康度 */}
          <motion.div
            className="bg-[#0f1629]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-xl"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-2 h-5 bg-gradient-to-b from-fuchsia-400 to-pink-600 rounded-full" />
              评论健康度
            </h2>
            <div className="space-y-4">
              <CommentBar label="已通过" count={commentStats.approved} total={commentStats.total} color="bg-emerald-500" />
              <CommentBar label="待审核" count={commentStats.pending} total={commentStats.total} color="bg-amber-500" />
              <CommentBar label="垃圾评论" count={commentStats.spam} total={commentStats.total} color="bg-red-500" />
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 text-center">
              <span className="text-3xl font-black text-white font-orbitron">{commentStats.total}</span>
              <span className="text-sm text-white/30 ml-2">条评论总计</span>
            </div>
          </motion.div>

          {/* 用户增长 */}
          <motion.div
            className="bg-[#0f1629]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-xl"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-2 h-5 bg-gradient-to-b from-blue-400 to-cyan-600 rounded-full" />
              用户增长
            </h2>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-black text-white font-orbitron">{userStats.total}</p>
                <p className="text-sm text-white/40 mt-1">注册用户总数</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-emerald-400">
                  <TrendingUp size={16} />
                  <span className="text-lg font-bold">+{userStats.recentSignups}</span>
                </div>
                <p className="text-[10px] text-white/30 mt-0.5">近 7 天新增</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ==================== 子组件 ====================
function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    violet: "from-violet-500/20 to-violet-600/5 border-violet-500/20 text-violet-400",
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400",
    pink: "from-pink-500/20 to-pink-600/5 border-pink-500/20 text-pink-400",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
  };
  const cls = colorMap[color] || colorMap.violet;

  return (
    <motion.div
      className={`bg-gradient-to-br ${cls} border rounded-3xl p-6 flex flex-col gap-3 backdrop-blur-xl relative overflow-hidden group hover:scale-[1.02] transition-transform`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center ${cls.split(' ').pop()}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-black text-white font-orbitron">{value.toLocaleString()}</p>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

function CommentBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-bold text-white/60">{label}</span>
        <span className="text-xs font-mono text-white/30">{count} ({percent.toFixed(1)}%)</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  );
}

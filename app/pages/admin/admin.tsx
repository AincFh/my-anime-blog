import { motion, AnimatePresence } from "framer-motion";
import { Link, Outlet, useLocation, redirect } from "react-router";
import type { Route } from "./+types/admin";
import { useState, useEffect } from "react";
import { Menu, X, Home, FileText, MessageSquare, Image as ImageIcon, Settings, LogOut, ChevronRight, BarChart3, Users, Trophy, ShoppingBag, Crown, ShieldAlert, Zap, Globe } from "lucide-react";
import { AdminMusicPlayer } from "~/components/admin/AdminMusicPlayer";

export async function loader({ request, context }: Route.LoaderArgs) {
  const sessionId = request.headers.get("Cookie")?.match(/admin_session=([^;]+)/)?.[1];
  const { anime_db } = (context as any).cloudflare.env;

  if (!sessionId) throw redirect("/panel/login");

  try {
    const session = await anime_db.prepare(
      "SELECT * FROM admin_sessions WHERE token = ? AND expires_at > datetime('now')"
    ).bind(sessionId).first();
    if (!session) throw redirect("/panel/login");
  } catch (e) {
    if (e instanceof Response) throw e;
    throw redirect("/panel/login");
  }

  let stats = { pv: 0, uv: 0, articles: 0, comments: 0, likes: 0, storage: 0 };
  let pendingComments: any[] = [];

  try {
    const articlesCount = await anime_db.prepare("SELECT COUNT(*) as count FROM articles").first();
    stats.articles = (articlesCount as any)?.count || 0;

    const commentsCount = await anime_db.prepare("SELECT COUNT(*) as count FROM comments").first();
    stats.comments = (commentsCount as any)?.count || 0;

    const totalViews = await anime_db.prepare("SELECT SUM(views) as total FROM articles").first();
    stats.pv = (totalViews as any)?.total || 0;

    const result = await anime_db.prepare(
      "SELECT * FROM comments WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5"
    ).all();
    if (result.results) pendingComments = result.results;
  } catch (e) {
    console.error("Failed to fetch stats:", e);
  }

  let musicPlaylistId = "";
  let godMode: any = null;
  let userCount = 0;
  try {
    const usersCount = await anime_db.prepare("SELECT COUNT(*) as count FROM users").first();
    userCount = (usersCount as any)?.count || 0;

    const settingsResult = await anime_db.prepare("SELECT config_json FROM system_settings WHERE id = 1").first();
    if (settingsResult && (settingsResult as any).config_json) {
      const config = JSON.parse((settingsResult as any).config_json);
      musicPlaylistId = config.features?.music?.playlist_id || "";

      if (config.god_mode?.enabled) {
        godMode = config.god_mode;
      }
    }
  } catch (e) {
    console.warn("Settings or user count failed", e);
  }

  // 计算实时在线 (上帝模拟)
  let onlineUsers = Math.floor(Math.random() * 10) + 5;
  if (godMode?.enabled) {
    const min = godMode.simulated_online_users_min || 0;
    const max = godMode.simulated_online_users_max || 10;
    onlineUsers = Math.floor(Math.random() * (max - min + 1)) + min;
  }

  return {
    stats,
    pendingComments,
    musicPlaylistId,
    godMode,
    userCount,
    onlineUsers
  };
}

const navItems = [
  { to: "/admin", label: "控制台", icon: Home, exact: true },
  { to: "/admin/articles", label: "文章管理", icon: FileText, prefix: "/admin/article" },
  { to: "/admin/comments", label: "评论管理", icon: MessageSquare },
  { to: "/admin/gallery", label: "图库管理", icon: ImageIcon },
  { to: "/admin/users", label: "用户管理", icon: Users },
  { to: "/admin/missions", label: "使命管理", icon: Trophy },
  { to: "/admin/shop", label: "商店库管", icon: ShoppingBag },
  { to: "/admin/membership", label: "会员配置", icon: Crown },
  { to: "/admin/analytics", label: "数据分析", icon: BarChart3 },
  { to: "/admin/settings", label: "系统设置", icon: Settings },
];

function SidebarContent({ pathname, musicPlaylistId }: { pathname: string; musicPlaylistId: string }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/50">
            A
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm font-orbitron">管理后台</h2>
            <p className="text-xs text-violet-400/70">MAGI v2.0</p>
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.to : pathname.startsWith(item.prefix || item.to);
            return (
              <Link key={item.to} to={item.to} className="block group relative">
                <motion.div
                  className={`px-4 py-3 rounded-2xl flex items-center gap-4 transition-all duration-300 ${isActive
                    ? "bg-violet-500/15 border border-violet-500/30 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                    }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-violet-400" : ""} />
                  <span className={`font-medium text-sm ${isActive ? "font-semibold" : ""}`}>{item.label}</span>
                  {isActive && (
                    <motion.div layoutId="activeNavTab" className="absolute left-[-4px] w-1.5 h-6 bg-violet-500 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 w-full">
        <AdminMusicPlayer />
      </div>
    </div>
  );
}

export default function Admin({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  const isRoot = location.pathname === "/admin";
  const { stats, pendingComments, musicPlaylistId, godMode, userCount, onlineUsers } = loaderData;

  const displayStats = {
    pv: godMode?.enabled ? stats.pv + (godMode.fake_total_views_offset || 0) : stats.pv,
    users: godMode?.enabled ? userCount + (godMode.fake_user_count_offset || 0) : userCount,
    online: onlineUsers
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-[100dvh] bg-[#0a0e1a] overflow-hidden font-sans text-white/90">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-[#0f1629]/80 backdrop-blur-3xl border-r border-violet-500/20 z-30">
        <SidebarContent pathname={location.pathname} musicPlaylistId={musicPlaylistId} />
      </aside>

      {/* Mobile Top Navbar */}
      <header className="md:hidden fixed top-0 w-full h-16 bg-[#0f1629]/90 backdrop-blur-xl border-b border-violet-500/20 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-violet-500/30">
            A
          </div>
          <span className="font-semibold text-white text-sm font-orbitron">MAGI 控制台</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/panel/logout">
            <button className="p-2 rounded-full bg-red-500/10 text-red-400 active:scale-95 transition-transform">
              <LogOut size={18} />
            </button>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-full bg-white/10 text-white/70 active:scale-95 transition-transform"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 z-30 pt-16 bg-[#0a0e1a]/95 backdrop-blur-3xl"
          >
            <SidebarContent pathname={location.pathname} musicPlaylistId={musicPlaylistId} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth pt-16 md:pt-0 pb-24 md:pb-0 flex flex-col">
        {/* Desktop Top Header (Right side of sidebar) */}
        <header className="hidden md:flex sticky top-0 z-20 h-20 px-8 items-center justify-end bg-gradient-to-b from-[#0a0e1a] to-[#0a0e1a]/0 backdrop-blur-sm">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3 pr-5 border-r border-white/10">
              <div className="text-right hidden lg:block">
                <div className="text-sm font-semibold text-white">Administrator</div>
                <div className="text-[10px] text-emerald-400 font-mono">System Active</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-violet-500/30 flex items-center justify-center overflow-hidden">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=admin" alt="avatar" className="w-full h-full object-cover" />
              </div>
            </div>
            <Link to="/panel/logout" className="group flex items-center gap-2 px-3 py-2 rounded-xl text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors">
              <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
              <span className="text-sm font-medium">退出</span>
            </Link>
          </div>
        </header>

        <div className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:px-12 min-h-full relative overflow-visible">
          {/* Dashboard ambient glow */}
          {isRoot && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] opacity-20 pointer-events-none mix-blend-screen z-0">
              <div className="absolute inset-0 bg-gradient-to-b from-violet-600 to-transparent blur-[100px] rounded-full scale-150 transform -translate-y-1/2" />
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-blue-600 blur-[120px] rounded-full scale-[2] transform -translate-y-1/2 opacity-50" />
            </div>
          )}
          <AnimatePresence mode="wait">
            {isRoot ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-8"
              >
                {/* Header (Large Title Area) */}
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 pb-10 relative z-10 border-b border-white/5">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">
                      <Home size={14} />
                      <span className="text-xs font-bold tracking-widest uppercase">System Overview</span>
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/40 font-orbitron drop-shadow-lg">
                      控制台枢纽
                    </h1>
                    <p className="text-white/40 text-sm sm:text-base max-w-xl font-medium pt-2">
                      欢迎回来，主脑参数运行正常。通过全新构建的 Bento 架构，掌握所有核心组件与流量脉路。
                    </p>
                  </div>
                  <Link to="/admin/article/new" className="shrink-0">
                    <button className="w-full sm:w-auto px-8 py-4 rounded-3xl font-bold transition-all active:scale-95 shadow-[0_10px_40px_-10px_rgba(139,92,246,0.5)] bg-white text-slate-900 hover:bg-violet-100 flex items-center justify-center gap-3 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/10 to-violet-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <div className="w-8 h-8 rounded-full bg-slate-900/10 flex items-center justify-center">
                        <FileText size={16} className="text-slate-900" />
                      </div>
                      <span className="tracking-wide">发布新文章</span>
                    </button>
                  </Link>
                </header>

                {/* Dashboard Core - Bento Box Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">

                  {/* Top Stats - spans 12 cols, grid of 4 */}
                  <div className="col-span-1 md:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <StatCard title="总访问量" value={displayStats.pv} color="bg-blue-500" icon="👁️" trend={godMode?.enabled ? "GOD ACTIVE" : "+12.5%"} trendUp={true} />
                    <StatCard title="总用户数" value={displayStats.users} color="bg-purple-500" icon="👤" trend={godMode?.enabled ? "GOD ACTIVE" : "+5"} trendUp={true} />
                    <StatCard title="实时在线" value={displayStats.online} color="bg-orange-500" icon="⚡" trend="LIVE" trendUp={true} />
                    <StatCard title="点赞数" value={stats.likes} color="bg-pink-500" icon="❤️" trend="+28%" trendUp={true} />
                  </div>

                  {/* God Mode Dashboard Module */}
                  {godMode?.enabled && (
                    <div className="col-span-1 md:col-span-12 bg-amber-500/5 border border-amber-500/20 rounded-[40px] p-8 lg:p-10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-3xl bg-amber-500 flex items-center justify-center text-black shadow-lg shadow-amber-500/30">
                            <ShieldAlert size={32} />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">God Command Center Active</h2>
                            <p className="text-amber-500/70 text-sm font-mono mt-0.5">正在执行系统级数据伪造协议 (Data Spoofing Protocols)...</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="px-5 py-3 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center min-w-[120px]">
                            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">PV Injection</span>
                            <span className="text-xl font-black text-emerald-400 font-mono">+{godMode.fake_total_views_offset}</span>
                          </div>
                          <div className="px-5 py-3 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center min-w-[120px]">
                            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">User Inflat</span>
                            <span className="text-xl font-black text-blue-400 font-mono">+{godMode.fake_user_count_offset}</span>
                          </div>
                          <div className="px-5 py-3 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center min-w-[120px]">
                            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Sim Online</span>
                            <span className="text-xl font-black text-amber-500 font-mono">{godMode.simulated_online_users_min}-{godMode.simulated_online_users_max}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Main Traffic Radar - Large Bento Block */}
                  <div className="col-span-1 md:col-span-12 lg:col-span-8 bg-[#0a0e1a]/80 backdrop-blur-3xl border border-white/5 rounded-[40px] p-8 lg:p-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 blur-[100px] rounded-full mix-blend-screen pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />
                    <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                      <span className="w-2 h-6 bg-gradient-to-b from-blue-400 to-indigo-600 rounded-full" />
                      待审评论监控
                    </h2>
                    <div className="h-[350px] w-full relative z-10 overflow-y-auto custom-scrollbar">
                      <div className="space-y-4 pr-2">
                        {pendingComments.length > 0 ? pendingComments.map((comment: any, idx: number) => (
                          <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-2 hover:bg-white/10 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-violet-300">{comment.author_name} ({comment.author_email})</span>
                              <span className="text-xs text-white/40">{new Date(comment.created_at * 1000).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-white/80 line-clamp-2">{comment.content}</p>
                            <Link to="/admin/comments" className="text-xs text-blue-400 hover:text-blue-300 self-end mt-1">处理 &rarr;</Link>
                          </div>
                        )) : (
                          <div className="h-full flex items-center justify-center text-white/30 text-sm">
                            目前没有待处理的新评论。
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Daily Quests - Side Bento Block */}
                  <div className="col-span-1 md:col-span-6 lg:col-span-4 bg-[#0a0e1a]/80 backdrop-blur-3xl border border-white/5 rounded-[40px] p-8 lg:p-10 shadow-2xl relative overflow-hidden group flex flex-col">
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[80px] rounded-full mix-blend-screen pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="w-2 h-6 bg-gradient-to-b from-amber-400 to-orange-600 rounded-full" />
                      全量快速入口
                    </h2>
                    <div className="relative z-10 grid grid-cols-2 gap-4">
                      {navItems.filter(i => !i.exact).map(item => (
                        <Link key={item.to} to={item.to} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-[1.02] transition-all flex flex-col items-center justify-center gap-2 group">
                          <item.icon size={24} className="text-white/40 group-hover:text-amber-400 transition-colors" />
                          <span className="text-xs font-semibold text-white/70">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-12 lg:col-span-12 bg-[#0a0e1a]/80 backdrop-blur-3xl border border-white/5 rounded-[40px] p-8 lg:p-10 shadow-2xl flex flex-col">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="w-2 h-6 bg-gradient-to-b from-fuchsia-400 to-pink-600 rounded-full" />
                      系统运行状态
                    </h2>
                    <div className="w-full relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col justify-center items-center group hover:bg-white/10 transition-all text-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center mb-2"><FileText size={20} /></div>
                        <p className="text-sm text-white/50">已发布文章总数</p>
                        <p className="text-3xl font-bold text-white font-orbitron">{stats.articles} <span className="text-sm font-normal text-white/30">篇</span></p>
                      </div>
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col justify-center items-center group hover:bg-white/10 transition-all text-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2"><MessageSquare size={20} /></div>
                        <p className="text-sm text-white/50">历史评论总数</p>
                        <p className="text-3xl font-bold text-white font-orbitron">{stats.comments} <span className="text-sm font-normal text-white/30">条</span></p>
                      </div>
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col justify-center items-center group hover:bg-white/10 transition-all text-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2"><BarChart3 size={20} /></div>
                        <p className="text-sm text-white/50">总点击与阅读量</p>
                        <p className="text-3xl font-bold text-white font-orbitron">{stats.pv} <span className="text-sm font-normal text-white/30">次</span></p>
                      </div>
                    </div>
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div
                key="outlet"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="relative z-30"
              >
                <Outlet />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation (Optional fallback for quick access on phones) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-[#0f1629]/90 backdrop-blur-xl border-t border-violet-500/20 pb-safe z-40">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.prefix || item.to);
            return (
              <Link key={item.to} to={item.to} className="flex-1 flex flex-col items-center justify-center h-full">
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-violet-400" : "text-white/40"} />
                <span className={`text-[10px] mt-1 ${isActive ? "text-violet-400 font-semibold" : "text-white/40"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function StatCard({ title, value, color, icon, trend, trendUp }: {
  title: string;
  value: string | number;
  color: string;
  icon: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="bg-[#1e293b]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:bg-[#1e293b]/60 hover:border-white/10 transition-all relative overflow-hidden group shadow-lg">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color.replace('bg-', 'from-').replace('-500', '-500/10')} to-transparent rounded-bl-[100px] -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-110`} />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className={`w-12 h-12 rounded-2xl ${color} bg-opacity-10 text-white flex items-center justify-center text-xl shadow-inner border border-white/10 backdrop-blur-md`}>
          {icon}
        </div>
        {trend && (
          <div className={`text-xs font-bold px-2.5 py-1 rounded-full border ${trendUp
            ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
            : "text-rose-400 bg-rose-400/10 border-rose-400/20"
            }`}>
            {trend}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h4 className="text-4xl font-black text-white tracking-tight font-orbitron mb-1 drop-shadow-sm">{value}</h4>
        <p className="text-sm font-semibold text-white/50 uppercase tracking-widest">{title}</p>
      </div>
    </div>
  );
}

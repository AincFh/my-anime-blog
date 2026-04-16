import { Link, Outlet, useLocation, redirect } from "react-router";
import type { Route } from "./+types/admin";
import { useState, useEffect } from "react";
import { Menu, X, Home, FileText, MessageSquare, Image as ImageIcon, Settings, LogOut, ChevronRight, BarChart3, Users, Trophy, ShoppingBag, Crown, ShieldAlert, Zap, Globe, Eye, Heart } from "lucide-react";
import { AdminMusicPlayer } from "~/components/admin/AdminMusicPlayer";
import { getSessionToken, verifySession } from "~/services/auth.server";
import { motion, AnimatePresence } from "framer-motion";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { anime_db, CACHE_KV } = context.cloudflare.env;
  const token = getSessionToken(request);
  const { valid, user } = await verifySession(token, anime_db, CACHE_KV as any, request);

  if (!valid || user?.role !== 'admin') {
    return redirect("/panel/login");
  }

  // 并行获取所有统计数据以提升性能
  const [statsResult, pendingCommentsResult, animesResult, userCountResult, settingsResult] = await Promise.all([
    // 1. 统计数据
    anime_db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM articles) as articles,
        (SELECT COUNT(*) FROM comments) as comments,
        (SELECT COALESCE(SUM(views), 0) FROM articles) as pv,
        (SELECT COALESCE(SUM(likes), 0) FROM articles) as likes
    `).first(),

    // 2. 待审核评论
    anime_db.prepare(`
      SELECT * FROM comments WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5
    `).all(),

    // 3. 最近追番
    anime_db.prepare(`
      SELECT * FROM animes ORDER BY id DESC LIMIT 10
    `).all(),

    // 4. 用户总数
    anime_db.prepare(`SELECT COUNT(*) as count FROM users`).first(),

    // 5. 系统配置
    (async () => {
      try {
        const row = await anime_db.prepare("SELECT value FROM settings WHERE key = 'system_settings'").first() as any;
        return row?.value ? JSON.parse(row.value) : {};
      } catch (e) {
        console.error("Failed to parse system settings:", e);
        return {};
      }
    })()
  ]);

  const stats = statsResult as any || { articles: 0, comments: 0, pv: 0, likes: 0 };
  const settings = settingsResult as any || {};
  const userCount = (userCountResult as any)?.count || 0;

  return {
    stats,
    pendingComments: pendingCommentsResult?.results || [],
    animes: animesResult?.results || [],
    musicPlaylistId: settings?.features?.music?.playlist_id || "",
    godMode: settings?.god_mode || { enabled: false },
    userCount,
    onlineUsers: Math.floor(Math.random() * 10) + 1 // 模拟实时
  };
}

export default function Admin({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  const isRoot = location.pathname === "/admin";
  const { stats, pendingComments, musicPlaylistId, godMode, userCount, onlineUsers, animes } = loaderData;

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

  const navItems = [
    { to: "/admin", label: "控制台首页", icon: Home, exact: true },
    { to: "/admin/analytics", label: "数据全景", icon: BarChart3, prefix: "/admin/analytics" },
    { to: "/admin/articles", label: "内容发布", icon: FileText, prefix: "/admin/articles" },
    { to: "/admin/comments", label: "评论审核", icon: MessageSquare, prefix: "/admin/comments" },
    { to: "/admin/gallery", label: "资源图库", icon: ImageIcon, prefix: "/admin/gallery" },
    { to: "/admin/anime/manage", label: "追番管理", icon: Trophy, prefix: "/admin/anime" },
    { to: "/admin/users", label: "用户档案", icon: Users, prefix: "/admin/users" },
    { to: "/admin/missions", label: "成就使命", icon: Globe, prefix: "/admin/missions" },
    { to: "/admin/shop", label: "星尘集市", icon: ShoppingBag, prefix: "/admin/shop" },
    { to: "/admin/membership", label: "会员策略", icon: Crown, prefix: "/admin/membership" },
    { to: "/admin/settings", label: "核心设定", icon: Settings, prefix: "/admin/settings" },
  ];

  return (
    <div className="flex h-[100dvh] bg-[#0a0e1a] overflow-hidden font-sans text-white/90">
      {/* Desktop Sidebar (lg screens and up) */}
      <aside className="hidden lg:flex w-72 flex-col bg-[#0f1629]/80 backdrop-blur-3xl border-r border-violet-500/20 z-30">
        <SidebarContent pathname={location.pathname} musicPlaylistId={musicPlaylistId} />
      </aside>

      {/* Mobile & Tablet Top Navbar */}
      <header className="lg:hidden fixed top-0 w-full h-16 bg-[#0f1629]/90 backdrop-blur-xl border-b border-violet-500/20 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <span className="text-white font-black text-sm">M</span>
          </div>
          <span className="font-orbitron font-bold tracking-tighter text-white">MAGI v2.0</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed inset-0 z-30 pt-16 bg-[#0a0e1a]/95 backdrop-blur-3xl"
          >
            <SidebarContent pathname={location.pathname} musicPlaylistId={musicPlaylistId} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth pt-16 lg:pt-0 pb-24 lg:pb-0 flex flex-col">
        {/* Desktop Top Header */}
        <header className="hidden lg:flex sticky top-0 z-20 h-20 px-8 items-center justify-end bg-gradient-to-b from-[#0a0e1a] to-[#0a0e1a]/0 backdrop-blur-sm pointer-events-none">
          <div className="flex items-center gap-5 pointer-events-auto">
            <div className="flex items-center gap-3 pr-5 border-r border-white/10">
              <div className="text-right hidden xl:block">
                <div className="text-sm font-semibold text-white">管理员</div>
                <div className="text-[10px] text-emerald-400 font-mono italic">系统在线</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-violet-500/30 flex items-center justify-center overflow-hidden shadow-lg shadow-violet-500/10">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=admin" alt="avatar" className="w-full h-full object-cover" />
              </div>
            </div>
            <Link to="/panel/logout" className="group flex items-center gap-2 px-3 py-2 rounded-xl text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all">
              <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
              <span className="text-sm font-medium">退出</span>
            </Link>
          </div>
        </header>

        <div className="flex-1 w-full max-w-[1400px] mx-auto p-4 lg:p-10 min-h-full relative">
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
                className="space-y-8 relative z-10"
              >
                {/* Header (Large Title Area) */}
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 pb-10 border-b border-white/5">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">
                      <Home size={14} />
                      <span className="text-xs font-bold tracking-widest uppercase">系统概览</span>
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/40 font-orbitron drop-shadow-lg">
                      控制台枢纽
                    </h1>
                    <p className="text-white/40 text-sm sm:text-base max-w-xl font-medium pt-2">
                      欢迎回来。这里是 MAGI 系统核心，您可以管理内容、审核评论、追踪番剧进度，并利用上帝模式控制时空节点。
                    </p>
                  </div>
                </header>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                  {/* Top Stats */}
                  <div className="col-span-1 md:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <StatCard title="总访问量" value={displayStats.pv} color="bg-blue-500" icon={<Eye size={20} />} trend={godMode?.enabled ? "已激活" : "+12.5%"} trendUp={true} />
                    <StatCard title="总用户数" value={displayStats.users} color="bg-purple-500" icon={<Users size={20} />} trend={godMode?.enabled ? "已激活" : "+5"} trendUp={true} />
                    <StatCard title="实时在线" value={displayStats.online} color="bg-orange-500" icon={<Zap size={20} />} trend="LIVE" trendUp={true} />
                    <StatCard title="点赞数" value={stats.likes} color="bg-pink-500" icon={<Heart size={20} />} trend="+28%" trendUp={true} />
                  </div>

                  {/* God Mode Alert */}
                  {godMode?.enabled && (
                    <div className="col-span-1 md:col-span-12">
                      <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-3xl p-6 lg:p-8 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                          <ShieldAlert size={100} />
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-black flex items-center justify-center flex-shrink-0 animate-pulse">
                            <ShieldAlert size={32} />
                          </div>
                          <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">上帝指令中心已激活</h2>
                            <p className="text-amber-500/70 text-sm font-mono mt-0.5">正在执行系统级数据伪装协议...</p>
                          </div>
                          <div className="flex gap-4">
                            <div className="px-5 py-3 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center min-w-[120px]">
                              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">PV 注入</span>
                              <span className="text-xl font-black text-emerald-400 font-mono">+{godMode.fake_total_views_offset}</span>
                            </div>
                            <div className="px-5 py-3 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center min-w-[120px]">
                              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">用户膨胀</span>
                              <span className="text-xl font-black text-blue-400 font-mono">+{godMode.fake_user_count_offset}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comments Monitor */}
                  <div className="col-span-1 lg:col-span-8 bg-[#0a0e1a]/80 backdrop-blur-3xl border border-white/5 rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden group">
                    <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                      <span className="w-2 h-6 bg-gradient-to-b from-blue-400 to-indigo-600 rounded-full" />
                      待审评论监控
                    </h2>
                    <div className="h-[350px] overflow-y-auto custom-scrollbar pr-2 space-y-4 relative z-10">
                      {pendingComments.length > 0 ? pendingComments.map((comment: any, idx: number) => (
                        <div key={idx} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-2 hover:bg-white/10 transition-all border-l-4 border-l-violet-500/50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-violet-300">{comment.author_name}</span>
                            <span className="text-[10px] uppercase font-mono text-white/30">{new Date(comment.created_at * 1000).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-white/70 italic line-clamp-2">"{comment.content}"</p>
                          <Link to="/admin/comments" className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 self-end mt-2">
                             介入管理 &rarr;
                          </Link>
                        </div>
                      )) : (
                        <div className="h-full flex items-center justify-center text-white/20 text-sm font-medium">
                          环境肃清。目前没有待审核评论。
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Anime Quick Update */}
                  <div className="col-span-1 lg:col-span-4 bg-[#0a0e1a]/80 backdrop-blur-3xl border border-white/5 rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full mix-blend-screen pointer-events-none" />
                    <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                      <span className="w-2 h-6 bg-gradient-to-b from-emerald-400 to-teal-600 rounded-full" />
                      最近追番快报
                    </h2>
                    <div className="space-y-4 relative z-10">
                      {(animes || []).slice(0, 3).map((anime: any) => (
                        <div key={anime.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group/item">
                          <div className="w-12 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-xl group-hover/item:scale-105 transition-transform">
                            <img src={anime.cover_url} alt={anime.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white truncate group-hover/item:text-emerald-400 transition-colors">{anime.title}</p>
                            <p className="text-[10px] text-white/30 mt-1 uppercase tracking-widest font-mono">进度: {anime.progress || "0/?"}</p>
                            <div className="w-full h-1 bg-white/5 rounded-full mt-2.5 overflow-hidden">
                              <div className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: anime.status === 'completed' ? '100%' : '60%' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                      <Link to="/admin/anime/manage" className="mt-4 block w-full py-3.5 border border-dashed border-white/10 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/70 hover:bg-white/5 transition-all">
                        管理全部番库 &rarr;
                      </Link>
                    </div>
                  </div>

                  {/* Fast Access Grid */}
                  <div className="col-span-1 md:col-span-12 bg-[#0a0e1a]/80 backdrop-blur-3xl border border-white/5 rounded-3xl p-8 lg:p-10 shadow-2xl flex flex-col">
                    <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                      <span className="w-2 h-6 bg-gradient-to-b from-amber-400 to-orange-600 rounded-full" />
                      核心管理枢纽
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4 relative z-10">
                      {navItems.filter(i => !i.exact).map(item => (
                        <Link key={item.to} to={item.to} className="group p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:shadow-2xl hover:shadow-amber-500/5 hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-3 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-amber-400 group-hover:bg-amber-500/10 transition-all">
                            <item.icon size={22} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-tighter text-white/60 group-hover:text-white">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* System Operational Stats */}
                  <div className="col-span-1 md:col-span-12 bg-[#0a0e1a]/80 backdrop-blur-3xl border border-white/5 rounded-3xl p-8 lg:p-10 shadow-2xl flex flex-col">
                    <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                      <span className="w-2 h-6 bg-gradient-to-b from-fuchsia-400 to-pink-600 rounded-full" />
                      全局同步快照
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                      <div className="p-8 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center gap-3 hover:bg-white/10 transition-all group">
                        <FileText size={24} className="text-violet-400 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">已发布文章</p>
                        <p className="text-4xl font-black text-white font-orbitron">{stats.articles}</p>
                      </div>
                      <div className="p-8 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center gap-3 hover:bg-white/10 transition-all group">
                        <MessageSquare size={24} className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">总累积评论</p>
                        <p className="text-4xl font-black text-white font-orbitron">{stats.comments}</p>
                      </div>
                      <div className="p-8 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center gap-3 hover:bg-white/10 transition-all group">
                        <BarChart3 size={24} className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">流量总点击</p>
                        <p className="text-4xl font-black text-white font-orbitron">{displayStats.pv}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="outlet"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                <Outlet />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarContent({ pathname, musicPlaylistId }: { pathname: string; musicPlaylistId: string }) {
  const navItems = [
    { to: "/admin", label: "控制台首页", icon: Home, exact: true },
    { to: "/admin/analytics", label: "数据全景", icon: BarChart3, prefix: "/admin/analytics" },
    { to: "/admin/articles", label: "内容发布", icon: FileText, prefix: "/admin/articles" },
    { to: "/admin/comments", label: "评论审核", icon: MessageSquare, prefix: "/admin/comments" },
    { to: "/admin/gallery", label: "资源图库", icon: ImageIcon, prefix: "/admin/gallery" },
    { to: "/admin/anime/manage", label: "追番管理", icon: Trophy, prefix: "/admin/anime" },
    { to: "/admin/users", label: "用户档案", icon: Users, prefix: "/admin/users" },
    { to: "/admin/missions", label: "成就使命", icon: Globe, prefix: "/admin/missions" },
    { to: "/admin/shop", label: "星尘集市", icon: ShoppingBag, prefix: "/admin/shop" },
    { to: "/admin/membership", label: "会员策略", icon: Crown, prefix: "/admin/membership" },
    { to: "/admin/settings", label: "核心设定", icon: Settings, prefix: "/admin/settings" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-8 border-b border-white/5 flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tighter font-orbitron flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          MAGI <span className="text-white/20">SYSTEM</span>
        </h2>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Deep Space Engine v2.0</p>
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-1.5">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.to : pathname.startsWith(item.prefix || item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all group ${
                isActive 
                  ? "bg-gradient-to-r from-violet-600/20 to-fuchsia-600/10 text-white border border-violet-500/20 shadow-lg shadow-violet-500/5 translate-x-1" 
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <item.icon size={18} className={`${isActive ? "text-violet-400" : "text-white/20 group-hover:text-white/40"} transition-colors`} />
              <span className="flex-1 truncate">{item.label}</span>
              {isActive && (
                <motion.div layoutId="activeInd" className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 音乐预览播放器 */}
      <div className="p-4 border-t border-white/5">
        <AdminMusicPlayer playlistId={musicPlaylistId} />
      </div>

      <div className="p-6 pt-0 border-t border-white/5">
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">环境签名</p>
                <p className="text-xs font-mono text-emerald-400/80">PRODUCTION</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, icon, trend, trendUp }: {
  title: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="bg-[#1e293b]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 lg:p-8 flex flex-col justify-between hover:bg-[#1e293b]/60 hover:border-white/10 transition-all relative overflow-hidden group shadow-2xl">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color.replace('bg-', 'from-').replace('-500', '-500/10')} to-transparent rounded-bl-[100px] -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-110`} />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className={`w-14 h-14 rounded-2xl ${color} bg-opacity-10 text-white flex items-center justify-center shadow-inner border border-white/10 backdrop-blur-md`}>
          {icon}
        </div>
        {trend && (
          <div className={`text-[10px] font-black px-3 py-1.5 rounded-full border shadow-sm ${trendUp
            ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
            : "text-rose-400 bg-rose-400/10 border-rose-400/20"
            }`}>
            {trend}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h4 className="text-4xl lg:text-5xl font-black text-white tracking-tighter font-orbitron mb-1.5 truncate">{value}</h4>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{title}</p>
      </div>
    </div>
  );
}

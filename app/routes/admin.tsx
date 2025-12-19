import { motion, AnimatePresence } from "framer-motion";
import { Link, Outlet, useLocation, redirect, useSubmit } from "react-router";
import type { Route } from "./+types/admin";
import { TrafficRadar } from "~/components/admin/TrafficRadar";
import { CommentManager } from "~/components/admin/CommentManager";
import { MemoPad } from "~/components/admin/MemoPad";
import { DailyQuests } from "~/components/admin/DailyQuests";
import { useState } from "react";

export async function loader({ request, context }: Route.LoaderArgs) {
  const sessionId = request.headers.get("Cookie")?.match(/admin_session=([^;]+)/)?.[1];
  const { anime_db } = context.cloudflare.env;

  if (!sessionId) throw redirect("/admin/login");

  try {
    const session = await anime_db.prepare(
      "SELECT * FROM sessions WHERE token = ? AND expires_at > unixepoch()"
    ).bind(sessionId).first();
    if (!session) throw redirect("/admin/login");
  } catch (e) {
    throw redirect("/admin/login");
  }

  let stats = { pv: 0, uv: 0, articles: 0, comments: 0, likes: 0, storage: 0 };
  let pendingComments: any[] = [];

  try {
    const articlesCount = await anime_db.prepare("SELECT COUNT(*) as count FROM articles").first();
    stats.articles = (articlesCount as any)?.count || 0;

    const commentsCount = await anime_db.prepare("SELECT COUNT(*) as count FROM comments").first();
    stats.comments = (commentsCount as any)?.count || 0;

    const animesCount = await anime_db.prepare("SELECT COUNT(*) as count FROM animes").first();
    stats.likes = (animesCount as any)?.count || 0;

    const totalViews = await anime_db.prepare("SELECT SUM(views) as total FROM articles").first();
    stats.pv = (totalViews as any)?.total || 0;

    const result = await anime_db.prepare(
      "SELECT * FROM comments WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5"
    ).all();
    if (result.results) pendingComments = result.results;
  } catch (e) {
    console.error("Failed to fetch stats:", e);
  }

  return { stats, pendingComments };
}

export default function Admin({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  const isRoot = location.pathname === "/admin";
  const { stats, pendingComments } = loaderData;

  const SidebarItem = ({ to, icon, label, active }: { to: string; icon: string; label: string; active?: boolean }) => (
    <Link to={to} className="block mb-1">
      <motion.div
        className={`px-3 py-2 rounded-lg flex items-center gap-3 transition-colors ${active ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:bg-gray-200/50"
          }`}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-lg">{icon}</span>
        <span className="font-medium text-sm">{label}</span>
      </motion.div>
    </Link>
  );

  return (
    <div className="flex h-screen bg-[#F5F5F7] overflow-hidden font-sans">
      {/* Sidebar - macOS Style */}
      <aside className="w-64 bg-[#F5F5F7]/80 backdrop-blur-2xl border-r border-gray-200/50 flex-shrink-0 flex flex-col pt-6 pb-4 px-4 z-20">
        <div className="px-2 mb-8 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]"></div>
          <div className="w-3 h-3 rounded-full bg-[#28C840]"></div>
          <span className="ml-2 text-sm font-semibold text-gray-400 tracking-wider">CONTROL</span>
        </div>

        <nav className="flex-1 space-y-6">
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Overview</h3>
            <SidebarItem to="/admin" icon="􀎟" label="Dashboard" active={location.pathname === "/admin"} />
            <SidebarItem to="/admin/analytics" icon="􀉉" label="Analytics" active={location.pathname.includes("analytics")} />
          </div>

          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Content</h3>
            <SidebarItem to="/admin/articles" icon="􀈊" label="Articles" active={location.pathname.includes("articles") || location.pathname.includes("article")} />
            <SidebarItem to="/admin/comments" icon="􀌤" label="Comments" active={location.pathname.includes("comments")} />
            <SidebarItem to="/admin/gallery" icon="􀏅" label="Gallery" active={location.pathname.includes("gallery")} />
            <SidebarItem to="/admin/anime/manage" icon="􀄨" label="Animes" active={location.pathname.includes("anime")} />
          </div>

          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">System</h3>
            <SidebarItem to="/admin/settings" icon="􀍟" label="Settings" active={location.pathname.includes("settings")} />
          </div>
        </nav>

        <div className="mt-auto px-2">
          <Link to="/logout" className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors">
            <span>􀆄</span> Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        <div className="max-w-7xl mx-auto p-8 min-h-full">
          <AnimatePresence mode="wait">
            {isRoot ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              >
                <header className="mb-8 flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Good Afternoon</h1>
                    <p className="text-gray-500 mt-1">Here's what's happening today.</p>
                  </div>
                  <Link to="/admin/article/new">
                    <button className="px-4 py-2 rounded-full font-medium transition-all active:scale-95 shadow-sm hover:shadow bg-[#007AFF] text-white hover:bg-[#0071E3] shadow-lg shadow-blue-500/30">
                      + New Article
                    </button>
                  </Link>
                </header>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <AppleStatCard title="Total Views" value={stats.pv} color="blue" icon="􀉉" />
                  <AppleStatCard title="Articles" value={stats.articles} color="purple" icon="􀈊" />
                  <AppleStatCard title="Comments" value={stats.comments} color="orange" icon="􀌤" />
                  <AppleStatCard title="Storage" value={`${stats.storage}MB`} color="green" icon="􀏅" />
                </div>

                {/* Main Widgets Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Traffic Chart (Placeholder for now, keeping Radar but styled) */}
                  <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl transition-all duration-300 p-6 relative overflow-hidden">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Overview</h3>
                    <div className="h-64 flex items-center justify-center bg-gray-50/50 rounded-xl border border-gray-100/50">
                      <TrafficRadar />
                    </div>
                  </div>

                  {/* Quick Actions / Daily */}
                  <div className="space-y-6">
                    <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl transition-all duration-300 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Tasks</h3>
                      <DailyQuests />
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl transition-all duration-300 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Comments</h3>
                    <CommentManager initialComments={pendingComments || []} />
                  </div>
                  <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl transition-all duration-300 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Notes</h3>
                    <MemoPad />
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div
                key="outlet"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
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

function AppleStatCard({ title, value, color, icon }: { title: string; value: string | number; color: string; icon: string }) {
  const colors: any = {
    blue: "text-[#007AFF] bg-[#007AFF]/10",
    purple: "text-[#AF52DE] bg-[#AF52DE]/10",
    orange: "text-[#FF9500] bg-[#FF9500]/10",
    green: "text-[#34C759] bg-[#34C759]/10",
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl transition-all duration-300 p-5 flex items-start justify-between group cursor-default hover:bg-white/80 hover:shadow-md hover:-translate-y-0.5">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h4>
      </div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${colors[color]} transition-transform group-hover:scale-110`}>
        {icon}
      </div>
    </div>
  );
}


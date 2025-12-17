import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { AdminMusicPlayer } from "~/components/admin/AdminMusicPlayer";
import { UserControlCenter } from "~/components/ui/interactive/UserControlCenter";
import { SystemOverlay } from "~/components/admin/SystemOverlay";

/**
 * MAGI SYSTEM - 后台管理系统布局 (Ver.3.0)
 * 设计：NERV 指挥中心风格
 * 特性：动态流体背景、深度玻璃拟态、全息 HUD
 */

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface NavItem {
  name: string;
  path: string;
  icon: string;
  badge?: string | number;
  isNew?: boolean;
}

const navGroups: NavGroup[] = [
  {
    title: "CORE",
    items: [
      { name: "指挥中心", path: "/admin", icon: "🏠" },
      { name: "系统设置", path: "/admin/settings", icon: "⚙️" },
    ],
  },
  {
    title: "DATA",
    items: [
      { name: "撰写手记", path: "/admin/article/new", icon: "✍️", isNew: true },
      { name: "文章管理", path: "/admin/articles", icon: "📚" },
      { name: "番剧记录", path: "/admin/anime/manage", icon: "🎬" },
      { name: "羁绊通信", path: "/admin/comments", icon: "💬", badge: 3 },
    ],
  },
  {
    title: "ASSETS",
    items: [
      { name: "影像仓库", path: "/admin/gallery", icon: "🖼️" },
      { name: "标签索引", path: "/admin/tags", icon: "🏷️" },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [systemStatus, setSystemStatus] = useState<"online" | "offline">("online");

  // 随机二次元台词
  const randomQuotes = [
    "系统运转正常，同步率 400%",
    "检测到新的灵感波动",
    "AT Field 全开",
    "保持初心，继续前行",
    "下午好，Master。今天的灵感涌现了吗？",
  ];
  const [currentQuote] = useState(
    randomQuotes[Math.floor(Math.random() * randomQuotes.length)]
  );

  return (
    <div className="min-h-screen animated-mesh-gradient text-white font-sans overflow-hidden relative">
      {/* 全局 HUD 覆盖层 */}
      <SystemOverlay />

      {/* 左侧导航栏 - 深度玻璃拟态 */}
      <motion.aside
        className="fixed left-0 top-0 h-full w-64 border-r border-white/10 z-30 overflow-y-auto backdrop-blur-xl bg-black/20"
        initial={{ x: 0 }}
        animate={{ x: isSidebarOpen ? 0 : -256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="h-full flex flex-col">
          {/* 用户信息区 */}
          <div className="p-6 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                className="relative"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg border border-white/20 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                  M
                </div>
                {/* 旋转光环 */}
                <motion.div
                  className="absolute inset-0 rounded-full border border-violet-400/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
              <div className="flex-1">
                <div className="font-semibold text-white tracking-wider font-orbitron">MASTER</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">Lv.</span>
                  <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 text-xs font-bold rounded border border-violet-500/30">
                    05
                  </span>
                </div>
              </div>
            </div>
            {/* 系统状态 */}
            <div className="flex items-center gap-2 mt-3 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${systemStatus === "online" ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500"}`}></span>
              <span className="text-white/60 font-mono tracking-wider">SYSTEM {systemStatus === "online" ? "NORMAL" : "OFFLINE"}</span>
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 p-4 space-y-6">
            {navGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-[10px] font-bold text-white/30 uppercase mb-2 px-2 tracking-[0.2em] font-orbitron">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link key={item.path} to={item.path}>
                        <motion.div
                          className={`relative px-4 py-3 rounded-lg transition-all border ${isActive
                              ? "bg-violet-600/20 border-violet-500/50 text-white shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                              : "border-transparent text-white/60 hover:bg-white/5 hover:text-white"
                            }`}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* 选中状态的光标 */}
                          {isActive && (
                            <motion.div
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-500 rounded-r"
                              layoutId="activeNav"
                            />
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-lg opacity-80">{item.icon}</span>
                              <span className="font-medium text-sm tracking-wide">{item.name}</span>
                            </div>
                            {/* 徽章 */}
                            {item.badge && (
                              <span className="px-1.5 py-0.5 bg-red-500/80 text-white text-[10px] font-bold rounded border border-red-400/50">
                                {item.badge}
                              </span>
                            )}
                            {item.isNew && (
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]"></span>
                            )}
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* 底部控制区 */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <AdminMusicPlayer />
          </div>
        </div>
      </motion.aside>

      {/* 主内容区 */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"} relative z-10`}>
        {/* 顶部状态栏 */}
        <header className="sticky top-0 z-30 border-b border-white/5 bg-black/10 backdrop-blur-md">
          <div className="px-8 py-4 flex items-center justify-between">
            {/* 面包屑导航 */}
            <div className="flex items-center gap-2 text-sm text-white/60 font-mono">
              <Link to="/admin" className="hover:text-violet-400 transition-colors">
                CMD
              </Link>
              {location.pathname !== "/admin" && (
                <>
                  <span className="text-white/20">/</span>
                  <span className="text-violet-300">
                    {navGroups
                      .flatMap((g) => g.items)
                      .find((item) => item.path === location.pathname)?.name ||
                      "UNKNOWN"}
                  </span>
                </>
              )}
            </div>

            {/* 环境感知和快捷操作 */}
            <div className="flex items-center gap-6">
              {/* 随机二次元台词 */}
              <motion.div
                className="text-xs text-white/40 italic hidden md:block font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {`> ${currentQuote}`}
              </motion.div>

              {/* 传送门按钮 */}
              <motion.button
                onClick={() => window.open("/", "_blank")}
                className="px-4 py-1.5 bg-white/5 border border-white/10 text-white/80 rounded text-xs font-medium hover:bg-white/10 hover:border-violet-500/50 hover:text-violet-300 transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>🌐</span>
                <span>LINK START</span>
              </motion.button>
            </div>
          </div>
        </header>

        {/* 工作区 */}
        <main className="p-8 min-h-[calc(100vh-64px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

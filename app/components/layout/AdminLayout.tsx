import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { AdminMusicPlayer } from "~/components/admin/AdminMusicPlayer";
import { UserControlCenter } from "~/components/ui/interactive/UserControlCenter";

/**
 * 纯白工坊 - 后台管理系统布局（升级版）
 * 设计：左侧导航（魔法书脊）+ 顶部状态栏（HUD）+ 右侧工作区
 * 升级：分组导航、音乐控制器、状态显示
 */

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface NavItem {
  name: string;
  path: string;
  icon: string;
  badge?: string | number; // 未读数量或"New"标记
  isNew?: boolean;
}

const navGroups: NavGroup[] = [
  {
    title: "核心",
    items: [
      { name: "指挥中心", path: "/admin", icon: "🏠" },
      { name: "系统设置", path: "/admin/settings", icon: "⚙️" },
    ],
  },
  {
    title: "内容",
    items: [
      { name: "撰写手记", path: "/admin/article/new", icon: "✍️", isNew: true },
      { name: "文章管理", path: "/admin/articles", icon: "📚" },
      { name: "番剧记录", path: "/admin/anime/manage", icon: "🎬" },
      { name: "羁绊通信", path: "/admin/comments", icon: "💬", badge: 3 },
    ],
  },
  {
    title: "资源",
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
  const [chibiState, setChibiState] = useState<"normal" | "peek" | "sleep">("normal");
  const [systemStatus, setSystemStatus] = useState<"online" | "offline">("online");

  // 看板娘状态管理
  useEffect(() => {
    const timer = setTimeout(() => {
      setChibiState("sleep");
    }, 30000); // 30秒无操作后打瞌睡

    return () => clearTimeout(timer);
  }, [location]);

  // 鼠标悬停时看板娘探出头
  const handleChibiHover = () => {
    setChibiState("peek");
    setTimeout(() => setChibiState("normal"), 2000);
  };

  // 随机二次元台词（从预设列表中选择）
  const randomQuotes = [
    "今天也要加油创作哦！✨",
    "新的灵感正在路上～",
    "你的文字会温暖很多人呢",
    "保持初心，继续前行",
    "每一篇文章都是你的足迹",
    "下午好，Master。今天的灵感涌现了吗？",
  ];
  const [currentQuote] = useState(
    randomQuotes[Math.floor(Math.random() * randomQuotes.length)]
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-800 font-sans">
      {/* 左侧导航栏 - 魔法书脊（升级版） */}
      <motion.aside
        className="fixed left-0 top-0 h-full w-64 bg-white border-r border-pink-200/30 shadow-sm z-30 overflow-y-auto"
        initial={{ x: 0 }}
        animate={{ x: isSidebarOpen ? 0 : -256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="h-full flex flex-col">
          {/* 用户信息区 - 数字身份 */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                className="relative"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-cyan-400 flex items-center justify-center text-white font-bold text-lg">
                  M
                </div>
                {/* 数字光效 */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-sky-400/50"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800">Master</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Lv.</span>
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-bold rounded-full">
                    5
                  </span>
                </div>
              </div>
            </div>
            {/* 系统状态 */}
            <div className="flex items-center gap-2 mt-3 text-xs">
              <span className={`w-2 h-2 rounded-full ${systemStatus === "online" ? "bg-green-500" : "bg-red-500"}`}></span>
              <span className="text-gray-600">System {systemStatus === "online" ? "Online" : "Offline"}</span>
            </div>
          </div>

          {/* 导航菜单（分组） */}
          <nav className="flex-1 p-4 space-y-6">
            {navGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link key={item.path} to={item.path}>
                        <motion.div
                          className={`relative px-4 py-3 rounded-xl transition-all ${
                            isActive
                              ? "bg-pink-50 text-pink-600 shadow-sm"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          animate={isActive ? { scale: [1, 1.02, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          {/* 选中状态的小光标（猫爪印） */}
                          {isActive && (
                            <motion.div
                              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                            >
                              <span className="text-pink-400">🐾</span>
                            </motion.div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{item.icon}</span>
                              <span className="font-medium">{item.name}</span>
                            </div>
                            {/* 徽章 */}
                            {item.badge && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                {item.badge}
                              </span>
                            )}
                            {item.isNew && (
                              <motion.span
                                className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full"
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                New
                              </motion.span>
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

          {/* 音乐控制器 */}
          <div className="p-4 border-t border-gray-100">
            <AdminMusicPlayer />
          </div>

          {/* 底部看板娘 */}
          <div
            className="p-4 border-t border-gray-100"
            onMouseEnter={handleChibiHover}
            onMouseLeave={() => setChibiState("normal")}
          >
            <motion.div
              className="flex items-center justify-center h-20 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl relative overflow-hidden"
              animate={{
                scale: chibiState === "peek" ? 1.1 : 1,
              }}
            >
              {chibiState === "sleep" ? (
                <motion.div
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <span className="text-4xl">😴</span>
                </motion.div>
              ) : chibiState === "peek" ? (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  <span className="text-4xl">👋</span>
                </motion.div>
              ) : (
                <span className="text-4xl">✨</span>
              )}
            </motion.div>
          </div>

          {/* 用户控制中心 */}
          <div className="p-4 border-t border-gray-100">
            <UserControlCenter
              user={{
                name: "Master",
                level: 5,
              }}
            />
          </div>
        </div>
      </motion.aside>

      {/* 主内容区 */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* 顶部状态栏 - HUD */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-100 shadow-sm">
          <div className="px-8 py-4 flex items-center justify-between">
            {/* 面包屑导航 */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Link to="/admin" className="hover:text-pink-600 transition-colors">
                🏠
              </Link>
              {location.pathname !== "/admin" && (
                <>
                  <span>›</span>
                  <span className="text-gray-400">
                    {navGroups
                      .flatMap((g) => g.items)
                      .find((item) => item.path === location.pathname)?.name ||
                      "页面"}
                  </span>
                </>
              )}
            </div>

            {/* 环境感知和快捷操作 */}
            <div className="flex items-center gap-4">
              {/* 随机二次元台词 */}
              <motion.div
                className="text-sm text-gray-500 italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {currentQuote}
              </motion.div>

              {/* 传送门按钮 - 打开前台 */}
              <motion.button
                onClick={() => window.open("/", "_blank")}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🌐 前台
              </motion.button>
            </div>
          </div>
        </header>

        {/* 工作区 */}
        <main className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
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

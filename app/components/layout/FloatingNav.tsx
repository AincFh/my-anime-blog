import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router";
import { useState, useRef, useEffect } from "react";
import { LoginModal } from "../forms/LoginModal";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Menu, X, User, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { useUser } from "~/hooks/useUser";
import { UserHUD } from "../ui/system/UserHUD";

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

export function FloatingNav() {
  const { scrollY } = useScroll();
  const location = useLocation();
  const backdropFilter = useTransform(scrollY, [0, 100], ['blur(10px)', 'blur(25px)']);
  const opacity = useTransform(scrollY, [0, 50], [0.8, 1]);
  const scale = useTransform(scrollY, [0, 50], [0.95, 1]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, loading } = useUser();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭用户菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems: NavItem[] = [
    { name: "首页", path: "/", icon: "🏠" },
    { name: "文章", path: "/articles", icon: "📚" },
    { name: "归档", path: "/archive", icon: "📅" },
    { name: "图库", path: "/gallery", icon: "🖼️" },
    { name: "番剧", path: "/bangumi", icon: "🎬" },
  ];

  return (
    <>
      {/* 灵动岛导航 - 桌面端顶部，移动端底部 */}
      <motion.nav
        className="fixed bottom-6 md:bottom-auto md:top-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-fit"
        style={{
          backdropFilter,
          opacity,
          scale,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="px-4 py-3 md:px-8 md:py-4 rounded-full flex items-center justify-between gap-2 md:gap-6 border border-white/20 dark:border-slate-700/50 shadow-lg"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* 桌面端：显示所有导航项 */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`text-sm font-medium transition-colors duration-300 ${isActive
                    ? "text-primary-start"
                    : "text-slate-700 dark:text-slate-200 hover:text-primary-start"
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* 移动端：显示图标导航 */}
          <div className="flex md:hidden items-center gap-1">
            {navItems.slice(0, 4).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`p-2 rounded-full transition-all ${isActive
                    ? "bg-primary-start/20 scale-110"
                    : "hover:bg-white/20"
                    }`}
                >
                  <span className="text-lg">{item.icon}</span>
                </Link>
              );
            })}
            {/* 更多菜单按钮 */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-full hover:bg-white/20"
              whileTap={{ scale: 0.9 }}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>

          {/* 右侧：登录/用户 + 主题切换 */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:block w-px h-4 bg-slate-200 dark:bg-slate-600" />

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <motion.button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <UserHUD user={user} />
                </motion.button>

                {/* 用户下拉菜单 */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-4 w-48 glass-card rounded-xl overflow-hidden shadow-xl z-50"
                    >
                      <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.username}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      </div>
                      <div className="p-1">
                        <Link to="/user/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                          <LayoutDashboard size={16} />
                          仪表盘
                        </Link>
                        <Link to="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                          <Settings size={16} />
                          设置
                        </Link>
                        <Link to="/logout" className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <LogOut size={16} />
                          退出登录
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-primary-start transition-colors duration-300"
              >
                登录
              </Link>
            )}

            <ThemeToggle />
          </div>
        </div>

        {/* 移动端展开菜单 */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden absolute top-full left-0 right-0 mt-2 glass-card rounded-2xl p-4 overflow-hidden"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-3 gap-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${isActive
                        ? "bg-primary-start/20 text-primary-start"
                        : "hover:bg-white/20 text-slate-700 dark:text-slate-200"
                        }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-xs font-medium">{item.name}</span>
                    </Link>
                  );
                })}

                {/* 移动端登录/用户按钮 */}
                {user ? (
                  <Link
                    to="/user/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-white/20 text-slate-700 dark:text-slate-200"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary-start flex items-center justify-center text-white text-xs">
                      {user.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="text-xs font-medium">我的</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-white/20 text-slate-700 dark:text-slate-200"
                  >
                    <span className="text-xl">👤</span>
                    <span className="text-xs font-medium">登录</span>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* 移除 LoginModal，因为现在使用独立页面 */}
      {/* <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} /> */}
    </>
  );
}

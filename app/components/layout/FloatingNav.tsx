import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Menu, X, LogOut, Settings, LayoutDashboard, Package } from "lucide-react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const { user, loading } = useUser();
  const avatarButtonRef = useRef<HTMLButtonElement>(null);

  // 计算下拉菜单位置 - 头像正下方，右边缘对齐
  const calculateDropdownPosition = () => {
    if (avatarButtonRef.current) {
      const rect = avatarButtonRef.current.getBoundingClientRect();
      const rightPosition = window.innerWidth - rect.right;
      const adjustedRight = Math.max(rightPosition, 16);

      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 12,
        right: adjustedRight,
        zIndex: 50,
      });
    }
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const dropdown = document.getElementById('user-dropdown-menu');

      if (dropdown?.contains(target)) return;
      if (avatarButtonRef.current?.contains(target)) return;

      setIsUserMenuOpen(false);
    };

    const handleScrollResize = () => {
      if (isUserMenuOpen) calculateDropdownPosition();
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScrollResize, true);
      window.addEventListener('resize', handleScrollResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollResize, true);
      window.removeEventListener('resize', handleScrollResize);
    };
  }, [isUserMenuOpen]);

  const handleAvatarClick = () => {
    if (!isUserMenuOpen) {
      calculateDropdownPosition();
    }
    setIsUserMenuOpen(prev => !prev);
  };

  const closeDropdown = () => setIsUserMenuOpen(false);

  const navItems: NavItem[] = [
    { name: "首页", path: "/", icon: "🏠" },
    { name: "文章", path: "/articles", icon: "📚" },
    { name: "归档", path: "/archive", icon: "📅" },
    { name: "图库", path: "/gallery", icon: "🖼️" },
    { name: "番剧", path: "/bangumi", icon: "🎬" },
  ];

  return (
    <>
      {/* 导航栏 */}
      <motion.nav
        className="fixed bottom-6 md:bottom-auto md:top-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-fit"
        style={{ backdropFilter, opacity, scale }}
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
          {/* 桌面端导航 */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-sm font-medium transition-colors duration-300 ${location.pathname === item.path
                    ? "text-primary-start"
                    : "text-slate-700 dark:text-slate-200 hover:text-primary-start"
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* 移动端导航 */}
          <div className="flex md:hidden items-center gap-1">
            {navItems.slice(0, 4).map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`p-2 rounded-full transition-all ${location.pathname === item.path
                    ? "bg-primary-start/20 scale-110"
                    : "hover:bg-white/20"
                  }`}
              >
                <span className="text-lg">{item.icon}</span>
              </Link>
            ))}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-full hover:bg-white/20"
              whileTap={{ scale: 0.9 }}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>

          {/* 右侧区域 */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:block w-px h-4 bg-slate-200 dark:bg-slate-600" />

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ) : user ? (
              <motion.button
                ref={avatarButtonRef}
                onClick={handleAvatarClick}
                className="flex items-center gap-2 focus:outline-none p-1 rounded-full hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <UserHUD user={user} compact={true} />
              </motion.button>
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

        {/* 移动端菜单 */}
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
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${location.pathname === item.path
                        ? "bg-primary-start/20 text-primary-start"
                        : "hover:bg-white/20 text-slate-700 dark:text-slate-200"
                      }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-xs font-medium">{item.name}</span>
                  </Link>
                ))}
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

      {/* 用户下拉菜单 - 完全独立，使用 fixed 定位 */}
      <AnimatePresence>
        {isUserMenuOpen && user && (
          <motion.div
            id="user-dropdown-menu"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-80 glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/20 dark:border-slate-700/50"
            style={dropdownStyle}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-br from-primary-start/10 to-primary-end/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
              <div className="relative z-10 flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-at-orange to-at-red shadow-lg">
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-at-orange font-bold text-2xl">
                        {user.username?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800 dark:text-white truncate font-display">{user.username}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-1">{user.email}</p>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-at-purple/10 text-at-purple text-[10px] font-bold border border-at-purple/20">
                    LV.{user.level || 1} Adventurer
                  </div>
                </div>
              </div>
              <div className="relative z-10">
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  <span>EXP</span>
                  <span>{user.exp || 0} / {(user.level || 1) * 100}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-at-orange to-at-red"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(((user.exp || 0) / ((user.level || 1) * 100)) * 100, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-px bg-slate-100 dark:bg-slate-700/50 border-y border-slate-100 dark:border-slate-700/50">
              <div className="bg-white/50 dark:bg-slate-800/50 p-3 flex flex-col items-center gap-1 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-help group">
                <span className="text-lg group-hover:scale-110 transition-transform">💰</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{user.coins || 0}</span>
                <span className="text-[10px] text-slate-400">金币</span>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 p-3 flex flex-col items-center gap-1 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-help group">
                <span className="text-lg group-hover:scale-110 transition-transform">🔥</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">5</span>
                <span className="text-[10px] text-slate-400">连胜</span>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 p-3 flex flex-col items-center gap-1 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-help group">
                <span className="text-lg group-hover:scale-110 transition-transform">🏆</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">12</span>
                <span className="text-[10px] text-slate-400">成就</span>
              </div>
            </div>

            {/* Links */}
            <div className="p-2 space-y-1">
              <Link to="/user/dashboard" onClick={closeDropdown} className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all group">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LayoutDashboard size={16} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">仪表盘</div>
                  <div className="text-[10px] text-slate-400">查看详细数据概览</div>
                </div>
              </Link>
              <Link to="/user/inventory" onClick={closeDropdown} className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all group">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package size={16} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">我的背包</div>
                  <div className="text-[10px] text-slate-400">查看获得的战利品</div>
                </div>
              </Link>
              <Link to="/settings" onClick={closeDropdown} className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all group">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Settings size={16} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">设置</div>
                  <div className="text-[10px] text-slate-400">账户与偏好设置</div>
                </div>
              </Link>
              <div className="h-px bg-slate-100 dark:bg-slate-700/50 my-1" />
              <Link to="/logout" onClick={closeDropdown} className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all group">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LogOut size={16} />
                </div>
                <div className="font-medium">退出登录</div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

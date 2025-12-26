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
  // 调整滚动时的变换效果
  const y = useTransform(scrollY, [0, 100], [0, -10]); // 稍微上移一点
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const { user, loading } = useUser();
  const avatarButtonRef = useRef<HTMLButtonElement>(null);

  // 计算下拉菜单位置
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
      {/* 导航栏容器 */}
      <motion.nav
        className="fixed top-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[95vw]"
        style={{ y }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "out" }}
      >
        <div
          className="
            relative flex items-center py-2.5 px-2 rounded-full
            /* --- iOS 玻璃态核心样式 --- */
            bg-white/60                 /* 1. 高透的白色背景 */
            backdrop-blur-xl            /* 2. 极强的背景高斯模糊 */
            border border-white/40      /* 3. 半透明的白色边框 */
            shadow-lg shadow-black/5    /* 4. 柔和的投影 */
            /* 兼容暗色模式 */
            dark:bg-slate-900/60 dark:border-white/10
          "
        >
          {/* 桌面端导航 */}
          <div className="hidden md:flex items-center">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className={`
                    relative px-5 py-2 text-[15px] font-medium transition-colors duration-300 rounded-full z-10
                    /* 文字颜色逻辑 */
                    ${isActive ? "text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}
                  `}
                >
                  {/* 文字层 */}
                  <span className="relative z-20">{item.name}</span>

                  {/* --- 液体切换背景层 --- */}
                  {isActive && (
                    <motion.div
                      layoutId="active-pill-glass"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                      className="absolute inset-0 z-10 bg-white dark:bg-slate-800 rounded-full shadow-sm"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* 移动端导航 (简化版) */}
          <div className="flex md:hidden items-center gap-1 px-2">
            <Link to="/" className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-white/10">
              <span className="text-xl">🏠</span>
            </Link>
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
              whileTap={{ scale: 0.9 }}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>

          {/* 分割线 */}
          <div className="w-px h-5 bg-black/10 dark:bg-white/10 mx-3 hidden md:block"></div>

          {/* 右侧区域 (用户 & 主题) */}
          <div className="flex items-center gap-2 pr-2">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ) : user ? (
              <motion.button
                ref={avatarButtonRef}
                onClick={handleAvatarClick}
                className="flex items-center gap-2 focus:outline-none p-1 rounded-full hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <UserHUD user={user} compact={true} />
              </motion.button>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 text-[14px] font-medium text-slate-500 hover:text-slate-800 transition-colors dark:text-slate-400 dark:hover:text-white"
              >
                登录
              </Link>
            )}

            <ThemeToggle />
          </div>
        </div>

        {/* 移动端菜单下拉 */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden absolute top-full left-0 right-0 mt-4 mx-4 p-4 rounded-2xl
                         bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-3 gap-3">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${location.pathname === item.path
                      ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white"
                      : "hover:bg-white/40 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
                      }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs font-medium">{item.name}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* 用户下拉菜单 (保持原有逻辑) */}
      <AnimatePresence>
        {isUserMenuOpen && user && (
          <motion.div
            id="user-dropdown-menu"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/20 dark:border-slate-700/50
                       bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl"
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

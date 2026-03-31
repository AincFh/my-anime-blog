import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "../ui/ThemeToggle";
import { LogOut, Settings, LayoutDashboard, Package, Home, Book, Archive, Tv, ShoppingBag, ImageIcon } from "lucide-react";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import { OnboardingTooltip } from "../ui/OnboardingTooltip";
import { useUser } from "~/hooks/useUser";
import { UserHUD } from "../ui/system/UserHUD";

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: "首页", path: "/", icon: Home },
  { name: "文章", path: "/articles", icon: Book },
  { name: "归档", path: "/archive", icon: Archive },
  { name: "图库", path: "/gallery", icon: ImageIcon },
  { name: "番剧", path: "/bangumi", icon: Tv },
  { name: "商城", path: "/shop", icon: ShoppingBag },
];

export function FloatingNav() {
  const { scrollY } = useScroll();
  const location = useLocation();
  // 调整滚动时的变换效果
  const y = useTransform(scrollY, [0, 100], [0, -10]); // 稍微上移一点

  const { user, loading } = useUser();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ... (moved out)

  return (
    <>
      {/* 导航栏容器 */}
      <motion.nav
        className="hidden md:block fixed top-[calc(env(safe-area-inset-top)+1rem)] md:top-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-2rem)] md:w-auto max-w-[95vw]"
        style={{ y }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div
          className="
            relative flex items-center justify-between md:justify-start py-2.5 px-3 md:px-2 rounded-full
            /* --- iOS 玻璃态核心样式 --- */
            bg-white/60                 /* 1. 高透的白色背景 */
            backdrop-blur-xl            /* 2. 极强的背景高斯模糊 */
            border border-white/40      /* 3. 半透明的白色边框 */
            shadow-[0_8px_30px_rgb(0,0,0,0.12)]    /* 4. 柔和的投影 */
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
                  prefetch="intent"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className={`
                    group relative block px-3 md:px-[10px] lg:px-5 py-2 text-sm lg:text-[15px] font-medium transition-colors duration-200 rounded-full z-10 whitespace-nowrap flex-shrink-0
                    /* 文字颜色逻辑 */
                    ${isActive ? "text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}
                  `}
                >
                  <div id={item.path === "/shop" ? "nav-item-shop" : undefined} className="relative z-20 flex items-center gap-1.5 transition-transform duration-200 active:scale-95">
                    {(() => {
                      const Icon = item.icon as any;
                      return <Icon
                        size={16}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={isActive ? "w-4 h-4 lg:w-5 lg:h-5" : "w-4 h-4 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform duration-200"}
                      />;
                    })()}
                    <span>{item.name}</span>
                  </div>

                  {/* --- 极简流体小圆点指示器 --- */}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 40,
                        mass: 0.8
                      }}
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-800 dark:bg-white rounded-full shadow-sm"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* 分割线 */}
          <div className="w-px h-5 bg-black/10 dark:bg-white/10 mx-1 lg:mx-3 hidden md:block"></div>

          {/* 右侧区域 (用户 & 主题) */}
          <div className="flex items-center gap-1 lg:gap-2 pr-1 lg:pr-2">
            {!isMounted ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ) : loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ) : user ? (
              <Link
                to="/user/dashboard"
                prefetch="intent"
                className="flex items-center gap-2 focus:outline-none p-1 rounded-full hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
              >
                <UserHUD user={user} compact={true} />
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-2 lg:px-3 py-1.5 text-[13px] lg:text-[14px] font-medium text-slate-500 hover:text-slate-800 transition-colors dark:text-slate-400 dark:hover:text-white"
              >
                登录
              </Link>
            )}

            <ThemeToggle />
          </div>
        </div>

        {/* 新用户引导提示 - 仅在客户端渲染且用户未点击过时显示 */}
        {isMounted && (
          <OnboardingTooltip
            stepKey="shop_nav"
            targetId="nav-item-shop"
            content="欢迎光临星尘商店！签到获得的积分可以在这里兑换头像框和主题哦 ✨"
            position="bottom"
          />
        )}
      </motion.nav>
    </>
  );
}

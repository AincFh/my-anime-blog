import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Home, Book, Archive, Tv, ShoppingBag, Image as ImageIcon, ChevronLeft, Heart, Share2, MoreHorizontal } from "lucide-react";
import { OnboardingTooltip } from "../ui/OnboardingTooltip";
import { useUser } from "~/hooks/useUser";
import { UserHUD } from "../ui/system/UserHUD";
import { IconEmoji } from "~/components/ui/IconEmoji";
import { cn } from "~/utils/cn";

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

// 检查是否为主页面
function isMainPage(pathname: string): boolean {
  const mainPages = ["/", "/articles", "/archive", "/gallery", "/bangumi", "/shop"];
  return mainPages.some(page => {
    if (page === "/") return pathname === "/";
    return pathname === page || pathname.startsWith(page + "/");
  });
}

// 获取返回目标页面
function getBackTarget(pathname: string): string {
  if (pathname.startsWith("/articles/") && pathname !== "/articles") return "/articles";
  if (pathname.startsWith("/bangumi/") && pathname !== "/bangumi") return "/bangumi";
  if (pathname.startsWith("/user/")) return "/user/dashboard";
  if (pathname.startsWith("/legal/")) return "/";
  if (pathname.startsWith("/privacy")) return "/";
  if (pathname.startsWith("/terms")) return "/";
  if (pathname.startsWith("/disclaimer")) return "/";
  if (pathname.startsWith("/changelog")) return "/";
  return "/";
}

interface FloatingNavProps {
  // 文章页额外功能
  articleActions?: {
    isLiked?: boolean;
    onLike?: () => void;
    onShare?: () => void;
  };
}

export function FloatingNav({ articleActions }: FloatingNavProps) {
  const { scrollY } = useScroll();
  const location = useLocation();
  const navigate = useNavigate();
  const y = useTransform(scrollY, [0, 100], [0, -10]);

  const { user, loading } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  const [isSubPage, setIsSubPage] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsSubPage(!isMainPage(location.pathname));
  }, [location.pathname]);

  const handleBack = () => {
    const target = getBackTarget(location.pathname);
    navigate(target);
  };

  // 角落按钮样式 - 液体玻璃效果
  const cornerBtnClass = [
    "relative flex items-center justify-center overflow-visible",
    "w-12 h-12 rounded-full",
    "backdrop-blur-xl",
    "transition-all duration-200 active:scale-95",
    // 边框
    "border border-white/40 dark:border-white/20",
    // 液体玻璃基础
    "before:absolute before:inset-0 before:rounded-full before:opacity-60 before:z-[-1]",
    "after:absolute after:inset-[-3px] after:rounded-full after:opacity-30 after:z-[-2]",
    // 浅色模式
    "bg-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]",
    "before:bg-gradient-to-b before:from-white/80 before:via-white/30 before:to-white/10",
    "after:bg-gradient-to-b after:from-white/60 after:to-transparent",
    // 深色模式
    "dark:bg-white/10 dark:shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]",
    "dark:before:bg-gradient-to-b dark:before:from-white/15 dark:before:via-white/5 dark:before:to-transparent",
    "dark:after:bg-gradient-to-b dark:after:from-white/20 dark:after:to-transparent"
  ].join(" ");

  return (
    <>
      {/* 左上角 - 返回按钮 */}
      <AnimatePresence>
        {isSubPage && (
          <motion.button
            key="back-btn"
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            onClick={handleBack}
            className="fixed z-[200] hidden md:flex overflow-visible"
            style={{ 
              top: "calc(env(safe-area-inset-top) + 1rem)",
              left: "1rem"
            }}
          >
            <div className={cn(cornerBtnClass, "text-slate-600 dark:text-white/80")}>
              <ChevronLeft size={20} strokeWidth={2.5} />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 右上角 - 功能按钮 */}
      <AnimatePresence>
        {isSubPage && (
          <motion.div
            key="action-btns"
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            className="fixed z-[200] hidden md:flex items-center gap-2 overflow-visible"
            style={{ 
              top: "calc(env(safe-area-inset-top) + 1rem)",
              right: "1rem"
            }}
          >
            {articleActions ? (
              <>
                <button
                  onClick={articleActions.onLike}
                  className={cn(cornerBtnClass, articleActions.isLiked && "text-rose-500")}
                >
                  <Heart size={18} className={cn(articleActions.isLiked && "fill-current")} />
                </button>
                <button
                  onClick={articleActions.onShare}
                  className={cn(cornerBtnClass, "text-slate-600 dark:text-white/80")}
                >
                  <Share2 size={18} />
                </button>
              </>
            ) : (
              <button className={cn(cornerBtnClass, "text-slate-600 dark:text-white/80")}>
                <MoreHorizontal size={20} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主导航栏 */}
      <motion.nav
        className="nav-floating hidden md:block fixed top-[calc(env(safe-area-inset-top)+1rem)] md:top-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100vw-2rem)] md:w-auto max-w-[95vw] rounded-full"
        style={{ y }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="relative flex items-center justify-between md:justify-start py-2.5 px-3 md:px-2">
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
                    group relative block px-3 md:px-[10px] lg:px-5 py-2 text-sm lg:text-[15px] font-medium rounded-full z-10 whitespace-nowrap flex-shrink-0
                    transition-all duration-200 ease-out
                    ${isActive
                      ? "text-slate-800 dark:text-white"
                      : "text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white"}
                  `}
                >
                  <div id={item.path === "/shop" ? "nav-item-shop" : undefined} className="relative z-20 flex items-center gap-1.5 transition-all duration-200 ease-out active:scale-95">
                    {(() => {
                      const Icon = item.icon as any;
                      return <Icon
                        size={16}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={`
                          w-4 h-4 lg:w-5 lg:h-5
                          transition-all duration-200 ease-out
                          group-hover:scale-110
                          ${isActive
                            ? "text-primary-start dark:text-primary-start"
                            : "text-slate-400 dark:text-white/35 group-hover:text-primary-start dark:group-hover:text-white/90"}
                        `}
                      />;
                    })()}
                    <span>{item.name}</span>
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 40,
                        mass: 0.8
                      }}
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary-start dark:bg-primary-start rounded-full shadow-[0_0_10px_rgba(255,159,67,0.7),0_0_20px_rgba(255,159,67,0.4)] dark:shadow-[0_0_12px_rgba(255,159,67,0.9),0_0_24px_rgba(255,159,67,0.5)]"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* 分割线 */}
          <div className="nav-divider w-px h-5 bg-black/10 dark:bg-white/10 mx-1 lg:mx-3 hidden md:block" />

          {/* 右侧区域 (用户 & 主题) */}
          <div className="flex items-center gap-1 lg:gap-2 pr-1 lg:pr-2">
            {!isMounted ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse" />
            ) : loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse" />
            ) : user ? (
              <Link
                to="/user/dashboard"
                prefetch="intent"
                className="flex items-center gap-2 focus:outline-none p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
              >
                <UserHUD user={user} compact={true} />
              </Link>
            ) : (
              <Link
                to="/login"
                className="nav-login-link px-2 lg:px-3 py-1.5 text-[13px] lg:text-[14px] font-medium text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white transition-all duration-200"
              >
                登录
              </Link>
            )}

            <ThemeToggle />
          </div>
        </div>

        {/* 新用户引导提示 */}
        {isMounted && (
          <OnboardingTooltip
            stepKey="shop_nav"
            targetId="nav-item-shop"
            content={<><IconEmoji emoji="✨" size={16} /> 签到获得的积分可以在这里兑换头像框和主题哦</>}
            position="bottom"
          />
        )}
      </motion.nav>
    </>
  );
}

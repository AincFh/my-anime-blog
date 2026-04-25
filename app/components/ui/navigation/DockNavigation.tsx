/**
 * 🍎 macOS Dock 风格的导航组件
 * 基于鼠标 X 坐标实现抛物线放大算法
 * 包含角落悬浮按钮: 左上角返回、右上角功能按钮
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router";
import { ChevronLeft, Bookmark, Share2, Heart, MoreHorizontal } from "lucide-react";
import { cn } from "~/utils/cn";

interface DockItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  href: string;
}

interface DockNavigationProps {
  items: DockItem[];
  className?: string;
  // 文章页额外功能
  articleActions?: {
    isLiked?: boolean;
    onLike?: () => void;
    onShare?: () => void;
  };
}

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

export function DockNavigation({ items, className = "", articleActions }: DockNavigationProps) {
  const dockRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubPage, setIsSubPage] = useState(false);

  useEffect(() => {
    setIsSubPage(!isMainPage(location.pathname));
  }, [location.pathname]);

  // 计算每个图标基于鼠标位置的放大率
  const getScale = useCallback((itemId: string, index: number) => {
    if (mouseX === null || !dockRef.current) return 1;

    const dock = dockRef.current;
    const dockRect = dock.getBoundingClientRect();
    const itemWidth = dockRect.width / items.length;
    
    const itemCenterX = dockRect.left + itemWidth * index + itemWidth / 2;
    const distance = Math.abs(mouseX - itemCenterX);
    const maxDistance = dockRect.width * 0.6;
    
    if (distance > maxDistance) return 1;
    
    const sigma = maxDistance / 3;
    const scale = Math.exp(-(distance * distance) / (2 * sigma * sigma));
    const finalScale = 1 + scale * 0.4;
    
    if (hoveredId === itemId) {
      return Math.min(finalScale * 1.1, 1.5);
    }
    
    return finalScale;
  }, [mouseX, items.length, hoveredId]);

  // 鼠标移动监听
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
    };

    const handleMouseLeave = () => {
      setMouseX(null);
      setHoveredId(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const handleBack = () => {
    const target = getBackTarget(location.pathname);
    navigate(target);
  };

  // 角落按钮的样式 - 和 dock 图标完全一致
  const cornerButtonClass = cn(
    "relative flex items-center justify-center",
    "w-12 h-12 rounded-xl",
    "bg-white/10 backdrop-blur-md",
    "text-white/80 hover:text-white",
    "transition-colors duration-200 active:scale-95"
  );

  return (
    <>
      {/* 左上角 - 返回按钮 (子页面显示) */}
      <AnimatePresence>
        {isSubPage && (
          <motion.button
            key="back-btn"
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            onClick={handleBack}
            className={cn(
              "fixed z-[200]",
              cornerButtonClass
            )}
            style={{ top: "calc(env(safe-area-inset-top) + 1rem)", left: "1rem" }}
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 右上角 - 页面功能按钮 (子页面显示) */}
      <AnimatePresence>
        {isSubPage && (
          <motion.div
            key="action-btns"
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            className="fixed z-[200] flex items-center gap-2"
            style={{ top: "calc(env(safe-area-inset-top) + 1rem)", right: "1rem" }}
          >
            {/* 文章页: 点赞 + 分享 */}
            {articleActions ? (
              <>
                <button
                  onClick={articleActions.onLike}
                  className={cn(
                    cornerButtonClass,
                    articleActions.isLiked && "bg-rose-500/30 text-rose-400"
                  )}
                >
                  <Heart size={16} className={cn(articleActions.isLiked && "fill-current")} />
                </button>
                <button
                  onClick={articleActions.onShare}
                  className={cornerButtonClass}
                >
                  <Share2 size={16} />
                </button>
              </>
            ) : (
              /* 默认: 更多菜单 */
              <button className={cornerButtonClass}>
                <MoreHorizontal size={18} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主 Dock 导航栏 */}
      <div
        ref={dockRef}
        className={cn(
          "flex items-end justify-center gap-1 p-3",
          "bg-white/[0.05] backdrop-blur-2xl",
          "rounded-2xl border border-white/[0.1]",
          "shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
          className
        )}
      >
        {items.map((item, index) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== "/" && location.pathname.startsWith(item.href));
          const scale = getScale(item.id, index);

          return (
            <motion.div
              key={item.id}
              className="relative group"
              animate={{
                scale,
                y: scale > 1.1 ? -(scale - 1) * 20 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.5,
              }}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <Link
                to={item.href}
                className={cn(
                  "relative flex items-center justify-center",
                  "w-12 h-12 rounded-xl",
                  "transition-colors duration-200",
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "text-white/60 hover:text-white"
                )}
              >
                {item.icon}
                
                {/* 悬停时的发光效果 */}
                {hoveredId === item.id && (
                  <motion.div
                    layoutId="glow"
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/30 to-pink-500/30 blur-md -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                )}
              </Link>

              {/* 悬停时的标签提示 */}
              <motion.div
                className={cn(
                  "absolute -top-10 left-1/2 -translate-x-1/2",
                  "px-3 py-1.5 rounded-lg",
                  "bg-black/80 backdrop-blur-md",
                  "text-white text-xs font-medium",
                  "whitespace-nowrap",
                  "opacity-0 group-hover:opacity-100",
                  "pointer-events-none",
                  "shadow-lg"
                )}
                initial={{ opacity: 0, y: 5 }}
                animate={{ 
                  opacity: hoveredId === item.id ? 1 : 0, 
                  y: hoveredId === item.id ? 0 : 5 
                }}
                transition={{ duration: 0.2 }}
              >
                {item.label}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/80" />
              </motion.div>

              {/* 活跃指示器 */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

// 简化版 Dock 图标（用于浮动导航）
interface FloatingDockIconProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  href?: string;
}

export function FloatingDockIcon({ icon, label, isActive, onClick, href }: FloatingDockIconProps) {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        setMouseX(Math.abs(e.clientX - centerX));
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const scale = mouseX !== null ? Math.max(1, 1.2 - mouseX / 100) : 1;

  const content = (
    <motion.div
      ref={ref}
      className={cn(
        "relative flex items-center justify-center",
        "w-11 h-11 rounded-xl cursor-pointer",
        "transition-colors duration-200",
        isActive 
          ? "bg-white/20 text-white" 
          : "text-white/60 hover:text-white"
      )}
      animate={{
        scale: isHovered ? 1.15 : scale,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
    >
      {icon}
      
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/30 to-pink-500/30 blur-md -z-10"
          layoutId="dockGlow"
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link to={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

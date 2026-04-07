/**
 * 🍎 macOS Dock 风格的导航组件
 * 基于鼠标 X 坐标实现抛物线放大算法
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router";

interface DockItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  href: string;
}

interface DockNavigationProps {
  items: DockItem[];
  className?: string;
}

export function DockNavigation({ items, className = "" }: DockNavigationProps) {
  const dockRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const location = useLocation();

  // 计算每个图标基于鼠标位置的放大率
  const getScale = useCallback((itemId: string, index: number) => {
    if (mouseX === null || !dockRef.current) return 1;

    const dock = dockRef.current;
    const dockRect = dock.getBoundingClientRect();
    const itemWidth = dockRect.width / items.length;
    
    // 当前项的中心 X 坐标
    const itemCenterX = dockRect.left + itemWidth * index + itemWidth / 2;
    
    // 与鼠标的距离
    const distance = Math.abs(mouseX - itemCenterX);
    
    // 最大影响距离（基于 Dock 宽度）
    const maxDistance = dockRect.width * 0.6;
    
    if (distance > maxDistance) return 1;
    
    // 使用高斯函数计算缩放（抛物线效果）
    const sigma = maxDistance / 3;
    const scale = Math.exp(-(distance * distance) / (2 * sigma * sigma));
    
    // 最大放大到 1.4 倍
    const finalScale = 1 + scale * 0.4;
    
    // 如果是悬停项，额外放大
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

  return (
    <div
      ref={dockRef}
      className={`
        flex items-end justify-center gap-1 p-3
        bg-white/[0.05] backdrop-blur-2xl
        rounded-2xl border border-white/[0.1]
        shadow-[0_8px_32px_rgba(0,0,0,0.3)]
        ${className}
      `}
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
              className={`
                relative flex items-center justify-center
                w-12 h-12 rounded-xl
                transition-colors duration-200
                ${isActive 
                  ? "bg-white/20 text-white" 
                  : "text-white/60 hover:text-white"
                }
              `}
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
              className={`
                absolute -top-10 left-1/2 -translate-x-1/2
                px-3 py-1.5 rounded-lg
                bg-black/80 backdrop-blur-md
                text-white text-xs font-medium
                whitespace-nowrap
                opacity-0 group-hover:opacity-100
                pointer-events-none
                shadow-lg
              `}
              initial={{ opacity: 0, y: 5 }}
              animate={{ 
                opacity: hoveredId === item.id ? 1 : 0, 
                y: hoveredId === item.id ? 0 : 5 
              }}
              transition={{ duration: 0.2 }}
            >
              {item.label}
              {/* 标签底部小三角 */}
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
      className={`
        relative flex items-center justify-center
        w-11 h-11 rounded-xl cursor-pointer
        transition-colors duration-200
        ${isActive 
          ? "bg-white/20 text-white" 
          : "text-white/60 hover:text-white"
        }
      `}
      animate={{
        scale: isHovered ? 1.15 : scale,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
    >
      {icon}
      
      {/* 悬停发光 */}
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

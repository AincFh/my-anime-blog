/**
 * 🍎 Apple HIG 毛玻璃性能优化组件
 * 
 * Phase 0: 绝对性能防御协议
 * 毛玻璃 (backdrop-filter) 是移动端滚动的万恶之源
 * 必须严格控制使用场景和使用方式
 */

import { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { usePerformanceLevel } from "~/hooks/useAnimationPerformance";

interface GlassProps {
  children: React.ReactNode;
  className?: string;
  /** 模糊强度：low | medium | high | none */
  blur?: "none" | "low" | "medium" | "high";
  /** 是否在滚动时禁用模糊 */
  disableOnScroll?: boolean;
  /** 滚动时切换到低模糊 */
  scrollBlur?: "none" | "low" | "medium" | "high";
}

/**
 * 性能优先的毛玻璃组件
 * - 移动端自动降级
 * - 滚动时可选降级
 * - 低性能设备自动禁用
 */
export const Glass = forwardRef<HTMLDivElement, GlassProps>(
  function Glass({ 
    children, 
    className = "", 
    blur = "medium",
    disableOnScroll = false,
    scrollBlur = "low",
  }, ref) {
    const { level } = usePerformanceLevel();
    const prefersReducedMotion = useReducedMotion();

    // 获取模糊 CSS
    const getBlurClass = (level: "none" | "low" | "medium" | "high") => {
      switch (level) {
        case "none": return "";
        case "low": return "backdrop-blur-sm";
        case "medium": return "backdrop-blur-md";
        case "high": return "backdrop-blur-xl";
      }
    };

    // 性能等级对应的模糊级别
    const performanceBlurLevel = level === "low" ? "none" 
      : level === "medium" ? "low" 
      : blur;

    return (
      <div
        ref={ref}
        className={`
          bg-white/[0.05] 
          border border-white/[0.08]
          ${getBlurClass(performanceBlurLevel)}
          ${className}
        `}
      >
        {children}
      </div>
    );
  }
);

/**
 * 深层毛玻璃 - 仅在高性能设备上启用
 * 用于重要层级的 UI（如模态框、浮层）
 */
interface DeepGlassProps {
  children: React.ReactNode;
  className?: string;
  enabled?: boolean;
}

export const DeepGlass = forwardRef<HTMLDivElement, DeepGlassProps>(
  function DeepGlass({ children, className = "", enabled = true }, ref) {
    const { level } = usePerformanceLevel();
    const prefersReducedMotion = useReducedMotion();

    // 仅在高性能设备上启用
    const isEnabled = enabled && level === "high" && !prefersReducedMotion;

    return (
      <div
        ref={ref}
        className={`
          ${isEnabled 
            ? "bg-white/[0.08] backdrop-blur-2xl border border-white/[0.12]" 
            : "bg-slate-900/90 border border-slate-700/50"
          }
          ${className}
        `}
      >
        {children}
      </div>
    );
  }
);

/**
 * 性能优化的动画毛玻璃容器
 * 用于需要动效的毛玻璃场景
 */
interface AnimatedGlassProps {
  children: React.ReactNode;
  className?: string;
  isVisible?: boolean;
}

export function AnimatedGlass({ 
  children, 
  className = "", 
  isVisible = true 
}: AnimatedGlassProps) {
  const { level } = usePerformanceLevel();
  const prefersReducedMotion = useReducedMotion();

  // 低性能或用户偏好减少动效时简化动画
  const shouldAnimate = level === "high" && !prefersReducedMotion;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
      animate={shouldAnimate ? { opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 } : {}}
      transition={{ 
        duration: level === "low" ? 0.15 : 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={`
        ${level === "high" 
          ? "bg-white/[0.05] backdrop-blur-xl border border-white/[0.08]" 
          : "bg-slate-900/95 border border-slate-700/50"
        }
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

/**
 * 性能优先的阴影组件
 */
interface ShadowProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "sm" | "md" | "lg" | "xl";
}

export function Shadow({ 
  children, 
  className = "", 
  intensity = "md" 
}: ShadowProps) {
  const { level } = usePerformanceLevel();

  const shadowClasses = {
    sm: "shadow-sm",
    md: level === "low" ? "shadow-sm" : "shadow-md",
    lg: level === "low" ? "shadow-sm" : level === "medium" ? "shadow-md" : "shadow-lg",
    xl: level === "low" ? "shadow-md" : level === "medium" ? "shadow-lg" : "shadow-xl",
  };

  return (
    <div className={`${shadowClasses[intensity]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * 性能预算内的光晕组件
 */
interface GlowProps {
  children: React.ReactNode;
  className?: string;
  color?: "orange" | "purple" | "blue" | "pink";
}

export function Glow({ 
  children, 
  className = "", 
  color = "orange" 
}: GlowProps) {
  const { level } = usePerformanceLevel();

  // 低性能设备禁用光晕
  if (level === "low") {
    return <div className={className}>{children}</div>;
  }

  const glowColors = {
    orange: "rgba(255, 159, 67, 0.3)",
    purple: "rgba(139, 92, 246, 0.3)",
    blue: "rgba(59, 130, 246, 0.3)",
    pink: "rgba(236, 72, 153, 0.3)",
  };

  const blurAmount = level === "medium" ? "20px" : "40px";

  return (
    <div className={`relative ${className}`}>
      {/* 光晕层 */}
      <div
        className="absolute inset-0 rounded-full blur-xl pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${glowColors[color]} 0%, transparent 70%)`,
          filter: `blur(${blurAmount})`,
          opacity: level === "medium" ? 0.5 : 1,
        }}
      />
      {/* 内容层 */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * 滚动时降级的容器
 */
interface ScrollDegradeContainerProps {
  children: React.ReactNode;
  className?: string;
  degradeOnScroll?: boolean;
}

export function ScrollDegradeContainer({ 
  children, 
  className = "",
  degradeOnScroll = false 
}: ScrollDegradeContainerProps) {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const handleScroll = () => {
    if (!degradeOnScroll) return;
    
    setIsScrolling(true);
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150); // 滚动停止 150ms 后恢复
  };

  return (
    <div 
      className={className}
      onScroll={handleScroll}
    >
      {/* 使用 CSS 变量控制降级 */}
      <div
        style={{
          backdropFilter: isScrolling ? "blur(4px)" : undefined,
          transition: "backdrop-filter 0.15s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// 导入 useRef
import { useRef } from "react";

/**
 * 🍎 Apple HIG 性能优先动画 Hooks
 * 
 * Phase 0: 绝对性能防御协议
 * 所有动画必须：
 * 1. 使用 MotionValue 而非 State
 * 2. 仅操作 Transform 和 Opacity（GPU 加速）
 * 3. 禁止使用 width/height/left/top 等布局属性
 */

import { 
  useScroll, 
  useTransform, 
  useSpring,
  type MotionValue,
  type Transition,
} from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";

/**
 * 性能优先的滚动动画 Hook
 * 返回 MotionValue，不触发 React 重渲染
 */
export function useScrollAnimation(
  target: React.RefObject<HTMLElement | null>,
  options?: {
    offset?: ["start start" | "end end" | "start end" | "end start", "start start" | "end end" | "start end" | "end start"];
    outputRange?: [number, number];
    spring?: boolean;
  }
) {
  const { outputRange = [0, 1], spring = true } = options || {};
  
  const { scrollYProgress } = useScroll({
    target,
    offset: options?.offset || ["start start", "end end"],
  });

  // 使用 useTransform 直接映射，避免中间 state
  const rawValue = useTransform(scrollYProgress, [0, 1], outputRange);

  // 如果需要 spring 效果，包装为 spring motion value
  const value = spring 
    ? useSpring(rawValue, { stiffness: 100, damping: 30, mass: 0.5 })
    : rawValue;

  return value;
}

/**
 * 视差滚动效果（性能优先）
 * 元素根据滚动位置产生不同的移动速度
 */
export function useParallax(
  target: React.RefObject<HTMLElement | null>,
  speed: number = 0.5 // 0 = 不动, 0.5 = 半速, 1 = 正常速度
) {
  const { scrollYProgress } = useScroll({
    target,
    offset: ["start end", "end start"],
  });

  // 反向移动创造视差效果
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [`${speed * 100}px`, `${-speed * 100}px`]
  );

  return { y, progress: scrollYProgress };
}

/**
 * 渐入渐出效果（基于滚动位置）
 */
export function useFadeOnScroll(
  target: React.RefObject<HTMLElement | null>
) {
  const { scrollYProgress } = useScroll({
    target,
    offset: ["start end", "center center", "end start"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0, 1, 1, 0]
  );

  const scale = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0.95, 1, 1, 0.95]
  );

  return { opacity, scale };
}

/**
 * 交错动画索引计算 Hook
 * 用于列表项的依次入场动画
 */
export function useStaggerIndex(index: number, baseDelay: number = 0.1) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const delay = hasAnimated ? index * baseDelay : 0;

  return { ref, delay, hasAnimated };
}

/**
 * 节流 Hook（用于性能优化）
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        lastRun.current = now;
        return callback(...args);
      } else {
        // 下次立即执行
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          lastRun.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastRun);
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * 防抖 Hook
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

/**
 * 性能优先的 Spring 动画配置
 */
export const springTransition: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 35,
  mass: 0.8,
};

/**
 * 性能优先的平滑动画配置
 */
export const smoothTransition: Transition = {
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1], // Apple 推荐的 ease 曲线
};

/**
 * 组合多个 MotionValue
 */
export function useCombineMotionValues(
  values: MotionValue<number>[],
  combiner: (values: number[]) => number
): MotionValue<number> {
  const { useFrame } = require("framer-motion");
  const [result, setResult] = useState(0);

  useFrame(() => {
    const currentValues = values.map(v => v.get());
    setResult(combiner(currentValues));
  });

  return { get: () => result } as MotionValue<number>;
}

/**
 * 鼠标跟随效果（不卡顿）
 * 使用 CSS transform 而非 left/top
 */
export function useMouseFollow(
  ref: React.RefObject<HTMLElement | null>,
  options?: {
    smoothness?: number; // 0-1，越大越跟手
    maxOffset?: number; // 最大偏移量
  }
) {
  const { smoothness = 0.15, maxOffset = 20 } = options || {};
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // 计算偏移量
      let dx = (e.clientX - centerX) / rect.width;
      let dy = (e.clientY - centerY) / rect.height;

      // 限制最大偏移
      dx = Math.max(-1, Math.min(1, dx)) * maxOffset;
      dy = Math.max(-1, Math.min(1, dy)) * maxOffset;

      targetRef.current = { x: dx, y: dy };
    };

    const animate = () => {
      setPosition(prev => ({
        x: prev.x + (targetRef.current.x - prev.x) * smoothness,
        y: prev.y + (targetRef.current.y - prev.y) * smoothness,
      }));
      rafRef.current = requestAnimationFrame(animate);
    };

    const handleMouseLeave = () => {
      targetRef.current = { x: 0, y: 0 };
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ref, smoothness, maxOffset]);

  return {
    x: position.x,
    y: position.y,
    style: {
      transform: `translate(${position.x}px, ${position.y}px)`,
    },
  };
}

/**
 * 性能检测 Hook
 */
export function usePerformanceLevel() {
  const [level, setLevel] = useState<"high" | "medium" | "low">("high");
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let lowFpsCount = 0;

    const measure = () => {
      frameCount++;
      const now = performance.now();

      if (now - lastTime >= 1000) {
        const currentFps = Math.round(frameCount * 1000 / (now - lastTime));
        setFps(currentFps);

        // 连续 3 秒低于 30fps 则判定为低性能设备
        if (currentFps < 30) {
          lowFpsCount++;
          if (lowFpsCount >= 3) {
            setLevel("low");
          }
        } else if (currentFps < 50) {
          setLevel("medium");
        } else {
          setLevel("high");
          lowFpsCount = 0;
        }

        frameCount = 0;
        lastTime = now;
      }

      requestAnimationFrame(measure);
    };

    const rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return { level, fps, shouldReduceMotion: level === "low" };
}

/**
 * 根据性能等级返回不同的动画配置
 */
export function useAdaptiveAnimation() {
  const { level, shouldReduceMotion } = usePerformanceLevel();

  const config = {
    high: {
      duration: 400,
      spring: { stiffness: 500, damping: 35 },
      blur: "blur(8px)" as const,
      shadow: true,
    },
    medium: {
      duration: 300,
      spring: { stiffness: 300, damping: 25 },
      blur: "blur(4px)" as const,
      shadow: true,
    },
    low: {
      duration: 150,
      spring: { stiffness: 200, damping: 20 },
      blur: "blur(2px)" as const,
      shadow: false,
    },
  };

  return {
    ...config[level],
    reduceMotion: shouldReduceMotion,
  };
}

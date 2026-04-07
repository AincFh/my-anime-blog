/**
 * 🍎 Canvas 指尖流体残影层 - 性能优化版
 * 
 * Phase 0: 绝对性能防御协议
 * 1. 使用 requestAnimationFrame 脱离 React 主线程
 * 2. 限制最大粒子数量防止内存泄漏
 * 3. 支持用户交互后才启用（首屏优先）
 * 4. Canvas 使用 GPU 加速的 transform
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useMotionValue, useTransform } from "framer-motion";

interface TrailPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

interface FluidTrailProps {
  className?: string;
  maxTrailLength?: number;
  enabled?: boolean;
  /** 延迟启用（毫秒），首屏加载完成后才激活 */
  activationDelay?: number;
  /** 粒子尺寸上限 */
  maxParticleSize?: number;
}

export function FluidTrailCanvas({ 
  className = "", 
  maxTrailLength = 30,
  enabled = true,
  activationDelay = 2000,
  maxParticleSize = 8,
}: FluidTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<TrailPoint[]>([]);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isEnabledRef = useRef(false);
  
  // 性能追踪
  const fpsRef = useRef({ frames: 0, lastCheck: 0, current: 60 });
  const [isActive, setIsActive] = useState(false);

  // 延迟启用（首屏优先）
  useEffect(() => {
    if (!enabled) return;
    
    // 首屏加载完成后才启用
    const timeout = setTimeout(() => {
      isEnabledRef.current = true;
      setIsActive(true);
    }, activationDelay);

    return () => clearTimeout(timeout);
  }, [enabled, activationDelay]);

  // 添加轨迹点（不触发 React 重渲染）
  const addPoint = useCallback((x: number, y: number) => {
    if (!isEnabledRef.current) return;
    
    pointsRef.current.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 1,
      maxLife: 60, // 约 1 秒寿命
      size: Math.random() * maxParticleSize + 2,
      hue: 25 + Math.random() * 20, // 橙色系
    });

    // 硬限制防止内存泄漏
    if (pointsRef.current.length > maxTrailLength) {
      pointsRef.current.shift();
    }
  }, [maxTrailLength, maxParticleSize]);

  // 监听鼠标事件（节流）
  useEffect(() => {
    if (!enabled || !isActive) return;

    let lastX = 0, lastY = 0;
    
    const handleMove = (e: MouseEvent) => {
      // 节流：只在移动足够距离时添加点
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 8) { // 至少移动 8px
        addPoint(e.clientX, e.clientY);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };

    document.addEventListener("mousemove", handleMove, { passive: true });
    return () => document.removeEventListener("mousemove", handleMove);
  }, [enabled, isActive, addPoint]);

  // Canvas 动画循环（独立于 React 渲染）
  useEffect(() => {
    if (!enabled || !isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // 设置 Canvas 尺寸
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // 主动画循环
    const animate = (timestamp: number) => {
      // FPS 限制：最高 30fps 降低 CPU 负载
      const delta = timestamp - lastTimeRef.current;
      if (delta < 33) { // ~30fps
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTimeRef.current = timestamp;

      // FPS 追踪
      fpsRef.current.frames++;
      if (timestamp - fpsRef.current.lastCheck >= 1000) {
        fpsRef.current.current = fpsRef.current.frames;
        fpsRef.current.frames = 0;
        fpsRef.current.lastCheck = timestamp;
      }

      // 清除画布（使用混合模式实现拖尾）
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)"; // 渐隐而非完全清除
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 更新并绘制粒子
      pointsRef.current = pointsRef.current.filter(point => {
        // 物理更新
        point.x += point.vx;
        point.y += point.vy;
        point.vx *= 0.98;
        point.vy *= 0.98;
        point.life -= 1 / point.maxLife;

        if (point.life <= 0) return false;

        // 绘制（使用 GPU 友好的 radialGradient）
        const gradient = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, point.size
        );
        
        const alpha = point.life * 0.6;
        gradient.addColorStop(0, `hsla(${point.hue}, 100%, 65%, ${alpha})`);
        gradient.addColorStop(0.5, `hsla(${point.hue}, 90%, 55%, ${alpha * 0.5})`);
        gradient.addColorStop(1, `hsla(${point.hue}, 80%, 45%, 0)`);

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      // 低性能时自动降级
      if (fpsRef.current.current < 25 && maxTrailLength > 10) {
        pointsRef.current = pointsRef.current.slice(0, Math.floor(maxTrailLength / 2));
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, isActive, maxTrailLength]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-[9999] ${className}`}
      style={{ 
        mixBlendMode: "screen",
        willChange: "transform", // GPU 加速提示
        contain: "strict", // CSS 包含
      }}
    />
  );
}

/**
 * 触摸波纹效果 - 性能优化版
 */
export function TouchRippleCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Array<{
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    opacity: number;
  }>>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // 点击添加波纹（节流）
    let lastClick = 0;
    const handleClick = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastClick < 100) return; // 最多 10fps
      lastClick = now;

      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 80,
        opacity: 0.4,
      });
    };

    document.addEventListener("click", handleClick, { passive: true });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ripplesRef.current = ripplesRef.current.filter(ripple => {
        ripple.radius += 3;
        ripple.opacity -= 0.015;

        if (ripple.opacity <= 0 || ripple.radius >= ripple.maxRadius) return false;

        ctx.beginPath();
        ctx.strokeStyle = `hsla(30, 100%, 60%, ${ripple.opacity})`;
        ctx.lineWidth = 2;
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();

        return true;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("click", handleClick);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-[9998] ${className}`}
    />
  );
}

/**
 * 性能监控 Hook
 * 用于检测当前设备性能并自动降级
 */
export function usePerformanceMonitor() {
  const [fps, setFps] = useState(60);
  const [isLowEnd, setIsLowEnd] = useState(false);
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measure = () => {
      frameCount++;
      const now = performance.now();
      
      if (now - lastTime >= 1000) {
        const currentFps = Math.round(frameCount * 1000 / (now - lastTime));
        setFps(currentFps);
        setIsLowEnd(currentFps < 30);
        frameCount = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(measure);
    };
    
    const rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, []);
  
  return { fps, isLowEnd };
}

/**
 * 性能优化工具函数
 * 功能：设备检测、降级策略、性能监控、动态调整
 */

// 统一从 device.ts 导入类型，避免重复定义
export type { PerformanceLevel } from './device';

export const PERFORMANCE_PREFERENCE_KEY = 'anime-blog-performance-level';

// 直接复用 device.ts 的检测函数
export { getDeviceInfo, isTouchDevice, getPerformanceConfig, getPerformanceLevel } from './device';

/**
 * 兼容旧调用 —— isMobileDevice（内联实现，避免 re-export 在 SSR 下找不到）
 * 仅在客户端执行
 */
export function isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    const width = window.innerWidth;
    return width < 768;
}

/**
 * 检测设备性能（简单版）
 * 基于硬件并发数和设备内存（如果可用）
 */
export function getDevicePerformance(): 'high' | 'medium' | 'low' {
  if (typeof window === "undefined") return "high";

  // 检查用户偏好
  const savedPreference = getSavedPerformancePreference();
  if (savedPreference) return savedPreference;

  const isMobile = typeof window !== "undefined" && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
    || window.innerWidth < 768
  );
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory || 4;

  if (isMobile) {
    if (hardwareConcurrency >= 6 && deviceMemory >= 4) return "medium";
    return "low";
  }

  if (hardwareConcurrency >= 8 && deviceMemory >= 8) return "high";
  if (hardwareConcurrency >= 4 && deviceMemory >= 4) return "medium";
  return "low";
}

/**
 * 保存用户性能偏好
 */
export function savePerformancePreference(level: 'high' | 'medium' | 'low'): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PERFORMANCE_PREFERENCE_KEY, level);
}

/**
 * 获取保存的性能偏好
 */
export function getSavedPerformancePreference(): 'high' | 'medium' | 'low' | null {
  if (typeof localStorage === "undefined") return null;
  const saved = localStorage.getItem(PERFORMANCE_PREFERENCE_KEY);
  if (saved === "high" || saved === "medium" || saved === "low") return saved;
  return null;
}

/**
 * 是否应该启用高性能特效
 */
export function shouldEnableHighPerformanceEffects(): boolean {
  const perf = getDevicePerformance();
  const isMobile = typeof window !== "undefined" && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
    || window.innerWidth < 768
  );
  return perf === "high" && !isMobile;
}

/**
 * 是否应该启用粒子特效
 */
export function shouldEnableParticles(): boolean {
  const isMobile = typeof window !== "undefined" && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
    || window.innerWidth < 768
  );
  if (isMobile) return false;
  const perf = getDevicePerformance();
  if (perf === "low") return false;
  return true;
}

/**
 * 是否应该使用毛玻璃效果
 * 用户要求保留毛玻璃作为网站主题，不降级
 */
export function shouldUseGlassmorphism(): boolean {
  return true;
}

/**
 * 获取推荐的粒子数量
 */
export function getRecommendedParticleCount(baseCount: number): number {
  const perf = getDevicePerformance();
  const isMobile = typeof window !== "undefined" && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
    || window.innerWidth < 768
  );
  if (isMobile) return Math.floor(baseCount * 0.3);
  if (perf === "low") return Math.floor(baseCount * 0.4);
  if (perf === "medium") return Math.floor(baseCount * 0.7);
  return baseCount;
}

/**
 * FPS 性能监控器
 * 用于实时监控帧率并动态降级
 */
export class PerformanceMonitor {
  private frames: number[] = [];
  private lastTime: number = 0;
  private animationId: number | null = null;
  private callbacks: Set<(fps: number, level: PerformanceLevel) => void> = new Set();
  private isRunning: boolean = false;
  private currentLevel: PerformanceLevel = "high";

  // FPS 阈值
  private static readonly HIGH_FPS_THRESHOLD = 50;
  private static readonly LOW_FPS_THRESHOLD = 30;
  private static readonly SAMPLE_SIZE = 60; // 1 秒采样

  /**
   * 开始监控
   */
  start(): void {
    if (this.isRunning || typeof window === "undefined") return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick();
  }

  /**
   * 停止监控
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 注册 FPS 变化回调
   */
  onFPSChange(callback: (fps: number, level: PerformanceLevel) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * 获取当前 FPS
   */
  getCurrentFPS(): number {
    if (this.frames.length === 0) return 60;
    return Math.round(this.frames.reduce((a, b) => a + b, 0) / this.frames.length);
  }

  /**
   * 获取当前性能级别
   */
  getCurrentLevel(): PerformanceLevel {
    return this.currentLevel;
  }

  private tick = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    // 计算当前帧 FPS
    const fps = 1000 / delta;
    this.frames.push(fps);

    // 只保留最近的采样
    if (this.frames.length > PerformanceMonitor.SAMPLE_SIZE) {
      this.frames.shift();
    }

    // 每 30 帧检查一次性能级别
    if (this.frames.length % 30 === 0) {
      const avgFPS = this.getCurrentFPS();
      const newLevel = this.calculateLevel(avgFPS);

      if (newLevel !== this.currentLevel) {
        this.currentLevel = newLevel;
        this.notifyCallbacks(avgFPS, newLevel);
      }
    }

    this.animationId = requestAnimationFrame(this.tick);
  };

  private calculateLevel(fps: number): PerformanceLevel {
    if (fps >= PerformanceMonitor.HIGH_FPS_THRESHOLD) return "high";
    if (fps >= PerformanceMonitor.LOW_FPS_THRESHOLD) return "medium";
    return "low";
  }

  private notifyCallbacks(fps: number, level: PerformanceLevel): void {
    this.callbacks.forEach(cb => cb(fps, level));
  }
}

// 全局性能监控实例
let globalMonitor: PerformanceMonitor | null = null;

/**
 * 获取全局性能监控实例
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor();
  }
  return globalMonitor;
}

/**
 * 启动全局性能监控
 */
export function startPerformanceMonitoring(): void {
  getPerformanceMonitor().start();
}

/**
 * 停止全局性能监控
 */
export function stopPerformanceMonitoring(): void {
  if (globalMonitor) {
    globalMonitor.stop();
  }
}


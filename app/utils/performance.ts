/**
 * 性能优化工具函数
 * 功能：设备检测、降级策略、性能监控、动态调整
 */

export type PerformanceLevel = "high" | "medium" | "low";

// 性能偏好存储 key
const PERFORMANCE_PREFERENCE_KEY = 'anime-blog-performance-level';

/**
 * 检测是否为移动设备
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || (window.innerWidth < 768);
}

/**
 * 检测设备性能（简单版）
 * 基于硬件并发数和设备内存（如果可用）
 */
export function getDevicePerformance(): PerformanceLevel {
  if (typeof window === "undefined") return "high";

  // 检查用户偏好
  const savedPreference = getSavedPerformancePreference();
  if (savedPreference) return savedPreference;

  const isMobile = isMobileDevice();
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  const deviceMemory = (navigator as any).deviceMemory || 4;

  if (isMobile) {
    // 移动设备默认中等或低性能
    if (hardwareConcurrency >= 6 && deviceMemory >= 4) {
      return "medium";
    }
    return "low";
  }

  // PC设备
  if (hardwareConcurrency >= 8 && deviceMemory >= 8) {
    return "high";
  } else if (hardwareConcurrency >= 4 && deviceMemory >= 4) {
    return "medium";
  }
  return "low";
}

/**
 * 保存用户性能偏好
 */
export function savePerformancePreference(level: PerformanceLevel): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PERFORMANCE_PREFERENCE_KEY, level);
}

/**
 * 获取保存的性能偏好
 */
export function getSavedPerformancePreference(): PerformanceLevel | null {
  if (typeof localStorage === "undefined") return null;
  const saved = localStorage.getItem(PERFORMANCE_PREFERENCE_KEY);
  if (saved === "high" || saved === "medium" || saved === "low") {
    return saved;
  }
  return null;
}

/**
 * 是否应该启用高性能特效
 */
export function shouldEnableHighPerformanceEffects(): boolean {
  const performance = getDevicePerformance();
  return performance === "high" && !isMobileDevice();
}

/**
 * 是否应该启用粒子特效
 */
export function shouldEnableParticles(): boolean {
  const performance = getDevicePerformance();
  // 低性能设备完全禁用粒子
  if (performance === "low") return false;
  // 移动端仅高性能设备启用
  if (isMobileDevice()) return performance === "medium";
  // PC 设备中等以上启用
  return true;
}

/**
 * 是否应该使用毛玻璃效果
 * 用户要求保留毛玻璃作为网站主题，不降级
 */
export function shouldUseGlassmorphism(): boolean {
  // 毛玻璃效果是网站主题的一部分，始终启用
  return true;
}

/**
 * 获取推荐的粒子数量
 */
export function getRecommendedParticleCount(baseCount: number): number {
  const performance = getDevicePerformance();
  const isMobile = isMobileDevice();

  if (isMobile) return Math.floor(baseCount * 0.3);
  if (performance === "low") return Math.floor(baseCount * 0.4);
  if (performance === "medium") return Math.floor(baseCount * 0.7);
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


/**
 * 性能优化工具函数
 * 功能：设备检测、降级策略、性能监控
 */

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
export function getDevicePerformance(): "high" | "medium" | "low" {
  if (typeof window === "undefined") return "high";
  
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
  return shouldEnableHighPerformanceEffects();
}

/**
 * 是否应该使用毛玻璃效果
 */
export function shouldUseGlassmorphism(): boolean {
  const performance = getDevicePerformance();
  // 移动端或低性能设备使用半透明纯色
  if (isMobileDevice() || performance === "low") {
    return false;
  }
  return true;
}


/**
 * 动效预算管理系统 (Animation Budget Manager)
 * 
 * 设计原则：
 * 同一时刻最多 2-3 个动效同时进行，避免视觉混乱和性能问题
 * 
 * 优先级层级：
 * 1. CRITICAL (导航切换、页面过渡) - 永不跳过
 * 2. HIGH (内容入场动效、模态框) - 低端设备可简化
 * 3. MEDIUM (卡片悬停、按钮反馈) - 可降级
 * 4. LOW (背景粒子、Bokeh 光晕) - 可完全禁用
 */

import { usePrefersReducedMotion } from '~/utils/responsive';

export type AnimationPriority = 'critical' | 'high' | 'medium' | 'low';

interface AnimationConfig {
    /** 当前运行的动效数量 */
    maxConcurrent: number;
    /** 动效优先级阈值，低于此优先级的动效将被跳过 */
    minPriority: AnimationPriority;
}

const PRIORITY_ORDER: Record<AnimationPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
};

/**
 * 获取动效配置
 * 根据设备性能和用户偏好返回合适的动效配置
 */
export function getAnimationConfig(): AnimationConfig {
    // 服务端渲染时返回保守配置
    if (typeof window === 'undefined') {
        return { maxConcurrent: 2, minPriority: 'high' };
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        return { maxConcurrent: 1, minPriority: 'critical' };
    }

    // 检测设备性能
    const deviceMemory = (navigator as any).deviceMemory || 4; // GB
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;

    // 低端设备
    if (deviceMemory <= 2 || hardwareConcurrency <= 2) {
        return { maxConcurrent: 2, minPriority: 'high' };
    }

    // 中端设备
    if (deviceMemory <= 4 || hardwareConcurrency <= 4) {
        return { maxConcurrent: 3, minPriority: 'medium' };
    }

    // 高端设备
    return { maxConcurrent: 5, minPriority: 'low' };
}

/**
 * 判断动效是否应该启用
 */
export function shouldEnableAnimation(priority: AnimationPriority): boolean {
    const config = getAnimationConfig();
    return PRIORITY_ORDER[priority] >= PRIORITY_ORDER[config.minPriority];
}

/**
 * 动效持续时间降级
 * 根据设备性能返回合适的动效持续时间
 */
export function getAnimationDuration(baseDuration: number, priority: AnimationPriority): number {
    const config = getAnimationConfig();

    // 优先级低于阈值时，返回极短时长（接近无动效）
    if (PRIORITY_ORDER[priority] < PRIORITY_ORDER[config.minPriority]) {
        return 0.01;
    }

    // 根据配置调整时长
    const multiplier = config.minPriority === 'high' ? 0.6 :
        config.minPriority === 'medium' ? 0.8 : 1;

    return baseDuration * multiplier;
}

/**
 * React Hook：使用动效预算
 */
export function useAnimationBudget(priority: AnimationPriority) {
    const prefersReducedMotion = usePrefersReducedMotion();

    return {
        enabled: !prefersReducedMotion && shouldEnableAnimation(priority),
        getDuration: (baseDuration: number) => getAnimationDuration(baseDuration, priority),
    };
}

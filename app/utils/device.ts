/**
 * 设备与浏览器检测工具
 * 用于适配不同设备的展示和性能优化
 */

// 设备类型
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// 浏览器类型
export type BrowserType = 'chrome' | 'safari' | 'firefox' | 'edge' | 'samsung' | 'opera' | 'unknown';

// 操作系统
export type OSType = 'windows' | 'macos' | 'ios' | 'android' | 'linux' | 'unknown';

// 设备信息接口
export interface DeviceInfo {
    type: DeviceType;
    browser: BrowserType;
    os: OSType;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isTouchDevice: boolean;
    isLowEndDevice: boolean;
    screenWidth: number;
    screenHeight: number;
    pixelRatio: number;
    orientation: 'portrait' | 'landscape';
}

// 断点定义（与 Tailwind 对齐）
export const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const;

// 检测设备类型
export function getDeviceType(): DeviceType {
    if (typeof window === 'undefined') return 'desktop';

    const width = window.innerWidth;

    if (width < BREAKPOINTS.md) return 'mobile';
    if (width < BREAKPOINTS.lg) return 'tablet';
    return 'desktop';
}

// 检测浏览器类型
export function getBrowserType(): BrowserType {
    if (typeof navigator === 'undefined') return 'unknown';

    const ua = navigator.userAgent.toLowerCase();

    if (ua.includes('edg/')) return 'edge';
    if (ua.includes('samsungbrowser')) return 'samsung';
    if (ua.includes('opr/') || ua.includes('opera')) return 'opera';
    if (ua.includes('chrome') && !ua.includes('edg/')) return 'chrome';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
    if (ua.includes('firefox')) return 'firefox';

    return 'unknown';
}

// 检测操作系统
export function getOSType(): OSType {
    if (typeof navigator === 'undefined') return 'unknown';

    const ua = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';

    // iOS 检测
    if (/iphone|ipad|ipod/.test(ua) || (platform === 'macintel' && navigator.maxTouchPoints > 1)) {
        return 'ios';
    }

    // Android 检测
    if (ua.includes('android')) return 'android';

    // macOS 检测
    if (platform.includes('mac')) return 'macos';

    // Windows 检测
    if (platform.includes('win')) return 'windows';

    // Linux 检测
    if (platform.includes('linux')) return 'linux';

    return 'unknown';
}

// 检测是否为触摸设备
export function isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;

    return 'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0;
}

// 检测是否为低端设备（用于性能降级）
export function isLowEndDevice(): boolean {
    if (typeof navigator === 'undefined') return false;

    // 检测硬件并发数
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;

    // 检测设备内存（仅 Chrome 支持）
    const deviceMemory = (navigator as any).deviceMemory || 4;

    // 检测连接类型
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType || '4g';

    // 低端设备判定：CPU核心少、内存小、网络慢
    return hardwareConcurrency <= 2 ||
        deviceMemory <= 2 ||
        ['slow-2g', '2g'].includes(effectiveType);
}

// 获取完整设备信息
export function getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
        return {
            type: 'desktop',
            browser: 'unknown',
            os: 'unknown',
            isMobile: false,
            isTablet: false,
            isDesktop: true,
            isTouchDevice: false,
            isLowEndDevice: false,
            screenWidth: 1920,
            screenHeight: 1080,
            pixelRatio: 1,
            orientation: 'landscape',
        };
    }

    const type = getDeviceType();

    return {
        type,
        browser: getBrowserType(),
        os: getOSType(),
        isMobile: type === 'mobile',
        isTablet: type === 'tablet',
        isDesktop: type === 'desktop',
        isTouchDevice: isTouchDevice(),
        isLowEndDevice: isLowEndDevice(),
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    };
}

// 响应式值选择器
export function responsive<T>(options: {
    mobile?: T;
    tablet?: T;
    desktop: T;
}): T {
    const deviceType = getDeviceType();

    if (deviceType === 'mobile' && options.mobile !== undefined) {
        return options.mobile;
    }
    if (deviceType === 'tablet' && options.tablet !== undefined) {
        return options.tablet;
    }
    return options.desktop;
}

// 性能级别
export type PerformanceLevel = 'low' | 'medium' | 'high';

// 获取性能级别（用于决定特效等级）
export function getPerformanceLevel(): PerformanceLevel {
    if (typeof navigator === 'undefined') return 'high';

    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType || '4g';

    // 高性能设备
    if (hardwareConcurrency >= 8 && deviceMemory >= 8) {
        return 'high';
    }

    // 低性能设备
    if (hardwareConcurrency <= 2 || deviceMemory <= 2 || ['slow-2g', '2g'].includes(effectiveType)) {
        return 'low';
    }

    return 'medium';
}

// 根据性能级别获取配置
export function getPerformanceConfig() {
    const level = getPerformanceLevel();

    return {
        level,
        // 粒子数量
        particleCount: level === 'high' ? 15 : level === 'medium' ? 8 : 3,
        // 是否启用毛玻璃效果
        enableBlur: level !== 'low',
        // 是否启用复杂动画
        enableComplexAnimations: level !== 'low',
        // 动画持续时间倍数
        animationDurationMultiplier: level === 'high' ? 1 : level === 'medium' ? 0.8 : 0.5,
        // 是否启用阴影
        enableShadows: level !== 'low',
        // 图片质量
        imageQuality: level === 'high' ? 90 : level === 'medium' ? 75 : 60,
        // 是否启用视差效果
        enableParallax: level === 'high',
        // 最大并发动画数
        maxConcurrentAnimations: level === 'high' ? 10 : level === 'medium' ? 5 : 2,
    };
}

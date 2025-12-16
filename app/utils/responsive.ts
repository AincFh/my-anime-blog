import { useState, useEffect, useCallback } from 'react';
import {
    getDeviceInfo,
    getPerformanceLevel,
    getPerformanceConfig,
    getDeviceType,
    BREAKPOINTS,
    type DeviceInfo,
    type DeviceType,
    type PerformanceLevel
} from './device';

/**
 * 响应式断点 Hook
 * 实时监听窗口大小变化
 */
export function useBreakpoint() {
    const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg');

    useEffect(() => {
        const updateBreakpoint = () => {
            const width = window.innerWidth;

            if (width < BREAKPOINTS.sm) setBreakpoint('sm');
            else if (width < BREAKPOINTS.md) setBreakpoint('md');
            else if (width < BREAKPOINTS.lg) setBreakpoint('lg');
            else if (width < BREAKPOINTS.xl) setBreakpoint('xl');
            else setBreakpoint('2xl');
        };

        updateBreakpoint();
        window.addEventListener('resize', updateBreakpoint);
        return () => window.removeEventListener('resize', updateBreakpoint);
    }, []);

    return breakpoint;
}

/**
 * 设备类型 Hook
 */
export function useDeviceType(): DeviceType {
    const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

    useEffect(() => {
        const updateDeviceType = () => {
            setDeviceType(getDeviceType());
        };

        updateDeviceType();
        window.addEventListener('resize', updateDeviceType);
        return () => window.removeEventListener('resize', updateDeviceType);
    }, []);

    return deviceType;
}

/**
 * 完整设备信息 Hook
 */
export function useDeviceInfo(): DeviceInfo {
    const [info, setInfo] = useState<DeviceInfo>(() => getDeviceInfo());

    useEffect(() => {
        const updateInfo = () => {
            setInfo(getDeviceInfo());
        };

        updateInfo();
        window.addEventListener('resize', updateInfo);
        window.addEventListener('orientationchange', updateInfo);

        return () => {
            window.removeEventListener('resize', updateInfo);
            window.removeEventListener('orientationchange', updateInfo);
        };
    }, []);

    return info;
}

/**
 * 性能配置 Hook
 * 根据设备能力自动调整性能设置
 */
export function usePerformanceConfig() {
    const [config, setConfig] = useState(() => getPerformanceConfig());

    useEffect(() => {
        setConfig(getPerformanceConfig());
    }, []);

    return config;
}

/**
 * 媒体查询 Hook
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    return matches;
}

// 预定义的媒体查询 Hooks
export function useIsMobile(): boolean {
    return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
}

export function useIsTablet(): boolean {
    return useMediaQuery(`(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`);
}

export function useIsDesktop(): boolean {
    return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
}

export function useIsTouchDevice(): boolean {
    const [isTouch, setIsTouch] = useState(false);

    useEffect(() => {
        setIsTouch(
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0
        );
    }, []);

    return isTouch;
}

export function usePrefersDarkMode(): boolean {
    return useMediaQuery('(prefers-color-scheme: dark)');
}

export function usePrefersReducedMotion(): boolean {
    return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * 响应式值 Hook
 * 根据设备类型返回不同的值
 */
export function useResponsiveValue<T>(options: {
    mobile?: T;
    tablet?: T;
    desktop: T;
}): T {
    const deviceType = useDeviceType();

    if (deviceType === 'mobile' && options.mobile !== undefined) {
        return options.mobile;
    }
    if (deviceType === 'tablet' && options.tablet !== undefined) {
        return options.tablet;
    }
    return options.desktop;
}

/**
 * 窗口尺寸 Hook
 */
export function useWindowSize() {
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateSize = () => {
            setSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    return size;
}

/**
 * 滚动位置 Hook
 */
export function useScrollPosition() {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return scrollY;
}

/**
 * 可见性检测 Hook (用于懒加载)
 */
export function useIntersectionObserver(
    ref: React.RefObject<Element>,
    options: IntersectionObserverInit = {}
) {
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, {
            threshold: 0.1,
            ...options,
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, [ref, options.threshold, options.root, options.rootMargin]);

    return isIntersecting;
}

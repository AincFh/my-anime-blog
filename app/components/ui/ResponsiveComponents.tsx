import React, { memo, lazy, Suspense, type ComponentType } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { useDeviceType, usePerformanceConfig, usePrefersReducedMotion } from '~/utils/responsive';

interface ResponsiveContainerProps {
    children: React.ReactNode;
    className?: string;
    // 不同设备的内边距
    padding?: {
        mobile?: string;
        tablet?: string;
        desktop?: string;
    };
    // 最大宽度
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
};

/**
 * 响应式容器组件
 * 自动适配不同设备的布局
 */
export const ResponsiveContainer = memo(function ResponsiveContainer({
    children,
    className = '',
    padding = { mobile: 'px-4', tablet: 'px-6', desktop: 'px-8' },
    maxWidth = 'xl',
}: ResponsiveContainerProps) {
    const deviceType = useDeviceType();
    const paddingClass = padding[deviceType] || padding.desktop;

    return (
        <div className={`mx-auto w-full ${maxWidthClasses[maxWidth]} ${paddingClass} ${className}`}>
            {children}
        </div>
    );
});

interface ResponsiveGridProps {
    children: React.ReactNode;
    className?: string;
    cols?: {
        mobile?: number;
        tablet?: number;
        desktop?: number;
    };
    gap?: string;
}

/**
 * 响应式网格组件
 */
export const ResponsiveGrid = memo(function ResponsiveGrid({
    children,
    className = '',
    cols = { mobile: 1, tablet: 2, desktop: 3 },
    gap = 'gap-4 md:gap-6',
}: ResponsiveGridProps) {
    const colClasses = `grid-cols-${cols.mobile || 1} md:grid-cols-${cols.tablet || 2} lg:grid-cols-${cols.desktop || 3}`;

    return (
        <div className={`grid ${colClasses} ${gap} ${className}`}>
            {children}
        </div>
    );
});

interface PerformanceAwareAnimationProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    // 低性能设备的降级动画
    lowPerformanceFallback?: HTMLMotionProps<"div">;
}

/**
 * 性能感知动画组件
 * 根据设备性能自动调整动画复杂度
 */
export const PerformanceAwareAnimation = memo(function PerformanceAwareAnimation({
    children,
    className,
    lowPerformanceFallback,
    ...motionProps
}: PerformanceAwareAnimationProps) {
    const config = usePerformanceConfig();
    const prefersReducedMotion = usePrefersReducedMotion();

    // 如果用户偏好减少动画，或者是低端设备
    if (prefersReducedMotion || config.level === 'low') {
        if (lowPerformanceFallback) {
            return (
                <motion.div className={className} {...lowPerformanceFallback}>
                    {children}
                </motion.div>
            );
        }
        // 无动画降级
        return <div className={className}>{children}</div>;
    }

    // 中等性能设备，减少动画复杂度
    if (config.level === 'medium') {
        const simplifiedProps = {
            ...motionProps,
            transition: {
                ...(motionProps.transition || {}),
                duration: ((motionProps.transition as any)?.duration || 0.3) * 0.7,
            },
        };
        return (
            <motion.div className={className} {...simplifiedProps}>
                {children}
            </motion.div>
        );
    }

    // 高性能设备，完整动画
    return (
        <motion.div className={className} {...motionProps}>
            {children}
        </motion.div>
    );
});

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    placeholder?: string;
    // 根据设备调整图片质量
    quality?: {
        mobile?: number;
        desktop?: number;
    };
}

/**
 * 懒加载图片组件
 * 支持模糊占位符和渐进式加载
 */
export const LazyImage = memo(function LazyImage({
    src,
    alt,
    className = '',
    placeholder,
    quality = { mobile: 60, desktop: 85 },
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [isInView, setIsInView] = React.useState(false);
    const imgRef = React.useRef<HTMLImageElement>(null);
    const config = usePerformanceConfig();

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '50px', threshold: 0.1 }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
            {/* 占位符 */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
            )}

            {/* 实际图片 */}
            {isInView && (
                <img
                    src={src}
                    alt={alt}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setIsLoaded(true)}
                />
            )}
        </div>
    );
});

interface ConditionalRenderProps {
    children: React.ReactNode;
    mobile?: boolean;
    tablet?: boolean;
    desktop?: boolean;
    fallback?: React.ReactNode;
}

/**
 * 条件渲染组件
 * 根据设备类型决定是否渲染
 */
export const ConditionalRender = memo(function ConditionalRender({
    children,
    mobile = true,
    tablet = true,
    desktop = true,
    fallback = null,
}: ConditionalRenderProps) {
    const deviceType = useDeviceType();

    const shouldRender =
        (deviceType === 'mobile' && mobile) ||
        (deviceType === 'tablet' && tablet) ||
        (deviceType === 'desktop' && desktop);

    return <>{shouldRender ? children : fallback}</>;
});

/**
 * 仅移动端显示
 */
export const MobileOnly = memo(function MobileOnly({ children }: { children: React.ReactNode }) {
    return <ConditionalRender mobile tablet={false} desktop={false}>{children}</ConditionalRender>;
});

/**
 * 仅桌面端显示
 */
export const DesktopOnly = memo(function DesktopOnly({ children }: { children: React.ReactNode }) {
    return <ConditionalRender mobile={false} tablet={false} desktop>{children}</ConditionalRender>;
});

/**
 * 隐藏移动端
 */
export const HiddenOnMobile = memo(function HiddenOnMobile({ children }: { children: React.ReactNode }) {
    return <ConditionalRender mobile={false} tablet desktop>{children}</ConditionalRender>;
});

interface LazyComponentProps<T extends ComponentType<any>> {
    component: () => Promise<{ default: T }>;
    fallback?: React.ReactNode;
    props?: React.ComponentProps<T>;
}

/**
 * 懒加载组件包装器
 */
export function LazyComponent<T extends ComponentType<any>>({
    component,
    fallback = <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-32" />,
    props,
}: LazyComponentProps<T>) {
    const LazyComp = React.useMemo(() => lazy(component), [component]);

    return (
        <Suspense fallback={fallback}>
            <LazyComp {...(props as any)} />
        </Suspense>
    );
}

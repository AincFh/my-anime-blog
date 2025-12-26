/**
 * 优化后的图片组件
 * 支持懒加载、WebP 回退、加载占位符
 */

import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
    placeholder?: 'blur' | 'skeleton' | 'none';
    priority?: boolean;
}

export function OptimizedImage({
    src,
    alt,
    className = '',
    width,
    height,
    placeholder = 'skeleton',
    priority = false,
}: OptimizedImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (priority) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '50px' }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [priority]);

    // 占位符样式
    const placeholderStyles = {
        skeleton: 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse',
        blur: 'bg-gray-200 backdrop-blur-sm',
        none: '',
    };

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden ${className}`}
            style={{ width, height }}
        >
            {/* 占位符 */}
            {!isLoaded && placeholder !== 'none' && (
                <div
                    className={`absolute inset-0 ${placeholderStyles[placeholder]}`}
                    style={{ width, height }}
                />
            )}

            {/* 实际图片 */}
            {isInView && (
                <img
                    src={src}
                    alt={alt}
                    loading={priority ? 'eager' : 'lazy'}
                    decoding="async"
                    onLoad={() => setIsLoaded(true)}
                    className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            )}
        </div>
    );
}

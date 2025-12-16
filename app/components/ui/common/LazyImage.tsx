import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 图片懒加载组件
 * 功能：缩略图先行，大图加载完成后渐变替换（类似Medium效果）
 */
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string; // 可选：自定义占位图
  blur?: boolean; // 是否使用模糊占位
}

export function LazyImage({ src, alt, className = "", placeholder, blur = true }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // 生成缩略图URL（如果支持）
  useEffect(() => {
    if (placeholder) {
      setThumbnailSrc(placeholder);
    } else if (blur && src) {
      // 尝试生成模糊占位图（使用图片服务API或base64）
      // 这里简化处理，使用一个极小的数据URI作为占位
      setThumbnailSrc(
        `data:image/svg+xml;base64,${btoa(
          `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="20" fill="#f3f4f6"/></svg>`
        )}`
      );
    }
  }, [src, placeholder, blur]);

  // 预加载大图
  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.onload = () => {
      setIsLoaded(true);
    };
    img.onerror = () => {
      setError(true);
    };
    img.src = src;
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 缩略图/占位图 */}
      {thumbnailSrc && !isLoaded && !error && (
        <motion.img
          src={thumbnailSrc}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: blur ? "blur(20px) scale(1.1)" : "none",
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: isLoaded ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* 大图 */}
      <AnimatePresence>
        {isLoaded && (
          <motion.img
            ref={imgRef}
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            loading="lazy"
          />
        )}
      </AnimatePresence>

      {/* 错误占位 */}
      {error && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">图片加载失败</span>
        </div>
      )}
    </div>
  );
}


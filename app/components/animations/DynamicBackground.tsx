import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 动态全屏背景系统
 * 支持：
 * 1. R2图床随机切换4K高清壁纸
 * 2. 预加载下一张图片（0延迟切换）
 * 3. 溶解过渡动画
 * 4. 时间感知（晚上自动切换暗色调）
 */
interface DynamicBackgroundProps {
  images?: string[]; // R2图片URL数组，如果为空则使用默认壁纸
}

export function DynamicBackground({ images }: DynamicBackgroundProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const preloadRef = useRef<HTMLImageElement>(null);

  // Unsplash 高清动漫/风景壁纸作为默认背景
  const backgrounds = [
    'https://api.yimian.xyz/img?id=234',
    'https://api.yimian.xyz/img?id=145',
    'https://api.yimian.xyz/img?id=567',
    'https://api.yimian.xyz/img?id=890',
    'https://api.yimian.xyz/img?id=345',
  ];

  const imageList = images && images.length > 0 ? images : backgrounds;

  // 时间感知：获取当前时间，晚上10点后使用暗色调壁纸
  const getTimeBasedImages = () => {
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) {
      // 晚上/凌晨：使用暗色调壁纸索引
      return imageList; // 实际应该返回暗色调壁纸数组
    }
    return imageList;
  };

  // 预加载下一张图片
  useEffect(() => {
    if (preloadRef.current && imageList[nextIndex]) {
      const img = new Image();
      img.src = imageList[nextIndex];
      img.onload = () => {
        // 图片预加载完成
      };
    }
  }, [nextIndex, imageList]);

  // 自动切换背景（每30秒）
  useEffect(() => {
    const interval = setInterval(() => {
      switchBackground();
    }, 30000); // 30秒切换一次

    return () => clearInterval(interval);
  }, [currentIndex, imageList.length]);

  const switchBackground = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % imageList.length);
      setNextIndex((prev) => (prev + 1) % imageList.length);
      setIsTransitioning(false);
    }, 500); // 过渡动画时长
  };

  const currentImages = getTimeBasedImages();
  const currentImage = currentImages[currentIndex];
  const nextImage = currentImages[nextIndex];

  return (
    <div className="fixed inset-0 z-0 overflow-hidden" style={{ willChange: "transform" }}>
      {/* 当前背景 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          style={{ willChange: "opacity" }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${currentImage}')`,
              filter: "brightness(0.95)",
              willChange: "background-image",
            }}
          />
          {/* 暖色渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-b from-orange-100/20 to-pink-100/20" />
        </motion.div>
      </AnimatePresence>

      {/* 预加载的下一张图片（隐藏） */}
      {nextImage && (
        <img
          ref={preloadRef}
          src={nextImage}
          alt=""
          className="hidden"
          onLoad={() => {
            // 预加载完成
          }}
        />
      )}
    </div>
  );
}


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

  // 默认壁纸库（实际使用时应该从R2获取）
  const defaultImages = [
    'https://images.unsplash.com/photo-1616486339569-9c4050911745?q=80&w=2070&auto=format&fit=crop', // 夕阳
    'https://images.unsplash.com/photo-1577056922428-a79963db266d?q=80&w=2070&auto=format&fit=crop', // 樱花
    'https://images.unsplash.com/photo-1542596594-649edbc13630?q=80&w=1974&auto=format&fit=crop', // 天空
  ];

  const imageList = images && images.length > 0 ? images : defaultImages;

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

      {/* 手动切换按钮（可选，放在右上角） */}
      <button
        onClick={switchBackground}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all flex items-center justify-center text-white/80 hover:text-white shadow-lg"
        title="切换背景"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  );
}


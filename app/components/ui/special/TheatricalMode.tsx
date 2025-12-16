import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 智能影院模式
 * 功能：当滚动到视频播放器或宽幅大图时，背景自动变暗，导航栏自动收起
 */
export function TheatricalMode() {
  const [isActive, setIsActive] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // 创建 Intersection Observer 来检测视频和大图
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            setIsActive(true);
          } else {
            setIsActive(false);
          }
        });
      },
      {
        threshold: [0.3, 0.5, 0.7],
        rootMargin: "-100px",
      }
    );

    // 观察所有视频和宽幅大图
    const videos = document.querySelectorAll("video, iframe[src*='bilibili'], iframe[src*='youtube']");
    const wideImages = document.querySelectorAll("img[class*='wide'], img[class*='full'], .prose img");

    videos.forEach((el) => observerRef.current?.observe(el));
    wideImages.forEach((el) => {
      // 只观察宽高比大于2:1的图片
      const img = el as HTMLImageElement;
      if (img.naturalWidth && img.naturalHeight) {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        if (aspectRatio > 2) {
          observerRef.current?.observe(el);
        }
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* 背景变暗遮罩 */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-30 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* 隐藏导航栏的提示（可选） */}
          <motion.div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-black/50 text-white px-4 py-2 rounded-full text-xs pointer-events-none"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            🎬 影院模式
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


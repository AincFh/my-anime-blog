import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * 滚动条进度具象化
 * 功能：滚动条滑块是Q版角色头像，滚动时小人会滑动
 */
export function CustomScrollbar() {
  const { scrollYProgress } = useScroll();
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateScrollPosition = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const maxScroll = documentHeight - windowHeight;
      const position = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
      setScrollPosition(position);
    };

    window.addEventListener("scroll", updateScrollPosition);
    updateScrollPosition();

    return () => window.removeEventListener("scroll", updateScrollPosition);
  }, []);

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden lg:block">
      <div className="relative w-2 h-64 bg-white/10 backdrop-blur-sm rounded-full">
        {/* 滚动条轨道 */}
        <div className="absolute inset-0 rounded-full" />
        
        {/* Q版角色头像滑块 */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold"
          style={{
            top: `${scrollPosition}%`,
            y: "-50%",
          }}
          animate={{
            rotate: scrollPosition > 0 && scrollPosition < 100 ? [0, 5, -5, 0] : 0,
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          ✨
        </motion.div>
      </div>
    </div>
  );
}


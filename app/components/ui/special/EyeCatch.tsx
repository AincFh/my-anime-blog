import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";

/**
 * 动漫式过场动画 (Eye-Catch)
 * 功能：页面切换时的转场遮罩，模仿动漫每集播放到一半时的过场
 */
export function EyeCatch() {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);

  useEffect(() => {
    // 检测是否切换了大模块（从首页到番剧库等）
    const isMajorTransition = 
      prevPath !== location.pathname &&
      (prevPath === "/" || location.pathname === "/" ||
       prevPath.startsWith("/articles") !== location.pathname.startsWith("/articles") ||
       prevPath.startsWith("/bangumi") !== location.pathname.startsWith("/bangumi"));

    if (isMajorTransition) {
      setIsTransitioning(true);
      setPrevPath(location.pathname);

      // 0.4秒后结束转场
      setTimeout(() => {
        setIsTransitioning(false);
      }, 400);
    }
  }, [location.pathname, prevPath]);

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* 倾斜的转场遮罩 */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500"
            initial={{ x: "-100%", rotate: -15 }}
            animate={{ x: "100%", rotate: -15 }}
            exit={{ x: "200%" }}
            transition={{
              duration: 0.4,
              ease: "easeInOut",
            }}
            style={{
              clipPath: "polygon(0 0, 100% 0, 120% 100%, -20% 100%)",
            }}
          >
            {/* Logo或文字（可选） */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="text-white text-4xl font-bold"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                ✨
              </motion.div>
            </div>
          </motion.div>

          {/* 可选：跑过的黑猫剪影 */}
          <motion.div
            className="absolute top-1/2 left-0 -translate-y-1/2 text-6xl"
            initial={{ x: "-200px", opacity: 0 }}
            animate={{ x: "calc(100% + 200px)", opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.4,
              ease: "easeInOut",
            }}
          >
            🐱
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


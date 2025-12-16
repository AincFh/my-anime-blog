import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
// import CountUp from "react-countup"; // TODO: 安装 react-countup

/**
 * 经验条与成长反馈 (Liquid Progress)
 * 功能：液体流动、注入动画、升级爆发
 */
interface LiquidProgressProps {
  currentExp: number;
  maxExp: number;
  level: number;
  onLevelUp?: () => void;
}

export function LiquidProgress({ currentExp, maxExp, level, onLevelUp }: LiquidProgressProps) {
  const [prevExp, setPrevExp] = useState(currentExp);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  const progress = Math.min((currentExp / maxExp) * 100, 100);
  const progressValue = useMotionValue(prevExp);
  const springProgress = useSpring(progressValue, {
    stiffness: 100,
    damping: 20,
  });

  useEffect(() => {
    // 注入动画
    if (currentExp > prevExp) {
      setShowSplash(true);
      progressValue.set(currentExp);
      
      // 检查是否升级
      if (currentExp >= maxExp) {
        setIsLevelingUp(true);
        if (onLevelUp) {
          setTimeout(() => onLevelUp(), 500);
        }
      }

      setTimeout(() => {
        setShowSplash(false);
        setPrevExp(currentExp);
      }, 1000);
    }
  }, [currentExp, prevExp, maxExp, progressValue, onLevelUp]);

  // 液体波动动画
  const waveOffset = useTransform(springProgress, [0, 100], [0, 360]);

  return (
    <div className="relative w-full">
      {/* 升级爆发效果 */}
      <AnimatePresence>
        {isLevelingUp && (
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="text-6xl font-bold text-yellow-400 drop-shadow-2xl"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: 2,
              }}
            >
              LEVEL UP!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 经验条容器 */}
      <div className="relative w-full h-24 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-white/10 overflow-hidden">
        {/* 液体容器 */}
        <div className="relative w-full h-full rounded-xl overflow-hidden">
          {/* 液体 */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 via-cyan-400 to-sky-300"
            style={{
              height: useTransform(springProgress, [0, maxExp], ["0%", "100%"]),
            }}
          >
            {/* 液体波动效果 */}
            <motion.svg
              className="absolute bottom-0 left-0 w-full"
              viewBox="0 0 200 50"
              preserveAspectRatio="none"
              style={{
                height: "20px",
              }}
            >
              <motion.path
                d="M0,25 Q50,15 100,25 T200,25 L200,50 L0,50 Z"
                fill="rgba(255,255,255,0.3)"
                style={{
                  x: waveOffset,
                }}
                animate={{
                  d: [
                    "M0,25 Q50,15 100,25 T200,25 L200,50 L0,50 Z",
                    "M0,25 Q50,35 100,25 T200,25 L200,50 L0,50 Z",
                    "M0,25 Q50,15 100,25 T200,25 L200,50 L0,50 Z",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.svg>

            {/* 水花效果 */}
            {showSplash && (
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2, opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-4 h-4 bg-white rounded-full" />
              </motion.div>
            )}
          </motion.div>

          {/* 进度文字 */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-white font-bold text-lg drop-shadow-lg">
              {currentExp.toLocaleString()} / {maxExp.toLocaleString()} EXP
            </div>
          </div>
        </div>
      </div>

      {/* 等级显示 */}
      <div className="mt-2 text-center">
        <span className="text-white/60 text-sm">Level </span>
        <span className="text-white font-bold text-xl">{level}</span>
      </div>
    </div>
  );
}


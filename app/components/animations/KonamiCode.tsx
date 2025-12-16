import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Konami Code 监听器
 * 功能：上上下下左右左右BA 触发"Limit Break"界限突破模式
 */
export function KonamiCode() {
  const [isLimitBreak, setIsLimitBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const konamiCode = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "KeyB",
      "KeyA",
    ];

    let sequence: string[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      sequence.push(e.code);
      
      // 保持序列长度不超过Konami Code长度
      if (sequence.length > konamiCode.length) {
        sequence = sequence.slice(-konamiCode.length);
      }

      // 检查是否匹配
      if (sequence.length === konamiCode.length) {
        const isMatch = sequence.every((key, index) => key === konamiCode[index]);
        
        if (isMatch) {
          setIsLimitBreak(true);
          setTimeLeft(60);
          sequence = [];

          // 应用Limit Break样式
          document.documentElement.classList.add("limit-break");
          
          // 60秒后恢复
          const timer = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                setIsLimitBreak(false);
                document.documentElement.classList.remove("limit-break");
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <AnimatePresence>
      {isLimitBreak && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[200] bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 h-1"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          exit={{ scaleX: 0 }}
        >
          <motion.div
            className="absolute top-0 right-0 bg-black/50 text-white px-4 py-2 text-sm font-bold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            系统过载模式: {timeLeft}s
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


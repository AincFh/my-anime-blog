import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

/**
 * 摸头杀点赞系统
 * 功能：把普通的"点赞"改成"摸头"，二次元浓度爆表
 */
interface HeadpatButtonProps {
  count: number;
  onPat?: () => void;
  disabled?: boolean;
}

export function HeadpatButton({ count, onPat, disabled = false }: HeadpatButtonProps) {
  const [isPatting, setIsPatting] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [patCount, setPatCount] = useState(count);
  const [comboCount, setComboCount] = useState(0);
  const [lastPatTime, setLastPatTime] = useState(0);

  const handleClick = () => {
    if (disabled || isPatting) return;

    const now = Date.now();
    const timeSinceLastPat = now - lastPatTime;
    
    // 连击检测：如果2秒内再次点击，算作连击
    if (timeSinceLastPat < 2000) {
      setComboCount((prev) => {
        const newCombo = prev + 1;
        
        // 连击超过50次，解锁成就
        if (newCombo >= 50 && (window as any).unlockAchievement) {
          (window as any).unlockAchievement("combo_master");
        }
        
        return newCombo;
      });
    } else {
      setComboCount(1);
    }
    
    setLastPatTime(now);
    setIsPatting(true);
    setPatCount((prev) => prev + 1);
    setShowHearts(true);
    
    if (onPat) {
      onPat();
    }

    // 动画完成后重置
    setTimeout(() => {
      setIsPatting(false);
      setShowHearts(false);
    }, 800);
  };

  return (
    <div className="relative inline-block">
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        disabled={disabled || isPatting}
        className="relative px-6 py-3 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full border-2 border-pink-300 hover:border-pink-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ cursor: isHovering ? "url('data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\'><path d=\'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z\' fill=\'%23ff6b9d\'/></svg>'), auto" : "pointer" }}
      >
        <div className="flex items-center gap-3">
          {/* Q版角色头像 */}
          <motion.div
            className="relative"
            animate={{
              scale: isPatting ? [1, 1.2, 1] : 1,
              rotate: isPatting ? [0, 5, -5, 0] : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-2xl">
              {isPatting ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  (///▽///)
                </motion.span>
              ) : (
                <span>✨</span>
              )}
            </div>
            {/* 抚摸时的光晕 */}
            {isPatting && (
              <motion.div
                className="absolute inset-0 rounded-full bg-pink-400/50"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </motion.div>

          {/* 文案 */}
          <div className="text-left">
            <div className="text-sm font-bold text-pink-600">
              {isPatting ? "被摸头中..." : "摸头"}
            </div>
            <div className="text-xs text-gray-500 font-mono">
              已被摸头 {patCount.toLocaleString()} 次
            </div>
          </div>
        </div>
      </motion.button>

      {/* 爱心气泡动画 */}
      <AnimatePresence>
        {showHearts && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
                initial={{ opacity: 0, y: 0, x: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: -30 - i * 10,
                  x: (i - 1) * 20,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1,
                  delay: i * 0.1,
                }}
              >
                <span className="text-2xl">💖</span>
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


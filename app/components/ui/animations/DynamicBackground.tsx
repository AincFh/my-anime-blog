import { motion } from "framer-motion";

/**
 * 动态全屏背景系统
 * 响应 dark/light 主题切换，使用 CSS 变量实现平滑过渡
 */
export function DynamicBackground() {
  return (
    <div className="fixed inset-0 -z-0 overflow-hidden">
      {/* 主背景 — CSS 变量定义，深浅模式各自配色 */}
      <div
        className="absolute inset-0"
        style={{
          background: 'var(--dynamic-bg-gradient)',
          transition: 'background 0.5s ease',
        }}
      />

      {/* 动态光晕效果 — 跟随主题色变量 */}
      <motion.div
        className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, var(--dynamic-orb-1) 0%, transparent 70%)',
          opacity: 0.3,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute -bottom-1/4 -left-1/4 w-2/3 h-2/3 rounded-full"
        style={{
          background: 'radial-gradient(circle, var(--dynamic-orb-2) 0%, transparent 70%)',
          opacity: 0.25,
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      <motion.div
        className="absolute top-1/3 left-1/2 w-1/3 h-1/3 rounded-full"
        style={{
          background: 'radial-gradient(circle, var(--dynamic-orb-3) 0%, transparent 70%)',
          opacity: 0.2,
        }}
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4,
        }}
      />

      {/* 柔和的渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 dark:to-black/40" />
    </div>
  );
}

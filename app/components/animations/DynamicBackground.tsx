import { motion } from 'framer-motion';

/**
 * 动态全屏背景系统 - 性能优化版
 * 使用纯 CSS 渐变和动画，避免外部 API 调用
 */
interface DynamicBackgroundProps {
  images?: string[]; // 可选的自定义图片
}

export function DynamicBackground({ images }: DynamicBackgroundProps) {
  // 如果提供了自定义图片，使用第一张作为背景
  const backgroundImage = images?.[0];

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* 主背景 - 使用渐变而非外部图片 */}
      <div
        className="absolute inset-0"
        style={{
          background: backgroundImage
            ? `url('${backgroundImage}') center/cover`
            : 'linear-gradient(135deg, #fef3e2 0%, #fce7f3 25%, #f0f9ff 50%, #f5f3ff 75%, #fff7ed 100%)',
        }}
      />

      {/* 动态光晕效果 */}
      <motion.div
        className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(255,159,67,0.4) 0%, transparent 70%)',
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
        className="absolute -bottom-1/4 -left-1/4 w-2/3 h-2/3 rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)',
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
        className="absolute top-1/3 left-1/2 w-1/3 h-1/3 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)',
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
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/20" />
    </div>
  );
}


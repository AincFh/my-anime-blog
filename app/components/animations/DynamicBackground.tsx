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

      {/* 动态光晕效果 - 移除浮动圆圈以避免转场时的视觉干扰 */}


      {/* 柔和的渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/20" />
    </div>
  );
}


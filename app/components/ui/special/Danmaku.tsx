import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * 弹幕组件
 * 功能：
 * 1. 从右到左飘过屏幕
 * 2. 支持随机像素头像
 * 3. 可配置速度和颜色
 */
interface DanmakuProps {
  content: string;
  author: string;
  avatarStyle?: string;
  speed?: number; // 像素/秒
  color?: string;
  top?: number; // 距离顶部的百分比 (0-100)
  onComplete?: () => void;
}

export function Danmaku({ 
  content, 
  author, 
  avatarStyle,
  speed = 100,
  color = '#FF9F43',
  top = 50,
  onComplete 
}: DanmakuProps) {
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    const container = containerRef.current;
    const containerWidth = window.innerWidth;
    const duration = (containerWidth + container.offsetWidth) / speed;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [speed, onComplete]);

  // 生成随机像素头像
  const generatePixelAvatar = (seed: string) => {
    // 简单的像素风格头像生成（基于seed）
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const avatarColor = avatarStyle || generatePixelAvatar(author);

  if (!isVisible) return null;

  return (
    <motion.div
      ref={containerRef}
      className="fixed pointer-events-none z-40"
      style={{
        top: `${top}%`,
        left: '100%',
      }}
      initial={{ x: 0 }}
      animate={{ x: typeof window !== 'undefined' ? -window.innerWidth - 500 : -1920 - 500 }}
      transition={{
        duration: typeof window !== 'undefined' ? (window.innerWidth + 500) / speed : 10,
        ease: 'linear',
      }}
    >
      <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
        {/* 像素头像 */}
        <div
          className="w-6 h-6 rounded-full flex-shrink-0"
          style={{ backgroundColor: avatarColor }}
        />
        
        {/* 作者和内容 */}
        <span className="text-white text-sm whitespace-nowrap">
          <span className="font-bold" style={{ color }}>
            {author}:
          </span>
          <span className="ml-1">{content}</span>
        </span>
      </div>
    </motion.div>
  );
}

/**
 * 弹幕容器 - 管理多条弹幕
 */
interface DanmakuContainerProps {
  comments: Array<{
    id: number;
    author: string;
    content: string;
    avatar_style?: string;
  }>;
}

export function DanmakuContainer({ comments }: DanmakuContainerProps) {
  const [activeDanmakus, setActiveDanmakus] = useState<Array<{
    id: number;
    author: string;
    content: string;
    avatar_style?: string;
    top: number;
    speed: number;
  }>>([]);

  useEffect(() => {
    // 随机显示弹幕
    const interval = setInterval(() => {
      if (comments.length === 0) return;

      const randomComment = comments[Math.floor(Math.random() * comments.length)];
      const top = 20 + Math.random() * 60; // 20% - 80%
      const speed = 80 + Math.random() * 40; // 80-120 像素/秒

      setActiveDanmakus(prev => [
        ...prev,
        {
          ...randomComment,
          top,
          speed,
        },
      ]);
    }, 3000); // 每3秒一条

    return () => clearInterval(interval);
  }, [comments]);

  const handleComplete = (id: number) => {
    setActiveDanmakus(prev => prev.filter(d => d.id !== id));
  };

  return (
    <>
      {activeDanmakus.map((danmaku) => (
        <Danmaku
          key={danmaku.id}
          content={danmaku.content}
          author={danmaku.author}
          avatarStyle={danmaku.avatar_style}
          top={danmaku.top}
          speed={danmaku.speed}
          onComplete={() => handleComplete(danmaku.id)}
        />
      ))}
    </>
  );
}


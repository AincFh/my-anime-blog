import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ParticleProps {
  x: number;
  y: number;
  color: string;
  onComplete: () => void;
}

// 单个粒子组件
function Particle({ x, y, color, onComplete }: ParticleProps) {
  // 随机粒子类型：圆形、方形、三角形
  const particleType = Math.floor(Math.random() * 3);
  // 随机大小
  const size = 2 + Math.random() * 4;
  // 随机方向和距离
  const angle = Math.random() * Math.PI * 2;
  const distance = 40 + Math.random() * 60;
  // 随机速度
  const duration = 0.5 + Math.random() * 0.5;
  // 随机透明度
  const opacity = 0.7 + Math.random() * 0.3;
  
  // 不同的运动轨迹
  const trajectoryType = Math.floor(Math.random() * 3);
  let endX, endY;
  
  switch(trajectoryType) {
    case 0: // 直线
      endX = x + Math.cos(angle) * distance;
      endY = y + Math.sin(angle) * distance;
      break;
    case 1: // 抛物线（向上）
      endX = x + (Math.random() - 0.5) * distance;
      endY = y - Math.random() * distance;
      break;
    case 2: // 抛物线（向下）
      endX = x + (Math.random() - 0.5) * distance;
      endY = y + Math.random() * distance;
      break;
    default:
      endX = x + Math.cos(angle) * distance;
      endY = y + Math.sin(angle) * distance;
  }

  // 随机旋转角度
  const rotation = Math.random() * 360;

  // 根据粒子类型返回不同形状
  const getParticleShape = () => {
    switch(particleType) {
      case 0: // 圆形
        return (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            initial={{
              left: `${x}px`,
              top: `${y}px`,
              opacity: opacity,
              scale: 1,
              backgroundColor: color,
              rotate: 0,
            }}
            animate={{
              left: `${endX}px`,
              top: `${endY}px`,
              opacity: 0,
              scale: 0,
              rotate: rotation,
            }}
            transition={{
              duration: duration,
              ease: 'easeOut',
            }}
            onAnimationComplete={onComplete}
            style={{ width: size, height: size }}
          />
        );
      case 1: // 方形
        return (
          <motion.div
            className="absolute pointer-events-none"
            initial={{
              left: `${x}px`,
              top: `${y}px`,
              opacity: opacity,
              scale: 1,
              backgroundColor: color,
              rotate: 0,
            }}
            animate={{
              left: `${endX}px`,
              top: `${endY}px`,
              opacity: 0,
              scale: 0,
              rotate: rotation,
            }}
            transition={{
              duration: duration,
              ease: 'easeOut',
            }}
            onAnimationComplete={onComplete}
            style={{ width: size, height: size }}
          />
        );
      case 2: // 三角形
        return (
          <motion.div
            className="absolute pointer-events-none"
            initial={{
              left: `${x}px`,
              top: `${y}px`,
              opacity: opacity,
              scale: 1,
              rotate: 0,
            }}
            animate={{
              left: `${endX}px`,
              top: `${endY}px`,
              opacity: 0,
              scale: 0,
              rotate: rotation,
            }}
            transition={{
              duration: duration,
              ease: 'easeOut',
            }}
            onAnimationComplete={onComplete}
            style={{
              width: 0,
              height: 0,
              borderLeft: `${size/2}px solid transparent`,
              borderRight: `${size/2}px solid transparent`,
              borderBottom: `${size}px solid ${color}`,
            }}
          />
        );
      default:
        return null;
    }
  };

  return getParticleShape();
}

// 粒子效果容器组件
interface ParticleEffectProps {
  children: React.ReactNode;
  color?: string;
  particleCount?: number;
}

export function ParticleEffect({ 
  children, 
  color = '#ff6b6b', 
  particleCount = 20 
}: ParticleEffectProps) {
  const [particles, setParticles] = React.useState<Array<{ id: number; x: number; y: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理点击事件
  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 创建粒子
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
    }));

    setParticles(prev => [...prev, ...newParticles]);
  };

  // 移除粒子
  const removeParticle = (id: number) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div ref={containerRef} onClick={handleClick} className="relative inline-block">
      {children}
      {/* 粒子容器 */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(particle => (
          <Particle
            key={particle.id}
            x={particle.x}
            y={particle.y}
            color={color}
            onComplete={() => removeParticle(particle.id)}
          />
        ))}
      </div>
    </div>
  );
}

// 持续的金色光尘粒子效果 - 符合设计规格
interface DustParticleProps {
  id: number;
  initialX: number;
  initialY: number;
  onComplete: () => void;
}

function DustParticle({ id, initialX, initialY, onComplete }: DustParticleProps) {
  // 金色系颜色
  const colors = ['#FFD700', '#FFA500', '#FF9F43', '#FFB84D', '#FFC966'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  // 随机大小（更小，像灰尘）
  const size = 1 + Math.random() * 2;
  
  // 随机速度（缓慢向上漂浮）
  const duration = 15 + Math.random() * 20; // 15-35秒
  
  // 随机水平漂移
  const horizontalDrift = (Math.random() - 0.5) * 100;
  
  // 随机透明度
  const opacity = 0.3 + Math.random() * 0.4; // 0.3-0.7

  // 计算向上漂浮的距离（使用视口高度）
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1000;
  const floatDistance = viewportHeight + 200;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      initial={{
        x: initialX,
        y: initialY,
        opacity: opacity,
        scale: 1,
      }}
      animate={{
        x: initialX + horizontalDrift,
        y: initialY - floatDistance, // 向上漂浮到屏幕外
        opacity: [opacity, opacity * 0.8, 0],
        scale: [1, 1.2, 0.5],
      }}
      transition={{
        duration: duration,
        ease: 'linear',
        repeat: Infinity,
      }}
      onAnimationComplete={onComplete}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      }}
    />
  );
}

// 全局粒子效果管理器 - 持续的金色粒子向上漂浮
export function GlobalParticleEffect() {
  const [particles, setParticles] = React.useState<Array<{ id: number; x: number; y: number }>>([]);
  const [isClient, setIsClient] = React.useState(false);
  const particleIdRef = React.useRef(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 持续生成金色粒子
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    const createParticle = () => {
      const newParticle = {
        id: particleIdRef.current++,
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 50, // 从屏幕底部生成
      };
      
      setParticles(prev => {
        // 性能优化：减少粒子数量从30个到15个
        const maxParticles = 15;
        if (prev.length >= maxParticles) {
          return [...prev.slice(1), newParticle];
        }
        return [...prev, newParticle];
      });
    };

    // 性能优化：减少初始粒子数量
    for (let i = 0; i < 5; i++) {
      setTimeout(() => createParticle(), i * 1000);
    }

    // 性能优化：降低粒子生成频率
    const interval = setInterval(() => {
      createParticle();
    }, 4000); // 从2秒增加到4秒

    return () => clearInterval(interval);
  }, [isClient]);

  // 移除粒子（当粒子完全消失时）
  const removeParticle = (id: number) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[2] overflow-hidden">
      {particles.map(particle => (
        <DustParticle
          key={particle.id}
          id={particle.id}
          initialX={particle.x}
          initialY={particle.y}
          onComplete={() => removeParticle(particle.id)}
        />
      ))}
    </div>
  );
}
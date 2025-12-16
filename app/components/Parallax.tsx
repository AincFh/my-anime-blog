import { useEffect, useRef } from 'react';

interface ParallaxLayerProps {
  speed: number; // 滚动速率，-1到1之间，0表示固定，1表示跟随滚动
  className?: string;
  children: React.ReactNode;
  direction?: 'vertical' | 'horizontal' | 'both'; // 视差方向
  rotate?: number; // 滚动时的旋转角度系数
  scale?: number; // 滚动时的缩放系数
  throttle?: number; // 节流时间（毫秒）
}

// 节流函数
function throttle<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

export function ParallaxLayer({ 
  speed, 
  className, 
  children, 
  direction = 'vertical',
  rotate = 0,
  scale = 0,
  throttle: throttleTime = 16 
}: ParallaxLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (layerRef.current) {
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        
        // 计算位移
        let translateX = 0;
        let translateY = 0;
        let rotation = 0;
        let scaleValue = 1;
        
        if (direction === 'vertical' || direction === 'both') {
          translateY = scrollY * speed;
        }
        
        if (direction === 'horizontal' || direction === 'both') {
          translateX = scrollX * speed;
        }
        
        // 计算旋转角度
        if (rotate !== 0) {
          rotation = scrollY * rotate;
        }
        
        // 计算缩放比例
        if (scale !== 0) {
          scaleValue = 1 + (scrollY * scale * 0.001);
        }
        
        layerRef.current.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rotation}deg) scale(${scaleValue})`;
      }
    };

    // 应用节流
    const throttledScroll = throttle(handleScroll, throttleTime);
    
    window.addEventListener('scroll', throttledScroll);
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [speed, direction, rotate, scale, throttleTime]);

  return (
    <div 
      ref={layerRef} 
      className={`parallax-layer ${className || ''}`}
      style={{
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform', // 性能优化
        backfaceVisibility: 'hidden', // 性能优化
      }}
    >
      {children}
    </div>
  );
}

// 飘落的樱花瓣组件
interface CherryBlossomsProps {
  count?: number; // 同时显示的最大花瓣数
  color?: string; // 花瓣颜色
  sizeRange?: [number, number]; // 花瓣大小范围
  speedRange?: [number, number]; // 下落速度范围
  delayRange?: [number, number]; // 延迟范围
  swayRange?: [number, number]; // 左右摇摆幅度范围
  frequency?: number; // 生成频率（毫秒）
  shape?: 'circle' | 'petal' | 'triangle'; // 花瓣形状
}

export function CherryBlossoms({ 
  count = 30, 
  color = '#ffb6c1', 
  sizeRange = [8, 16], 
  speedRange = [5, 15], 
  delayRange = [0, 5], 
  swayRange = [50, 150], 
  frequency = 300,
  shape = 'petal'
}: CherryBlossomsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activePetalsRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // 创建花瓣元素
    const createPetal = () => {
      // 限制最大花瓣数
      if (activePetalsRef.current >= count) return;
      
      const petal = document.createElement('div');
      petal.className = 'absolute pointer-events-none';
      
      // 随机大小
      const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
      
      // 设置花瓣形状
      switch(shape) {
        case 'circle':
          petal.className += ' rounded-full';
          petal.style.width = `${size}px`;
          petal.style.height = `${size}px`;
          break;
        case 'triangle':
          petal.style.width = '0';
          petal.style.height = '0';
          petal.style.borderLeft = `${size/2}px solid transparent`;
          petal.style.borderRight = `${size/2}px solid transparent`;
          petal.style.borderBottom = `${size}px solid ${color}`;
          break;
        case 'petal':
        default:
          petal.style.width = `${size}px`;
          petal.style.height = `${size * 1.5}px`;
          petal.style.borderRadius = '50% 0 50% 0';
          break;
      }
      
      // 设置颜色
      if (shape !== 'triangle') {
        petal.style.backgroundColor = color;
      }
      
      // 随机位置和动画参数
      const startX = Math.random() * window.innerWidth;
      const duration = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
      const delay = delayRange[0] + Math.random() * (delayRange[1] - delayRange[0]);
      const startY = -size;
      const endY = window.innerHeight + size;
      const swayAmount = swayRange[0] + Math.random() * (swayRange[1] - swayRange[0]);
      const swayDirection = Math.random() > 0.5 ? 1 : -1;
      const rotation = Math.random() * 720; // 随机旋转角度
      
      // 设置初始位置
      petal.style.left = `${startX}px`;
      petal.style.top = `${startY}px`;
      petal.style.opacity = `${0.6 + Math.random() * 0.4}`;
      
      // 应用动画
      petal.style.animation = `fall-${shape} ${duration}s ease-in-out infinite ${delay}s`;
      
      // 添加CSS变量用于自定义动画
      petal.style.setProperty('--sway-amount', `${swayAmount}px`);
      petal.style.setProperty('--sway-direction', `${swayDirection}`);
      petal.style.setProperty('--rotation', `${rotation}deg`);
      petal.style.setProperty('--end-y', `${endY}px`);
      
      containerRef.current?.appendChild(petal);
      activePetalsRef.current++;
      
      // 动画结束后移除
      setTimeout(() => {
        petal.remove();
        activePetalsRef.current = Math.max(0, activePetalsRef.current - 1);
      }, (duration + delay) * 1000);
    };

    // 创建CSS动画
    const createAnimationStyle = () => {
      const style = document.createElement('style');
      
      // 通用飘落动画
      const baseAnimation = `
        @keyframes fall-circle {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.8;
          }
          25% {
            transform: translateY(calc(var(--end-y) * 0.25)) translateX(calc(var(--sway-amount) * var(--sway-direction) * 0.5)) rotate(calc(var(--rotation) * 0.25));
          }
          50% {
            transform: translateY(calc(var(--end-y) * 0.5)) translateX(calc(var(--sway-amount) * var(--sway-direction))) rotate(calc(var(--rotation) * 0.5));
          }
          75% {
            transform: translateY(calc(var(--end-y) * 0.75)) translateX(calc(var(--sway-amount) * var(--sway-direction) * 0.5)) rotate(calc(var(--rotation) * 0.75));
          }
          100% {
            transform: translateY(var(--end-y)) translateX(0) rotate(var(--rotation));
            opacity: 0;
          }
        }
        
        @keyframes fall-triangle {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.8;
          }
          100% {
            transform: translateY(var(--end-y)) translateX(calc(var(--sway-amount) * var(--sway-direction))) rotate(var(--rotation));
            opacity: 0;
          }
        }
        
        @keyframes fall-petal {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.8;
          }
          20% {
            transform: translateY(calc(var(--end-y) * 0.2)) translateX(calc(var(--sway-amount) * var(--sway-direction) * 0.3)) rotate(calc(var(--rotation) * 0.2));
          }
          40% {
            transform: translateY(calc(var(--end-y) * 0.4)) translateX(calc(var(--sway-amount) * var(--sway-direction) * 0.6)) rotate(calc(var(--rotation) * 0.4));
          }
          60% {
            transform: translateY(calc(var(--end-y) * 0.6)) translateX(calc(var(--sway-amount) * var(--sway-direction) * 0.3)) rotate(calc(var(--rotation) * 0.6));
          }
          80% {
            transform: translateY(calc(var(--end-y) * 0.8)) translateX(calc(var(--sway-amount) * var(--sway-direction) * 0.6)) rotate(calc(var(--rotation) * 0.8));
          }
          100% {
            transform: translateY(var(--end-y)) translateX(calc(var(--sway-amount) * var(--sway-direction))) rotate(var(--rotation));
            opacity: 0;
          }
        }
      `;
      
      style.textContent = baseAnimation;
      document.head.appendChild(style);
      return style;
    };

    // 初始化动画
    const style = createAnimationStyle();
    
    // 定时创建花瓣
    const interval = setInterval(createPetal, frequency);
    
    // 初始创建一些花瓣
    const initialCount = Math.min(count, 15);
    for (let i = 0; i < initialCount; i++) {
      setTimeout(createPetal, i * 100);
    }

    return () => {
      clearInterval(interval);
      style.remove();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        activePetalsRef.current = 0;
      }
    };
  }, [count, color, sizeRange, speedRange, delayRange, swayRange, frequency, shape]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-0"></div>
  );
}
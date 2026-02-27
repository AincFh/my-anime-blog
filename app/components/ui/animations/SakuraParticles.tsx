import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * 樱花粒子特效系统
 * 功能：
 * 1. 持续飘落的樱花瓣
 * 2. 鼠标移动时的星光拖尾
 * 3. 点击时的樱花爆裂效果
 */
interface SakuraParticle {
    id: number;
    x: number;
    y: number;
    rotation: number;
    speed: number;
    size: number;
    opacity: number;
}

export function SakuraParticles() {
    const [sakuraParticles, setSakuraParticles] = useState<SakuraParticle[]>([]);
    const [trailParticles, setTrailParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const sakuraIdRef = useRef(0);
    const trailIdRef = useRef(0);

    // 初始化樱花粒子 - 性能优化：减少粒子数量
    useEffect(() => {
        const initialParticles: SakuraParticle[] = [];
        // 减少初始粒子数量：从15个减少到5个
        for (let i = 0; i < 5; i++) {
            initialParticles.push({
                id: sakuraIdRef.current++,
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                y: -50 - Math.random() * 500,
                rotation: Math.random() * 360,
                speed: 0.5 + Math.random() * 1.5,
                size: 8 + Math.random() * 12,
                opacity: 0.4 + Math.random() * 0.4,
            });
        }
        setSakuraParticles(initialParticles);

        // 持续生成新樱花 - 降低频率和数量
        const interval = setInterval(() => {
            setSakuraParticles((prev) => {
                // 限制最大粒子数量：从20个减少到8个
                if (prev.length < 8) {
                    const newParticle: SakuraParticle = {
                        id: sakuraIdRef.current++,
                        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                        y: -50,
                        rotation: Math.random() * 360,
                        speed: 0.5 + Math.random() * 1.5,
                        size: 8 + Math.random() * 12,
                        opacity: 0.4 + Math.random() * 0.4,
                    };
                    return [...prev, newParticle];
                }
                return prev;
            });
        }, 3000); // 从2秒增加到3秒

        return () => clearInterval(interval);
    }, []);

    // 鼠标移动拖尾效果
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };

            // 创建星光拖尾粒子 - 性能优化：降低生成概率和数量
            if (Math.random() > 0.9) {
                // 90%概率不生成，大幅减少拖尾粒子
                const newTrail = {
                    id: trailIdRef.current++,
                    x: e.clientX,
                    y: e.clientY,
                };
                setTrailParticles((prev) => {
                    const updated = [...prev, newTrail];
                    // 限制数量：从10个减少到5个
                    return updated.slice(-5);
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // 点击爆裂效果
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleClick = (e: MouseEvent) => {
            // 创建樱花爆裂效果 - 性能优化：减少爆裂粒子数量
            const burstParticles: SakuraParticle[] = [];
            // 从8个减少到4个
            for (let i = 0; i < 4; i++) {
                burstParticles.push({
                    id: sakuraIdRef.current++,
                    x: e.clientX,
                    y: e.clientY,
                    rotation: (360 / 4) * i,
                    speed: 2 + Math.random() * 3,
                    size: 10 + Math.random() * 15,
                    opacity: 0.8,
                });
            }
            setSakuraParticles((prev) => {
                // 限制总粒子数量，避免累积过多
                const updated = [...prev, ...burstParticles];
                return updated.slice(-10); // 最多保留10个粒子
            });
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // 清理超出屏幕的粒子
    useEffect(() => {
        const cleanup = setInterval(() => {
            if (typeof window === 'undefined') return;

            setSakuraParticles((prev) =>
                prev.filter((p) => p.y < window.innerHeight + 100)
            );
            setTrailParticles((prev) => {
                // 拖尾粒子自动消失
                return prev.filter((_, index) => index < prev.length - 1);
            });
        }, 1000);

        return () => clearInterval(cleanup);
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 pointer-events-none z-[3] overflow-hidden"
        >
            {/* 飘落的樱花瓣 */}
            {sakuraParticles.map((particle) => {
                const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1000;
                return (
                    <motion.div
                        key={particle.id}
                        className="absolute"
                        initial={{
                            x: particle.x,
                            y: particle.y,
                            rotate: particle.rotation,
                            opacity: particle.opacity,
                        }}
                        animate={{
                            x: particle.x + (Math.random() - 0.5) * 200, // 左右飘动
                            y: particle.y + viewportHeight + 200,
                            rotate: particle.rotation + 360,
                            opacity: [particle.opacity, particle.opacity * 0.8, 0],
                        }}
                        transition={{
                            duration: 10 + particle.speed * 5,
                            ease: 'linear',
                            repeat: Infinity,
                        }}
                        style={{
                            width: particle.size,
                            height: particle.size,
                        }}
                    >
                        {/* 樱花瓣形状（使用emoji或SVG） */}
                        <div className="text-pink-300/60 text-2xl drop-shadow-lg">
                            🌸
                        </div>
                    </motion.div>
                );
            })}

            {/* 鼠标拖尾星光 */}
            {trailParticles.map((trail) => (
                <motion.div
                    key={trail.id}
                    className="absolute rounded-full"
                    initial={{
                        x: trail.x - 4,
                        y: trail.y - 4,
                        opacity: 0.8,
                        scale: 1,
                    }}
                    animate={{
                        opacity: 0,
                        scale: 0,
                    }}
                    transition={{
                        duration: 0.5,
                        ease: 'easeOut',
                    }}
                    style={{
                        width: 8,
                        height: 8,
                        background: 'radial-gradient(circle, #FFD700, #FFA500)',
                        boxShadow: '0 0 10px #FFD700',
                    }}
                />
            ))}
        </div>
    );
}

import { useEffect, useRef, useState, useCallback } from 'react';
import { getDevicePerformance, isMobileDevice } from '~/utils/performance';

/**
 * Canvas 粒子系统 - 高性能粒子渲染引擎
 * 使用单个 Canvas 替代多个 React 组件，大幅减少 DOM 操作
 */

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    type: 'dust' | 'sakura';
    life: number;
    maxLife: number;
}

interface CanvasParticleSystemProps {
    /** 是否启用金色光尘效果 */
    enableDust?: boolean;
    /** 是否启用樱花效果 */
    enableSakura?: boolean;
    /** 最大粒子数量（根据性能自动调整） */
    maxParticles?: number;
}

// 金色系颜色
const DUST_COLORS = ['#FFD700', '#FFA500', '#FF9F43', '#FFB84D', '#FFC966'];

// 樱花颜色
const SAKURA_COLOR = 'rgba(255, 182, 193, 0.6)';

export function CanvasParticleSystem({
    enableDust = true,
    enableSakura = true,
    maxParticles = 30,
}: CanvasParticleSystemProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationRef = useRef<number | null>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const [isClient, setIsClient] = useState(false);

    // 根据设备性能调整粒子数量
    const getAdjustedMaxParticles = useCallback(() => {
        const performance = getDevicePerformance();
        const isMobile = isMobileDevice();

        if (isMobile) return Math.floor(maxParticles * 0.3); // 移动端 30%
        if (performance === 'low') return Math.floor(maxParticles * 0.4);
        if (performance === 'medium') return Math.floor(maxParticles * 0.7);
        return maxParticles;
    }, [maxParticles]);

    // 创建金色光尘粒子
    const createDustParticle = useCallback((width: number, height: number): Particle => {
        return {
            x: Math.random() * width,
            y: height + 50,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -0.3 - Math.random() * 0.5,
            size: 1 + Math.random() * 2,
            opacity: 0.3 + Math.random() * 0.4,
            color: DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)],
            rotation: 0,
            rotationSpeed: 0,
            type: 'dust',
            life: 0,
            maxLife: 600 + Math.random() * 400, // 10-17秒 @ 60fps
        };
    }, []);

    // 创建樱花粒子
    const createSakuraParticle = useCallback((width: number): Particle => {
        return {
            x: Math.random() * width,
            y: -50,
            vx: (Math.random() - 0.5) * 1,
            vy: 0.5 + Math.random() * 1.5,
            size: 8 + Math.random() * 12,
            opacity: 0.4 + Math.random() * 0.4,
            color: SAKURA_COLOR,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 2,
            type: 'sakura',
            life: 0,
            maxLife: 600 + Math.random() * 600, // 10-20秒 @ 60fps
        };
    }, []);

    // 绘制樱花瓣形状
    const drawSakura = useCallback((
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        size: number,
        rotation: number,
        opacity: number
    ) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.globalAlpha = opacity;

        // 绘制樱花瓣（5瓣）
        ctx.fillStyle = SAKURA_COLOR;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.ellipse(0, -size * 0.3, size * 0.15, size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.rotate((Math.PI * 2) / 5);
        }

        // 花心
        ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }, []);

    // 绘制金色光尘
    const drawDust = useCallback((
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        size: number,
        opacity: number,
        color: string
    ) => {
        ctx.save();
        ctx.globalAlpha = opacity;

        // 发光效果
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 2, 0, Math.PI * 2);
        ctx.fill();

        // 核心点
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }, []);

    // 主渲染循环
    useEffect(() => {
        if (!isClient) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const adjustedMax = getAdjustedMaxParticles();
        let lastSpawnTime = 0;
        const spawnInterval = 200; // 每200ms生成一个粒子

        // 设置 Canvas 尺寸
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // 动画循环
        const animate = (timestamp: number) => {
            if (!ctx || !canvas) return;

            // 清空画布
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 生成新粒子
            if (timestamp - lastSpawnTime > spawnInterval && particlesRef.current.length < adjustedMax) {
                lastSpawnTime = timestamp;

                // 随机决定生成哪种粒子
                if (enableDust && Math.random() > 0.3) {
                    particlesRef.current.push(createDustParticle(canvas.width, canvas.height));
                } else if (enableSakura && Math.random() > 0.6) {
                    particlesRef.current.push(createSakuraParticle(canvas.width));
                }
            }

            // 更新和绘制粒子
            particlesRef.current = particlesRef.current.filter(particle => {
                // 更新生命周期
                particle.life++;
                if (particle.life > particle.maxLife) return false;

                // 更新位置
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.rotation += particle.rotationSpeed;

                // 计算淡出透明度
                const lifeRatio = particle.life / particle.maxLife;
                const fadeOpacity = particle.opacity * (1 - Math.pow(lifeRatio, 2));

                // 边界检测
                if (particle.type === 'dust' && particle.y < -50) return false;
                if (particle.type === 'sakura' && particle.y > canvas.height + 50) return false;
                if (particle.x < -50 || particle.x > canvas.width + 50) return false;

                // 绘制
                if (particle.type === 'dust') {
                    drawDust(ctx, particle.x, particle.y, particle.size, fadeOpacity, particle.color);
                } else {
                    drawSakura(ctx, particle.x, particle.y, particle.size, particle.rotation, fadeOpacity);
                }

                return true;
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        // 启动动画
        animationRef.current = requestAnimationFrame(animate);

        // 清理
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isClient, enableDust, enableSakura, getAdjustedMaxParticles, createDustParticle, createSakuraParticle, drawDust, drawSakura]);

    // 客户端检测
    useEffect(() => {
        setIsClient(true);
    }, []);

    // 鼠标移动创建拖尾效果
    useEffect(() => {
        if (!isClient) return;

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };

            // 10% 概率创建拖尾粒子
            if (Math.random() > 0.9 && particlesRef.current.length < getAdjustedMaxParticles()) {
                particlesRef.current.push({
                    x: e.clientX,
                    y: e.clientY,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: 2 + Math.random() * 2,
                    opacity: 0.8,
                    color: '#FFD700',
                    rotation: 0,
                    rotationSpeed: 0,
                    type: 'dust',
                    life: 0,
                    maxLife: 30, // 0.5秒 @ 60fps
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isClient, getAdjustedMaxParticles]);

    // 点击爆裂效果
    useEffect(() => {
        if (!isClient) return;

        const handleClick = (e: MouseEvent) => {
            const burstCount = 6;
            for (let i = 0; i < burstCount; i++) {
                const angle = (Math.PI * 2 * i) / burstCount;
                const speed = 2 + Math.random() * 2;
                particlesRef.current.push({
                    x: e.clientX,
                    y: e.clientY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 10 + Math.random() * 10,
                    opacity: 0.8,
                    color: SAKURA_COLOR,
                    rotation: Math.random() * 360,
                    rotationSpeed: (Math.random() - 0.5) * 10,
                    type: 'sakura',
                    life: 0,
                    maxLife: 60, // 1秒 @ 60fps
                });
            }
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [isClient]);

    if (!isClient) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[3]"
            style={{
                willChange: 'transform',
                transform: 'translateZ(0)', // 强制 GPU 加速
            }}
        />
    );
}

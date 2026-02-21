import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

/**
 * 自定义鼠标指针
 * 功能：
 * 1. 粉色箭头图标
 * 2. 点击时触发Canvas粒子爆炸效果（樱花瓣或星星散开）
 * 3. 悬停时有"磁吸"效果或果冻回弹效果
 */
export function CustomCursor() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [clickParticles, setClickParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
    const prevTargetRef = useRef<HTMLElement | null>(null);
    const particleIdRef = useRef(0);

    // 优化鼠标移动事件，减少不必要的状态更新
    const updateMousePosition = useCallback((e: MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
    }, []);

    // 优化hover检测，只在目标元素变化时更新状态
    const handleMouseOver = useCallback((e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isLinkOrButton = !!(target.tagName === "A" || target.tagName === "BUTTON" || target.closest("a") || target.closest("button"));

        if (isLinkOrButton !== isHovering) {
            setIsHovering(isLinkOrButton);
        }
        prevTargetRef.current = target;
    }, [isHovering]);

    // 点击粒子爆炸效果
    const handleClick = useCallback((e: MouseEvent) => {
        // 创建粒子爆炸效果
        const particles: Array<{ id: number; x: number; y: number }> = [];
        for (let i = 0; i < 12; i++) {
            particles.push({
                id: particleIdRef.current++,
                x: e.clientX,
                y: e.clientY,
            });
        }
        setClickParticles(prev => [...prev, ...particles]);

        // 清理粒子
        setTimeout(() => {
            setClickParticles(prev => prev.filter(p => !particles.find(pp => pp.id === p.id)));
        }, 1000);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        window.addEventListener("mousemove", updateMousePosition, { passive: true });
        window.addEventListener("mouseover", handleMouseOver);
        window.addEventListener("click", handleClick, { passive: true });

        // Add class to hide default cursor
        if (typeof document !== 'undefined') {
            document.body.classList.add("custom-cursor");
        }

        return () => {
            window.removeEventListener("mousemove", updateMousePosition);
            window.removeEventListener("mouseover", handleMouseOver);
            window.removeEventListener("click", handleClick);
            if (typeof document !== 'undefined') {
                document.body.classList.remove("custom-cursor");
            }
        };
    }, [updateMousePosition, handleMouseOver, handleClick]);

    return (
        <>
            {/* 自定义鼠标指针 - 粉色箭头 */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9999]"
                style={{
                    left: `${mousePosition.x}px`,
                    top: `${mousePosition.y}px`,
                }}
                animate={{
                    scale: isHovering ? 0.8 : 1,
                    rotate: isHovering ? 15 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 28,
                }}
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M3 3L12 2L10 11L3 3Z"
                        fill="#FF9F43"
                        stroke="#FF6B6B"
                        strokeWidth="1.5"
                    />
                </svg>
            </motion.div>

            {/* 点击粒子爆炸效果 */}
            {clickParticles.map((particle) => {
                const angle = (Math.PI * 2 * particle.id) / 12;
                const distance = 50 + Math.random() * 30;
                const endX = particle.x + Math.cos(angle) * distance;
                const endY = particle.y + Math.sin(angle) * distance;
                const emoji = Math.random() > 0.5 ? '🌸' : '✨';

                return (
                    <motion.div
                        key={particle.id}
                        className="fixed pointer-events-none z-[9998] text-2xl"
                        initial={{
                            x: particle.x,
                            y: particle.y,
                            opacity: 1,
                            scale: 1,
                        }}
                        animate={{
                            x: endX,
                            y: endY,
                            opacity: 0,
                            scale: 0,
                            rotate: 360,
                        }}
                        transition={{
                            duration: 0.8,
                            ease: "easeOut",
                        }}
                    >
                        {emoji}
                    </motion.div>
                );
            })}
        </>
    );
}

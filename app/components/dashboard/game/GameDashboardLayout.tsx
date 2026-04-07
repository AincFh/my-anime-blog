import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { MobileNav } from "~/components/layout/MobileNav";

interface GameDashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
    backgroundImage?: string;
}

// 固定种子的伪随机数生成器（LCG），保证 SSR 与客户端算出相同粒子初始坐标，避免 hydration mismatch
function seededRand(seed: number) {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
}

function makeParticles(count = 8) {
    return Array.from({ length: count }, (_, i) => ({
        w: seededRand(i * 7) * 4 + 2,
        h: seededRand(i * 13) * 4 + 2,
        x: seededRand(i * 3 + 100) * 100,
        y: seededRand(i * 5 + 200) * 100,
        dur: seededRand(i * 11) * 5 + 5,
        delay: seededRand(i * 17) * 5,
    }));
}

export function GameDashboardLayout({
    children,
    title = "游戏中心",
    backgroundImage
}: GameDashboardLayoutProps) {
    // 默认背景图 (二次元风景/角色)
    const bgImage = backgroundImage || "https://api.paugram.com/wallpaper/";

    // memoize so particles array is referentially stable across renders
    const particles = useMemo(() => makeParticles(8), []);

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden bg-slate-900 text-white font-sans">
            {/* 1. 沉浸式背景层 */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    className="w-full h-full"
                >
                    <img
                        src={bgImage}
                        alt="Background"
                        className="w-full h-full object-cover object-center"
                    />
                    {/* 渐变遮罩：确保UI可读性 */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30" />
                </motion.div>
            </div>

            {/* 2. 粒子/光效层 (可选) */}
            <div className="absolute inset-0 z-1 pointer-events-none">
                {/* 简单的浮动光点 */}
                {particles.map((p, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-white/30 rounded-full blur-md"
                        style={{
                            width: p.w,
                            height: p.h,
                            left: p.x,
                            top: p.y,
                        }}
                        animate={{
                            y: [0, -100],
                            opacity: [0, 0.8, 0],
                        }}
                        transition={{
                            duration: p.dur,
                            repeat: Infinity,
                            delay: p.delay,
                            ease: "linear",
                        }}
                    />
                ))}
            </div>

            {/* 3. UI 内容层 */}
            <div className="relative z-10 w-full h-full flex flex-col">
                {children}
            </div>

            {/* 4. 移动端全局导航 */}
            <MobileNav />
        </div>
    );
}

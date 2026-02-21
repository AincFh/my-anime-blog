import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { MobileNav } from "~/components/layout/MobileNav";

interface GameDashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
    backgroundImage?: string;
}

export function GameDashboardLayout({
    children,
    title = "游戏中心",
    backgroundImage
}: GameDashboardLayoutProps) {
    // 默认背景图 (二次元风景/角色)
    const bgImage = backgroundImage || "https://api.yimian.xyz/img?id=444";

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
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-white/30 rounded-full blur-md"
                        style={{
                            width: Math.random() * 4 + 2 + 'px',
                            height: Math.random() * 4 + 2 + 'px',
                            left: Math.random() * 100 + '%',
                            top: Math.random() * 100 + '%',
                        }}
                        animate={{
                            y: [0, -100],
                            opacity: [0, 0.8, 0],
                        }}
                        transition={{
                            duration: Math.random() * 5 + 5,
                            repeat: Infinity,
                            delay: Math.random() * 5,
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

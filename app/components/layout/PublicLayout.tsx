import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FloatingNav } from "./FloatingNav";
import { MobileNav } from "./MobileNav";
import { DynamicBackground } from "~/components/ui/animations/DynamicBackground";
import { CanvasParticleSystem } from "~/components/ui/animations/CanvasParticleSystem";
import { shouldEnableParticles } from "~/utils/performance";

// ==================== 公共布局 ====================
// 职责：视觉层（背景、粒子、导航），不负责功能组件（音乐播放器、彩蛋等由 root.tsx 统管）

export function PublicLayout({ children }: { children: React.ReactNode }) {
    const [scrollY, setScrollY] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [enableParticles, setEnableParticles] = useState(false);

    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
        setEnableParticles(window.innerWidth >= 768 && shouldEnableParticles());

        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const bgY = scrollY * 0.2;

    return (
        <div className="relative min-h-screen overflow-hidden font-round text-slate-800 dark:text-slate-200 selection:bg-primary-start selection:text-white">
            {/* 动态全屏背景系统 */}
            <div className="absolute inset-0 z-0" data-background-layer>
                <div
                    className="absolute inset-0"
                    style={{ transform: `translateY(${bgY}px)`, transition: 'none' }}
                >
                    <DynamicBackground />
                </div>
            </div>

            {/* Bokeh 光斑 — 仅桌面端（CSS hidden md:block 保证移动端零渲染） */}
            <div className="fixed inset-0 z-1 pointer-events-none hidden md:block">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-start/20 blur-3xl animate-bokeh-1" />
                <div className="absolute bottom-20 -left-20 w-80 h-80 rounded-full bg-primary-end/20 blur-3xl animate-bokeh-2" />
                <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-yellow-300/15 blur-3xl animate-bokeh-3" />
            </div>

            {/* Canvas 粒子系统 — 仅桌面端且通过性能检测 */}
            {enableParticles && <CanvasParticleSystem enableDust={true} enableSakura={true} maxParticles={25} />}

            {/* 桌面端浮岛导航（自身已有 hidden md:block） */}
            <FloatingNav />

            {/* 主内容区 — 移动端顶部零间距，底部留出 MobileNav 安全区 */}
            <div
                id="main-content"
                className="relative z-10 pt-[calc(env(safe-area-inset-top)+1rem)] md:pt-[calc(env(safe-area-inset-top)+5rem)] pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-0"
            >
                {children}
            </div>

            {/* 移动端底部浮岛导航（MobileNav 自身已有 md:hidden） */}
            <MobileNav />
        </div>
    );
}

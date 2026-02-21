import { useScroll, useTransform, motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { FloatingNav } from "./FloatingNav";
import { MobileNav } from "./MobileNav";
import { DynamicBackground } from "../animations/DynamicBackground";
import { CanvasParticleSystem } from "../animations/CanvasParticleSystem";
import { MusicPlayerMobile } from "../media/MusicPlayerMobile";
import { shouldEnableParticles, shouldUseGlassmorphism } from "~/utils/performance";

export function PublicLayout({ children }: { children: React.ReactNode }) {
    const ref = useRef(null);
    const { scrollY } = useScroll({ target: ref });
    const y = useTransform(scrollY, [0, 1000], [0, 200]); // Parallax effect
    const [isClient, setIsClient] = useState(false);
    const [enableParticles, setEnableParticles] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // 性能检测和降级策略
        setEnableParticles(shouldEnableParticles());
    }, []);

    return (
        <div ref={ref} className="relative min-h-screen overflow-hidden font-round text-slate-800 selection:bg-primary-start selection:text-white">
            {/* 动态全屏背景系统（R2图床支持） */}
            <div className="absolute inset-0 z-0" data-background-layer>
                <motion.div
                    style={{ y }}
                    className="absolute inset-0"
                >
                    <DynamicBackground />
                </motion.div>
            </div>

            {/* Atmosphere Layer - Bokeh Lights (纯 CSS 动画) */}
            <div className="fixed inset-0 z-1 pointer-events-none">
                {/* Large bokeh circles - 使用 CSS animation 替代 Framer Motion */}
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-start/20 blur-3xl animate-bokeh-1" />
                <div className="absolute bottom-20 -left-20 w-80 h-80 rounded-full bg-primary-end/20 blur-3xl animate-bokeh-2" />
                <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-yellow-300/15 blur-3xl animate-bokeh-3" />
            </div>

            {/* Canvas 粒子系统 - 高性能版 */}
            {enableParticles && <CanvasParticleSystem enableDust={true} enableSakura={true} maxParticles={25} />}

            {/* Floating Navigation - 灵动岛风格，桌面端显示，移动端作为顶部状态栏 */}
            <FloatingNav />

            {/* Content - 顶部留出导航空间 */}
            <div id="main-content" className="relative z-10 pt-20 pb-20 md:pb-0">
                {children}
            </div>

            {/* 移动端底部导航栏 */}
            <MobileNav />

            {/* 移动端音乐播放器（胶囊化）- 调整位置避免遮挡 */}
            <MusicPlayerMobile />
        </div>
    );
}

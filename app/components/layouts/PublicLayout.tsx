import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { GlobalParticleEffect } from "../ParticleEffect";
import { FloatingNav } from "../layout/FloatingNav";
import { DynamicBackground } from "../animations/DynamicBackground";
import { SakuraParticles } from "../animations/SakuraParticles";
import { MusicPlayerMobile } from "../media/MusicPlayerMobile";
import { shouldEnableParticles, shouldUseGlassmorphism } from "~/utils/performance";

export function PublicLayout({ children }: { children: React.ReactNode }) {
    const ref = useRef(null);
    const { scrollY } = useScroll({ target: ref });
    const y = useTransform(scrollY, [0, 1000], [0, 200]); // Parallax effect
    const [isClient, setIsClient] = useState(false);
    const [enableParticles, setEnableParticles] = useState(false);
    const [useGlass, setUseGlass] = useState(true);

    useEffect(() => {
        setIsClient(true);
        // 性能检测和降级策略
        setEnableParticles(shouldEnableParticles());
        setUseGlass(shouldUseGlassmorphism());
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

            {/* Atmosphere Layer - Bokeh Lights */}
            <div className="fixed inset-0 z-1 pointer-events-none">
                {/* Large bokeh circles */}
                <motion.div
                    className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-start/20 blur-3xl"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.7, 0.9, 0.7] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-20 -left-20 w-80 h-80 rounded-full bg-primary-end/20 blur-3xl"
                    animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-yellow-300/15 blur-3xl"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.7, 0.5] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
                />
            </div>

            {/* 金色光尘粒子效果 - 性能优化：低性能设备禁用 */}
            {enableParticles && <GlobalParticleEffect />}

            {/* 樱花粒子特效 - 性能优化：低性能设备禁用 */}
            {enableParticles && <SakuraParticles />}

            {/* Floating Navigation - 灵动岛风格，所有设备统一 */}
            <FloatingNav />

            {/* Content - 顶部留出导航空间 */}
            <div className="relative z-10 pt-20">
                {children}
            </div>

            {/* 移动端音乐播放器（胶囊化） */}
            <MusicPlayerMobile />
        </div>
    );
}

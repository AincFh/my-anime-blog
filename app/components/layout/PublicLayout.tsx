import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { GlobalParticleEffect } from "../ParticleEffect";
import { FloatingNav } from "./FloatingNav";
import { DynamicBackground } from "../animations/DynamicBackground";
import { SakuraParticles } from "../animations/SakuraParticles";
import { shouldEnableParticles, shouldUseGlassmorphism } from "../../utils/performance";

export function PublicLayout({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
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
        <div
            ref={ref}
            className="relative min-h-screen overflow-hidden font-round text-slate-800 selection:bg-primary-start selection:text-white"
            style={{ position: 'relative' }} // 确保 Framer Motion 正确计算滚动
        >
            {/* 动态全屏背景系统 */}
            <div className="fixed inset-0 z-0" data-background-layer>
                <DynamicBackground />
            </div>

            {/* Atmosphere Layer - Bokeh Lights - 简化动画减少性能开销 */}
            {/* Atmosphere Layer - Bokeh Lights - 简化动画减少性能开销 - 已移除以修复转场闪烁问题 */}
            {/* <div className="fixed inset-0 z-[1] pointer-events-none">
                <div
                    className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-start/20 blur-3xl animate-pulse-slow"
                />
                <div
                    className="absolute bottom-20 -left-20 w-80 h-80 rounded-full bg-primary-end/20 blur-3xl animate-pulse-slower"
                />
                <div
                    className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-yellow-300/15 blur-3xl animate-pulse-slowest"
                />
            </div> */}

            {/* 金色光尘粒子效果 - 性能优化：低性能设备禁用 */}
            {enableParticles && <GlobalParticleEffect />}

            {/* 樱花粒子特效 - 性能优化：低性能设备禁用 */}
            {enableParticles && <SakuraParticles />}

            {/* Floating Navigation */}
            <FloatingNav />

            {/* Content */}
            <div className="relative z-10 pb-20 md:pb-0 md:pt-24">
                {children}
            </div>
        </div>
    );
}

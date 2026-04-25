import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FloatingNav } from "./FloatingNav";
import { MobileNav } from "./MobileNav";
import { SiteFooter } from "./SiteFooter";
import { DynamicBackground } from "~/components/ui/animations/DynamicBackground";
import { CanvasParticleSystem } from "~/components/ui/animations/CanvasParticleSystem";
import { shouldEnableParticles } from "~/utils/performance";
import { AnnouncementBanner } from "~/components/global/AnnouncementBanner";
import { AnnouncementPopup } from "~/components/global/AnnouncementPopup";
import type { Announcement } from "~/types/announcement";

// ==================== 公共布局 ====================

export function PublicLayout({
    children,
    bannerAnnouncements = [],
    popupAnnouncements = [],
}: {
    children: React.ReactNode;
    bannerAnnouncements?: Announcement[];
    popupAnnouncements?: Announcement[];
}) {
    const [scrollY, setScrollY] = useState(0);
    const [enableParticles, setEnableParticles] = useState(false);

    useEffect(() => {
        setEnableParticles(window.innerWidth >= 768 && shouldEnableParticles());

        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const bgY = scrollY * 0.2;

    return (
        <div className="relative min-h-screen overflow-hidden font-round text-slate-800 dark:text-slate-200 selection:bg-primary-start selection:text-white">
            {/* 动态全屏背景系统 */}
            <div
                className="fixed inset-0"
                style={{ transform: `translateY(${bgY}px)` }}
            >
                <DynamicBackground />
            </div>

            {/* Bokeh 光斑 */}
            <div className="fixed inset-0 pointer-events-none hidden md:block overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full animate-bokeh-1" style={{
                    background: 'var(--bokeh-orb-1)',
                    filter: 'blur(64px)',
                }} />
                <div className="absolute bottom-20 -left-20 w-80 h-80 rounded-full animate-bokeh-2" style={{
                    background: 'var(--bokeh-orb-2)',
                    filter: 'blur(64px)',
                }} />
                <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full animate-bokeh-3" style={{
                    background: 'var(--bokeh-orb-3)',
                    filter: 'blur(64px)',
                }} />
            </div>

            {/* Canvas 粒子系统 */}
            {enableParticles && <CanvasParticleSystem enableDust={true} enableSakura={true} maxParticles={25} />}

            {/* 公告横幅 */}
            {bannerAnnouncements.map((announcement) => (
                <AnnouncementBanner key={announcement.id} announcement={announcement} />
            ))}

            {/* 公告弹窗 */}
            {popupAnnouncements.map((announcement) => (
                <AnnouncementPopup key={announcement.id} announcement={announcement} />
            ))}

            {/* 桌面端中心导航 */}
            <FloatingNav />

            {/* 主内容区 */}
            <div
                id="main-content"
                className="relative z-10 pt-[calc(env(safe-area-inset-top)+1rem)] md:pt-[calc(env(safe-area-inset-top)+5rem)] pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-0"
            >
                {children}
            </div>

            {/* 移动端底部导航 */}
            <MobileNav />

            {/* 网站底部 Footer */}
            <SiteFooter />
        </div>
    );
}

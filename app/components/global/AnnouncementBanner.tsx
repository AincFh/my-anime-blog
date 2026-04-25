/**
 * 公告横幅组件
 * 对应 Notion 公告数据库中「展示方式 = 顶部横幅」的条目
 *
 * 规范三重过滤已在服务层执行：
 *   1. 状态 = ✅ 已发布
 *   2. 首页展示 = true
 *   3. 开始日期 ≤ now ≤ 结束日期
 */
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import type { Announcement } from "~/types/announcement";

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    "📢普通": { bg: "bg-blue-500", text: "text-white", border: "border-blue-600", icon: "📢" },
    "🚧维护": { bg: "bg-amber-500", text: "text-white", border: "border-amber-600", icon: "🚧" },
    "✨功能提示": { bg: "bg-emerald-500", text: "text-white", border: "border-emerald-600", icon: "✨" },
    "🎉活动": { bg: "bg-rose-500", text: "text-white", border: "border-rose-600", icon: "🎉" },
};

const DEFAULT_STYLE = { bg: "bg-slate-500", text: "text-white", border: "border-slate-600", icon: "📢" };

interface AnnouncementBannerProps {
    announcement: Announcement;
}

export function AnnouncementBanner({ announcement }: AnnouncementBannerProps) {
    const [isVisible, setIsVisible] = useState(true);
    const style = TYPE_STYLES[announcement.type] || DEFAULT_STYLE;

    useEffect(() => {
        const dismissed = localStorage.getItem(`banner_dismissed_${announcement.id}`);
        if (dismissed === "true") {
            setIsVisible(false);
        }
    }, [announcement.id]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(`banner_dismissed_${announcement.id}`, "true");
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={`${style.bg} ${style.text} border-b-2 ${style.border} relative z-[70]`}
                >
                    <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
                        {/* 左侧：图标 + 标题 */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-sm shrink-0">{style.icon}</span>
                            <span className="text-sm font-medium truncate">{announcement.title}</span>
                            {announcement.summary && (
                                <span className="text-sm opacity-80 truncate hidden sm:inline">
                                    — {announcement.summary}
                                </span>
                            )}
                        </div>

                        {/* 右侧：CTA + 关闭 */}
                        <div className="flex items-center gap-3 shrink-0">
                            {announcement.ctaLink && (
                                <Link
                                    to={announcement.ctaLink}
                                    className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors whitespace-nowrap"
                                >
                                    {announcement.ctaText || "查看详情"}
                                </Link>
                            )}
                            <button
                                onClick={handleDismiss}
                                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-sm opacity-70 hover:opacity-100"
                                aria-label="关闭公告"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

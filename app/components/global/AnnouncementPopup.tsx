/**
 * 公告弹窗组件
 * 对应 Notion 公告数据库中「展示方式 = 首页弹窗」的条目
 *
 * 规范三重过滤已在服务层执行：
 *   1. 状态 = ✅ 已发布
 *   2. 首页展示 = true
 *   3. 开始日期 ≤ now ≤ 结束日期
 *
 * 前台用 localStorage 记录已关闭的公告 id，避免重复打扰
 */
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import type { Announcement } from "~/types/announcement";

const TYPE_STYLES: Record<string, { bg: string; border: string; titleColor: string; icon: string }> = {
    "📢普通": { bg: "bg-white dark:bg-slate-800", border: "border-blue-200 dark:border-blue-800", titleColor: "text-blue-600 dark:text-blue-400", icon: "📢" },
    "🚧维护": { bg: "bg-white dark:bg-slate-800", border: "border-amber-200 dark:border-amber-800", titleColor: "text-amber-600 dark:text-amber-400", icon: "🚧" },
    "✨功能提示": { bg: "bg-white dark:bg-slate-800", border: "border-emerald-200 dark:border-emerald-800", titleColor: "text-emerald-600 dark:text-emerald-400", icon: "✨" },
    "🎉活动": { bg: "bg-white dark:bg-slate-800", border: "border-rose-200 dark:border-rose-800", titleColor: "text-rose-600 dark:text-rose-400", icon: "🎉" },
};

const DEFAULT_STYLE = { bg: "bg-white dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700", titleColor: "text-slate-700 dark:text-slate-300", icon: "📢" };

export function AnnouncementPopup({ announcement }: { announcement: Announcement }) {
    const [isVisible, setIsVisible] = useState(false);
    const style = TYPE_STYLES[announcement.type] || DEFAULT_STYLE;

    useEffect(() => {
        const dismissed = localStorage.getItem(`popup_dismissed_${announcement.id}`);
        if (dismissed !== "true") {
            // 延迟 1 秒显示弹窗，避免页面加载时就弹出干扰
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [announcement.id]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(`popup_dismissed_${announcement.id}`, "true");
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                >
                    {/* 遮罩 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={handleDismiss}
                    />

                    {/* 弹窗主体 */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className={`relative w-full max-w-md ${style.bg} ${style.border} border-2 rounded-2xl shadow-2xl overflow-hidden`}
                    >
                        {/* 顶部色条 */}
                        <div className={`h-1.5 w-full ${style.titleColor.replace("text-", "bg-")}`} />

                        <div className="p-6">
                            {/* 标题行 */}
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{style.icon}</span>
                                    <h3 className={`font-black text-base ${style.titleColor}`}>
                                        {announcement.title}
                                    </h3>
                                </div>
                                <button
                                    onClick={handleDismiss}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors text-sm"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* 内容 */}
                            {announcement.summary && (
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-5">
                                    {announcement.summary}
                                </p>
                            )}

                            {/* 操作按钮 */}
                            <div className="flex items-center gap-3">
                                {announcement.ctaLink ? (
                                    <Link
                                        to={announcement.ctaLink}
                                        onClick={handleDismiss}
                                        className={`flex-1 text-center py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98] ${style.titleColor.replace("text-", "bg-")}`}
                                    >
                                        {announcement.ctaText || "查看详情"}
                                    </Link>
                                ) : (
                                    <button
                                        onClick={handleDismiss}
                                        className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        我知道了
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

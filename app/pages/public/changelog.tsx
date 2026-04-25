/**
 * 更新日志页面
 * 数据来源：Notion 网站更新日志数据库
 */
import { motion } from "framer-motion";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import { Sparkles, Rocket, Bug, Zap, FileText, ChevronRight, ArrowLeft } from "lucide-react";
import { getChangelog } from "~/services/index";
import type { ChangelogItem } from "~/types/changelog";

// 按更新类型映射图标和颜色
const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    "🚀大版本": { icon: Rocket, color: "text-purple-500", bg: "bg-purple-500/10", label: "大版本" },
    "✨功能更新": { icon: Sparkles, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "功能更新" },
    "🐞修复": { icon: Bug, color: "text-rose-500", bg: "bg-rose-500/10", label: "问题修复" },
    "⚡优化": { icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", label: "体验优化" },
    "📝内容更新": { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10", label: "内容更新" },
};

const DEFAULT_TYPE_CONFIG = { icon: Sparkles, color: "text-slate-500", bg: "bg-slate-500/10", label: "其他" };

export async function loader({ context }: LoaderFunctionArgs) {
    const env = context.cloudflare.env as {
        NOTION_TOKEN?: string;
        NOTION_CHANGELOG_DATABASE_ID?: string;
        CACHE_KV?: import("@cloudflare/workers-types").KVNamespace;
    };

    try {
        const [publishedResult, featuredResult] = await Promise.allSettled([
            getChangelog(env.NOTION_TOKEN, env.NOTION_CHANGELOG_DATABASE_ID, env.CACHE_KV, {}),
            getChangelog(env.NOTION_TOKEN, env.NOTION_CHANGELOG_DATABASE_ID, env.CACHE_KV, { featuredOnly: true }),
        ]);

        const allItems: ChangelogItem[] = publishedResult.status === "fulfilled"
            ? (publishedResult.value as any).data || []
            : [];
        const featuredItems: ChangelogItem[] = featuredResult.status === "fulfilled"
            ? (featuredResult.value as any).data || []
            : [];

        // 按版本/日期分组
        const grouped = allItems.reduce((acc: Record<string, ChangelogItem[]>, item) => {
            const key = item.version || new Date(item.date).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit" });
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});

        return { allItems, featuredItems, grouped };
    } catch (error) {
        console.error("[Changelog] Failed to fetch:", error);
        return { allItems: [], featuredItems: [], grouped: {} };
    }
}

export default function ChangelogPage() {
    const { allItems, featuredItems, grouped } = useLoaderData<typeof loader>() as Awaited<ReturnType<typeof loader>>;
    const groups = Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));

    return (
        <div className="w-full max-w-[1400px] mx-auto pt-[70px] md:pt-[80px] pb-32 px-4 md:px-6 lg:px-10 xl:px-12">
            {/* 页面标题 */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mb-12 md:mb-16"
            >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-sans font-black tracking-tight text-slate-900 dark:text-white mb-3">
                    更新日志
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                    {allItems.length} 条记录，持续迭代中
                </p>
            </motion.div>

            {/* 重大更新横幅（精选） */}
            {featuredItems.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                    className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    {featuredItems.slice(0, 2).map((item) => {
                        const cfg = TYPE_CONFIG[item.type] || DEFAULT_TYPE_CONFIG;
                        const Icon = cfg.icon;
                        return (
                            <Link
                                key={item.id}
                                to={`/changelog/${item.slug}`}
                                className="group relative flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 border border-white/10 overflow-hidden"
                            >
                                <div className={`shrink-0 w-12 h-12 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                                    <Icon className={`w-6 h-6 ${cfg.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {item.version && (
                                            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                                {item.version}
                                            </span>
                                        )}
                                        <span className="text-xs font-semibold text-white/60">{cfg.label}</span>
                                    </div>
                                    <h3 className="text-white font-bold text-base truncate group-hover:text-amber-400 transition-colors">
                                        {item.title}
                                    </h3>
                                </div>
                                <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all shrink-0" />
                            </Link>
                        );
                    })}
                </motion.div>
            )}

            {/* 按版本/日期分组列表 */}
            {groups.length > 0 ? (
                <div className="flex flex-col gap-12">
                    {groups.map(([groupKey, items], groupIdx) => (
                        <div key={groupKey}>
                            {/* 分组标题 */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: groupIdx * 0.05 }}
                                className="flex items-center gap-4 mb-6"
                            >
                                <div className="flex items-center gap-2">
                                    {items[0]?.version && (
                                        <span className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                            {items[0].version}
                                        </span>
                                    )}
                                    {!items[0]?.version && (
                                        <span className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                            {groupKey}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                            </motion.div>

                            {/* 分组内的条目列表 */}
                            <div className="flex flex-col gap-3">
                                {items.map((item, idx) => {
                                    const cfg = TYPE_CONFIG[item.type] || DEFAULT_TYPE_CONFIG;
                                    const Icon = cfg.icon;
                                    return (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 + idx * 0.05 }}
                                        >
                                            <Link
                                                to={`/changelog/${item.slug}`}
                                                className="group flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300"
                                            >
                                                {/* 类型图标 */}
                                                <div className={`shrink-0 w-10 h-10 rounded-lg ${cfg.bg} flex items-center justify-center mt-0.5`}>
                                                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                                                </div>

                                                {/* 内容 */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <time className="text-xs font-medium text-slate-400">
                                                            {new Date(item.date).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}
                                                        </time>
                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                                                            {cfg.label}
                                                        </span>
                                                        {item.major && (
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                                重大更新
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-slate-900 dark:text-white font-semibold text-base group-hover:text-amber-500 transition-colors mb-1">
                                                        {item.title}
                                                    </h3>
                                                    {item.summary && (
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                            {item.summary}
                                                        </p>
                                                    )}
                                                </div>

                                                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-400 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* 空状态 */
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <Sparkles className="w-8 h-8 text-slate-400 opacity-50" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-700 dark:text-white mb-2">暂无更新记录</h3>
                    <p className="text-slate-500 dark:text-slate-400">期待第一版更新日志的到来</p>
                </div>
            )}
        </div>
    );
}

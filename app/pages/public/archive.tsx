import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { Route } from "./+types/archive";
import { GlassCard } from "~/components/layout/GlassCard";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";

export async function loader({ context }: Route.LoaderArgs) {
    const { anime_db } = context.cloudflare.env;

    try {
        // 获取所有文章
        const articlesResult = await anime_db
            .prepare(
                `SELECT id, slug, title, description, category, created_at, cover_image, 'article' as type
         FROM articles
         ORDER BY created_at DESC`
            )
            .all();

        // 获取所有番剧活动
        const animesResult = await anime_db
            .prepare(
                `SELECT id, title, status, created_at, cover_image, 'anime' as type
         FROM animes
         ORDER BY created_at DESC`
            )
            .all();

        // 合并并按时间排序
        let activities = [
            ...(articlesResult.results || []),
            ...(animesResult.results || []),
        ].sort((a: any, b: any) => b.created_at - a.created_at);

        // 如果没有数据，灌入二次元 Mock 数据帮助呈现排版预览
        if (activities.length === 0) {
            activities = [
                { id: 1, title: '初次建立二次元部落！', type: 'article', description: '这是我建立的第一个博客文章，记录着建站所有的坎坷和快乐。基于 Remix 的征程正式开启。', created_at: Date.now()/1000 - 86400 * 10, category: 'life' },
                { id: 2, title: '葬送的芙莉莲', type: 'anime', status: 'watching', created_at: Date.now()/1000 - 86400 * 5, cover_image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n1MjsNOhEcvT.jpg' },
                { id: 3, title: '赛博朋克：边缘行者', type: 'anime', status: 'completed', created_at: Date.now()/1000 - 86400 * 25, cover_image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120377-5O0eJmS2NqA0.jpg' },
                { id: 4, title: '博客功能逐步完善与主题设计迭代', type: 'article', description: '基于 Apple HIG 设计语言的一场重构，包括卡片边缘与暗黑环境色度算法等技术细节都在里面进行了解析。', created_at: Date.now()/1000 - 86400 * 2, category: 'tech' }
            ].sort((a: any, b: any) => b.created_at - a.created_at);
        }

        // 按年份分组
        const groupedByYear = activities.reduce((acc: any, activity: any) => {
            const date = new Date(activity.created_at * 1000);
            const year = date.getFullYear();

            if (!acc[year]) {
                acc[year] = [];
            }

            acc[year].push({
                ...activity,
                formattedDate: date.toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                }),
            });

            return acc;
        }, {});

        return { groupedByYear };
    } catch (error) {
        console.error("Failed to fetch archive:", error);
        return { groupedByYear: {} };
    }
}

export default function Archive({ loaderData }: Route.ComponentProps) {
    const { groupedByYear } = loaderData;
    const years = Object.keys(groupedByYear).sort((a, b) => parseInt(b) - parseInt(a));
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: containerRef });

    // 视差效果：时间线随滚动移动
    const timelineY = useTransform(scrollYProgress, [0, 1], [0, -100]);

    // 分离文章和番剧
    const separateActivities = () => {
        const articles: any[] = [];
        const animes: any[] = [];

        years.forEach((year) => {
            groupedByYear[year].forEach((activity: any) => {
                if (activity.type === "article") {
                    articles.push({ ...activity, year });
                } else {
                    animes.push({ ...activity, year });
                }
            });
        });

        return { articles, animes };
    };

    const { articles, animes } = separateActivities();

    return (
        <div ref={containerRef} className="w-full max-w-[1600px] mx-auto pt-[70px] md:pt-[80px] pb-32 lg:pb-24 px-4 md:px-6 lg:px-10 xl:px-12">
            {/* 极简标题 */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mb-16 md:mb-24"
            >
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-sans font-black tracking-tight text-slate-900 dark:text-white mb-3">
                    时光机
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl font-medium text-slate-400 dark:text-slate-500 tracking-tight">
                    时光卷轴的印记
                </p>
            </motion.div>

            {/* Apple 极简左置时轴 (单线程) */}
            <div className="relative">
                {/* 浅灰轨道 */}
                <motion.div
                    style={{ y: timelineY }}
                    className="absolute left-[31px] md:left-[47px] top-10 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 z-0"
                />

                <div className="relative z-10 flex flex-col gap-16 md:gap-24">
                    {years.map((year, yearIdx) => {
                        const yearActivities = groupedByYear[year];
                        return (
                            <div key={year} className="relative">
                                {/* 年份节点头 */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: yearIdx * 0.1 }}
                                    className="flex items-center gap-6 md:gap-8 mb-8"
                                >
                                    <div className="w-16 h-16 md:w-24 md:h-24 shrink-0 bg-slate-100 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-[24px] md:rounded-[32px] flex items-center justify-center shadow-sm z-10">
                                        <span className="text-xl md:text-3xl font-black tracking-tighter text-slate-800 dark:text-white">{year}</span>
                                    </div>
                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800/50" />
                                </motion.div>

                                {/* 这一年的记录群 */}
                                <div className="flex flex-col gap-8 md:gap-12 pl-[31px] md:pl-[47px]">
                                    {yearActivities.map((activity: any, idx: number) => {
                                        const typeColor = activity.type === "article" 
                                            ? "bg-slate-800 dark:bg-slate-200" 
                                            : "bg-slate-400 dark:bg-slate-500";
                                            
                                        return (
                                            <motion.div
                                                key={`${activity.type}-${activity.id}`}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 + idx * 0.05 }}
                                                className="relative pl-8 md:pl-16 group"
                                            >
                                                {/* 时轴连接点 (极简圆环) */}
                                                <div className="absolute left-[-5px] top-6 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-[3px] border-slate-300 dark:border-slate-600 group-hover:border-slate-800 dark:group-hover:border-white transition-colors duration-300 z-20" />
                                                
                                                {/* 主卡片 */}
                                                <div className="bg-white dark:bg-slate-900/40 rounded-[28px] md:rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 dark:border-white/5 flex flex-col md:flex-row p-4 md:p-6 gap-6">
                                                    {/* 海报区 - 使用更雅致的裁切 */}
                                                    {activity.cover_image && (
                                                        <div className="w-full md:w-64 shrink-0 aspect-video md:aspect-square rounded-[20px] md:rounded-[24px] overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                                                            <OptimizedImage
                                                                src={activity.cover_image}
                                                                alt={activity.title}
                                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                                                                width={400}
                                                            />
                                                            <div className="absolute inset-0 bg-black/5" />
                                                        </div>
                                                    )}

                                                    {/* 内容介绍区 */}
                                                    <div className="flex-1 flex flex-col justify-center gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl">{activity.type === "article" ? "📝" : "🎬"}</span>
                                                            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 tracking-wide uppercase">
                                                                {activity.formattedDate}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                                                            {activity.title}
                                                        </h3>
                                                        
                                                        {activity.type === "article" && activity.description && (
                                                            <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl line-clamp-2">
                                                                {activity.description}
                                                            </p>
                                                        )}

                                                        {/* 精致的标签群 */}
                                                        <div className="flex items-center gap-2 mt-2">
                                                            {activity.type === "anime" && activity.status && (
                                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/5">
                                                                    {activity.status === "completed" ? "看过" : activity.status === "watching" ? "在追" : activity.status === "plan" ? "想看" : "弃番"}
                                                                </span>
                                                            )}
                                                            {activity.category && (
                                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/5">
                                                                    {activity.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {years.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <span className="text-4xl opacity-50">🕰️</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-700 dark:text-white mb-2">记录为空</h3>
                    <p className="text-slate-500">时空的尽头，暂时没有任何波纹产生。</p>
                </div>
            )}
        </div>
    );
}

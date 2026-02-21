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
        const activities = [
            ...(articlesResult.results || []),
            ...(animesResult.results || []),
        ].sort((a: any, b: any) => b.created_at - a.created_at);

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
        <div ref={containerRef} className="container mx-auto px-4 py-20">
            {/* 标题 */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
            >
                <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                    时光机
                </h1>
                <p className="text-slate-600 text-lg">像滚动卷轴一样展示你的数字人生</p>
            </motion.div>

            {/* 左右分栏时间轴 */}
            <div className="relative max-w-7xl mx-auto">
                {/* 中央时间线 */}
                <motion.div
                    style={{ y: timelineY }}
                    className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-500 via-purple-500 to-cyan-500 transform -translate-x-1/2 z-0"
                />

                {/* 内容区域 */}
                <div className="relative z-10">
                    {/* 合并所有活动并按时间排序 */}
                    {years.map((year, yearIdx) => {
                        const yearActivities = groupedByYear[year];
                        return yearActivities.map((activity: any, idx: number) => {
                            const isLeft = activity.type === "article";
                            const totalIdx = yearIdx * 100 + idx;

                            return (
                                <motion.div
                                    key={`${activity.type}-${activity.id}`}
                                    initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: totalIdx * 0.05 }}
                                    className={`relative mb-8 ${isLeft ? "pr-[52%] text-right" : "pl-[52%] text-left"}`}
                                >
                                    {/* 时间线圆点 */}
                                    <div className={`absolute top-4 ${isLeft ? "right-[48%]" : "left-[48%]"} w-4 h-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 border-4 border-white shadow-lg z-20`} />

                                    {/* 内容卡片 */}
                                    <GlassCard className={`p-6 hover:scale-[1.02] transition-transform ${isLeft ? "mr-8" : "ml-8"}`}>
                                        <div className={`flex items-start justify-between mb-2 ${isLeft ? "flex-row-reverse" : ""}`}>
                                            <div className={`flex items-center gap-2 ${isLeft ? "flex-row-reverse" : ""}`}>
                                                {activity.type === "article" ? (
                                                    <span className="text-2xl">📝</span>
                                                ) : (
                                                    <span className="text-2xl">🎬</span>
                                                )}
                                                <span className="text-xs text-slate-500 uppercase">
                                                    {activity.type === "article" ? "文章" : "番剧"}
                                                </span>
                                            </div>
                                            <span className="text-sm text-slate-400">{activity.formattedDate}</span>
                                        </div>

                                        {/* Cover Image */}
                                        {activity.cover_image && (
                                            <div className="mb-4 rounded-xl overflow-hidden aspect-[16/9] relative group">
                                                <OptimizedImage
                                                    src={activity.cover_image}
                                                    alt={activity.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    width={400}
                                                />
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                            </div>
                                        )}

                                        <h3 className={`text-xl font-bold mb-2 hover:text-pink-400 transition-colors ${isLeft ? "text-right" : "text-left"}`}>
                                            {activity.title}
                                        </h3>

                                        {activity.type === "article" && activity.description && (
                                            <p className={`text-sm text-slate-600 line-clamp-2 ${isLeft ? "text-right" : "text-left"}`}>
                                                {activity.description}
                                            </p>
                                        )}

                                        {activity.type === "anime" && activity.status && (
                                            <p className={`text-sm ${isLeft ? "text-right" : "text-left"}`}>
                                                <span className="text-slate-500">状态: </span>
                                                <span
                                                    className={
                                                        activity.status === "completed"
                                                            ? "text-green-400"
                                                            : activity.status === "watching"
                                                                ? "text-blue-400"
                                                                : activity.status === "plan"
                                                                    ? "text-purple-400"
                                                                    : "text-gray-400"
                                                    }
                                                >
                                                    {activity.status === "completed"
                                                        ? "看完了"
                                                        : activity.status === "watching"
                                                            ? "在追"
                                                            : activity.status === "plan"
                                                                ? "想看"
                                                                : "弃番"}
                                                </span>
                                            </p>
                                        )}

                                        {activity.category && (
                                            <div className={`mt-3 ${isLeft ? "text-right" : "text-left"}`}>
                                                <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                                                    {activity.category}
                                                </span>
                                            </div>
                                        )}
                                    </GlassCard>
                                </motion.div>
                            );
                        });
                    })}
                </div>
            </div>

            {years.length === 0 && (
                <div className="text-center text-slate-500 py-20">
                    <p className="text-xl">还没有任何活动记录</p>
                </div>
            )}
        </div>
    );
}

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { Route } from "./+types/archive";
import { GlassCard } from "~/components/ui/layout/GlassCard";

export async function loader({ context }: Route.LoaderArgs) {
    // 检查环境，避免在本地开发时出错
    if (!context.cloudflare || !context.cloudflare.env) {
        // 本地开发环境：返回模拟数据
        return {
            groupedByYear: {
                "2025": [
                    {
                        id: 1,
                        slug: "welcome-to-my-blog",
                        title: "欢迎来到我的动漫博客",
                        description: "这是我的第一篇博客文章，介绍了这个博客的功能和特色。",
                        category: "公告",
                        created_at: Math.floor(Date.now() / 1000),
                        type: "article",
                        formattedDate: new Date().toLocaleDateString("zh-CN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                        })
                    },
                    {
                        id: 2,
                        slug: "my-favorite-anime-2024",
                        title: "2024年我最喜爱的动漫推荐",
                        description: "分享我在2024年观看的一些优秀动漫作品，包括《进击的巨人》最终季、《鬼灭之刃》锻刀村篇等。",
                        category: "动漫推荐",
                        created_at: Math.floor(Date.now() / 1000) - 86400,
                        type: "article",
                        formattedDate: new Date(Date.now() - 86400).toLocaleDateString("zh-CN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                        })
                    },
                    {
                        id: 3,
                        slug: "how-to-draw-anime",
                        title: "如何绘制简单的动漫人物",
                        description: "分享一些绘制动漫人物的基础技巧，适合初学者学习。",
                        category: "绘画技巧",
                        created_at: Math.floor(Date.now() / 1000) - 172800,
                        type: "article",
                        formattedDate: new Date(Date.now() - 172800).toLocaleDateString("zh-CN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                        })
                    },
                    {
                        id: 4,
                        title: "进击的巨人",
                        status: "completed",
                        created_at: Math.floor(Date.now() / 1000) - 259200,
                        type: "anime",
                        formattedDate: new Date(Date.now() - 259200).toLocaleDateString("zh-CN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                        })
                    },
                    {
                        id: 5,
                        title: "鬼灭之刃",
                        status: "watching",
                        created_at: Math.floor(Date.now() / 1000) - 345600,
                        type: "anime",
                        formattedDate: new Date(Date.now() - 345600).toLocaleDateString("zh-CN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                        })
                    }
                ],
                "2024": [
                    {
                        id: 6,
                        slug: "spring-anime-2024",
                        title: "2024年春季新番推荐",
                        description: "推荐2024年春季值得观看的新番动画，包括各种类型。",
                        category: "动漫推荐",
                        created_at: Math.floor(Date.now() / 1000) - 31536000,
                        type: "article",
                        formattedDate: new Date(Date.now() - 31536000).toLocaleDateString("zh-CN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                        })
                    },
                    {
                        id: 7,
                        slug: "anime-music",
                        title: "那些让人印象深刻的动漫音乐",
                        description: "分享一些经典的动漫主题曲和背景音乐。",
                        category: "音乐分享",
                        created_at: Math.floor(Date.now() / 1000) - 32400000,
                        type: "article",
                        formattedDate: new Date(Date.now() - 32400000).toLocaleDateString("zh-CN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                        })
                    },
                    {
                        id: 8,
                        title: "原神",
                        status: "completed",
                        created_at: Math.floor(Date.now() / 1000) - 33264000,
                        type: "anime",
                        formattedDate: new Date(Date.now() - 33264000).toLocaleDateString("zh-CN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                        })
                    }
                ]
            }
        };
    }

    const { anime_db } = context.cloudflare.env;

    try {
        // 获取所有文章
        const articlesResult = await anime_db
            .prepare(
                `SELECT id, slug, title, description, category, created_at, 'article' as type
         FROM articles
         ORDER BY created_at DESC`
            )
            .all();

        // 获取所有番剧活动
        const animesResult = await anime_db
            .prepare(
                `SELECT id, title, status, created_at, 'anime' as type
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

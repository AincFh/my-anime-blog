import { Link, useLoaderData, Await } from "react-router";
import { motion } from "framer-motion";
import { GlassCard } from "~/components/layout/GlassCard";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import type { Route } from "./+types/bangumi.$id";
import { Suspense } from "react";

// 复制一份数据用于查找 (在实际项目中应该从数据库或共享模块获取)
const sampleAnimes = [
    { id: 1, bangumi_id: 296517, title: "葬送的芙莉莲", cover_url: "https://api.yimian.xyz/img?id=101", status: "watching", progress: "24/28", rating: 9.5, review: "平淡中见真章，这才是真正的神作。", created_at: 1704067200 },
    { id: 2, bangumi_id: 253046, title: "进击的巨人 最终季", cover_url: "https://api.yimian.xyz/img?id=102", status: "completed", progress: "完结", rating: 10, review: "献出心脏！跨越十年的史诗。", created_at: 1701388800 },
    { id: 3, bangumi_id: 314463, title: "间谍过家家", cover_url: "https://api.yimian.xyz/img?id=103", status: "watching", progress: "12/24", rating: 8.5, review: "哇库哇库！", created_at: 1696118400 },
    { id: 4, bangumi_id: 236819, title: "鬼灭之刃", cover_url: "https://api.yimian.xyz/img?id=104", status: "plan", progress: "0/26", rating: 0, review: "", created_at: 1680307200 },
    { id: 5, bangumi_id: 265, title: "新世纪福音战士", cover_url: "https://api.yimian.xyz/img?id=105", status: "completed", progress: "完结", rating: 10, review: "勇敢的少年啊，快去创造奇迹！", created_at: 1672531200 },
    { id: 6, bangumi_id: 253041, title: "咒术回战", cover_url: "https://api.yimian.xyz/img?id=106", status: "completed", progress: "完结", rating: 9.0, review: "领域展开！", created_at: 1698796800 },
    { id: 7, bangumi_id: 386809, title: "我推的孩子", cover_url: "https://api.yimian.xyz/img?id=107", status: "completed", progress: "完结", rating: 9.2, review: "偶像的谎言是爱。", created_at: 1681257600 },
    { id: 8, bangumi_id: 321885, title: "电锯人", cover_url: "https://api.yimian.xyz/img?id=108", status: "completed", progress: "完结", rating: 8.8, review: "好耶！", created_at: 1665446400 },
    { id: 9, bangumi_id: 332591, title: "孤独摇滚", cover_url: "https://api.yimian.xyz/img?id=109", status: "completed", progress: "完结", rating: 9.8, review: "社恐人的共鸣。", created_at: 1665187200 },
    { id: 10, bangumi_id: 309486, title: "边缘行者", cover_url: "https://api.yimian.xyz/img?id=110", status: "completed", progress: "完结", rating: 9.6, review: "赛博朋克的浪漫与悲剧。", created_at: 1663027200 },
    { id: 11, bangumi_id: 364450, title: "莉科丽丝", cover_url: "https://api.yimian.xyz/img?id=111", status: "dropped", progress: "8/13", rating: 6.5, review: "高开低走，可惜了。", created_at: 1656720000 },
    { id: 12, bangumi_id: 296620, title: "国王排名", cover_url: "https://api.yimian.xyz/img?id=112", status: "completed", progress: "完结", rating: 8.0, review: "波吉王子加油！", created_at: 1634256000 },
    { id: 13, bangumi_id: 302636, title: "86 -不存在的战区-", cover_url: "https://api.yimian.xyz/img?id=113", status: "plan", progress: "0/23", rating: 0, review: "", created_at: 1618099200 },
    { id: 14, bangumi_id: 292275, title: "无职转生", cover_url: "https://api.yimian.xyz/img?id=114", status: "watching", progress: "10/24", rating: 9.0, review: "异世界天花板。", created_at: 1610236800 },
    { id: 15, bangumi_id: 4933, title: "命运石之门", cover_url: "https://api.yimian.xyz/img?id=115", status: "completed", progress: "完结", rating: 10, review: "这一切都是命运石之门的选择。", created_at: 1301961600 },
    { id: 16, bangumi_id: 1386, title: "CLANNAD", cover_url: "https://api.yimian.xyz/img?id=116", status: "plan", progress: "0/48", rating: 0, review: "", created_at: 1191456000 },
];

interface BangumiSubject {
    id: number;
    name: string;
    name_cn: string;
    summary: string;
    date: string;
    images: {
        large: string;
        common: string;
        medium: string;
        small: string;
        grid: string;
    };
    rating: {
        total: number;
        count: { [key: string]: number };
        score: number;
        rank: number;
    };
    tags: Array<{
        name: string;
        count: number;
    }>;
}

interface BangumiCharacter {
    id: number;
    name: string;
    role_name: string;
    images?: {
        grid: string;
    };
    actors?: Array<{
        id: number;
        name: string;
    }>;
}

interface BangumiPerson {
    id: number;
    name: string;
    type: string;
    career: string[];
    images?: {
        grid: string;
    };
}

interface BangumiRelation {
    id: number;
    name: string;
    name_cn: string;
    type: string;
    relation: string;
    images?: {
        common: string;
        grid: string;
    };
}

interface BangumiFullData {
    subject: BangumiSubject;
    characters: BangumiCharacter[];
    persons: BangumiPerson[];
    relations: BangumiRelation[];
}

export async function loader({ params, context }: Route.LoaderArgs) {
    const id = Number(params.id);
    const localAnime = sampleAnimes.find((a: any) => a.id === id);

    if (!localAnime) {
        throw new Response("Not Found", { status: 404 });
    }

    // 暂时移除 defer，因为在某些环境下可能会报错
    // 这里的请求会阻塞渲染，后续需要优化
    let bangumiData: BangumiFullData | null = null;

    if (localAnime.bangumi_id) {
        const kv = (context as any).cloudflare?.env?.anime_kv;
        const cacheKey = `bangumi_v1:${localAnime.bangumi_id}`;
        let subject: BangumiSubject | null = null;
        let characters: BangumiCharacter[] = [];
        let persons: BangumiPerson[] = [];
        let relations: BangumiRelation[] = [];

        let cachedData: BangumiFullData | null = null;

        if (kv) {
            try {
                cachedData = await kv.get(cacheKey, 'json');
            } catch (e) {
                console.error('KV get error:', e);
            }
        }

        if (cachedData) {
            subject = cachedData.subject;
            characters = cachedData.characters;
            persons = cachedData.persons;
            relations = cachedData.relations;
        } else {
            try {
                const headers = { "User-Agent": "antigravity/anime-blog-demo" };
                const responses = await Promise.all([
                    fetch(`https://api.bgm.tv/v0/subjects/${localAnime.bangumi_id}`, { headers }),
                    fetch(`https://api.bgm.tv/v0/subjects/${localAnime.bangumi_id}/characters`, { headers }),
                    fetch(`https://api.bgm.tv/v0/subjects/${localAnime.bangumi_id}/persons`, { headers }),
                    fetch(`https://api.bgm.tv/v0/subjects/${localAnime.bangumi_id}/subjects`, { headers })
                ]);

                const results = await Promise.all(responses.map(async r => {
                    if (!r.ok) return null; // Handle 404 or errors gracefully
                    return r.json();
                }));

                subject = results[0] as BangumiSubject;
                characters = (results[1] || []) as BangumiCharacter[];
                persons = (results[2] || []) as BangumiPerson[];
                relations = (results[3] || []) as BangumiRelation[];

                if (kv && subject) {
                    await kv.put(cacheKey, JSON.stringify({
                        subject, characters, persons, relations
                    }), { expirationTtl: 3600 }); // Cache for 1 hour
                }
            } catch (error) {
                console.error("BGM API fetch failed:", error);
                // Fallback to empty/null, don't crash the page
            }
        }

        if (subject) {
            bangumiData = {
                subject: subject,
                characters: characters,
                persons: persons,
                relations: relations
            };
        }
    }

    return {
        localAnime,
        bangumiData,
    };
}

export default function BangumiDetail({ loaderData }: Route.ComponentProps) {
    const { localAnime, bangumiData } = loaderData;

    // 基础信息直接使用本地数据，实现秒开
    const title = localAnime.title;
    const cover = localAnime.cover_url;

    return (
        <div className="min-h-screen relative overflow-hidden -mt-20 md:-mt-24">
            {/* 背景大图 (模糊) */}
            <div className="absolute inset-0 -z-10">
                <OptimizedImage
                    src={cover}
                    alt=""
                    className="w-full h-full object-cover blur-3xl opacity-40 scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/50 to-transparent dark:from-slate-950 dark:via-slate-950/50 dark:to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent dark:from-black/20" />
            </div>

            <div className="container mx-auto px-4 py-12">
                {/* 返回按钮 */}
                <Link
                    to="/bangumi"
                    className="inline-flex items-center text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 mb-8 transition-colors group bg-white/30 dark:bg-black/30 backdrop-blur-md px-4 py-2 rounded-full"
                >
                    <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span>
                    返回番剧列表
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-12">
                    {/* 左侧：封面与评分 */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <GlassCard className="p-2 overflow-hidden rounded-xl border-white/40 dark:border-white/10 shadow-2xl">
                            <OptimizedImage
                                src={cover}
                                alt={title}
                                className="w-full h-auto rounded-lg shadow-inner"
                            />
                        </GlassCard>

                        {/* 评分卡片 - 异步加载 */}
                        <GlassCard className="p-6 text-center border-t-4 border-t-yellow-400 min-h-[140px] flex flex-col justify-center">
                            <Suspense fallback={<div className="animate-pulse flex flex-col items-center"><div className="h-4 w-20 bg-slate-200 rounded mb-2"></div><div className="h-10 w-16 bg-slate-200 rounded"></div></div>}>
                                <Await resolve={bangumiData} errorElement={<p className="text-red-500 text-sm">评分加载失败</p>}>
                                    {(data) => {
                                        const rating = data?.subject?.rating?.score || localAnime.rating;
                                        const rank = data?.subject?.rating?.rank;
                                        return (
                                            <>
                                                <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Bangumi 评分</h3>
                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                    <span className="text-5xl font-black text-slate-800 dark:text-white">{rating}</span>
                                                    <span className="text-xl text-slate-400">/ 10</span>
                                                </div>
                                                {rank && (
                                                    <div className="inline-block bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-mono text-slate-500">
                                                        Rank #{rank}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    }}
                                </Await>
                            </Suspense>
                        </GlassCard>

                        {/* 本地状态 */}
                        <GlassCard className="p-6">
                            <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-4">我的进度</h3>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-700 dark:text-slate-300 font-bold">状态</span>
                                <span className="capitalize px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-bold">{localAnime.status}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-700 dark:text-slate-300 font-bold">进度</span>
                                <span className="font-mono">{localAnime.progress}</span>
                            </div>
                        </GlassCard>
                    </motion.div>

                    {/* 右侧：详细信息 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2">{title}</h1>

                        <Suspense fallback={<div className="animate-pulse space-y-4 mt-8"><div className="h-8 w-1/3 bg-slate-200 rounded"></div><div className="h-32 bg-slate-200 rounded"></div></div>}>
                            <Await resolve={bangumiData}>
                                {(data: BangumiFullData | null) => (
                                    <>
                                        {data?.subject?.name && data.subject.name !== title && (
                                            <h2 className="text-xl text-slate-500 mb-6 font-light">{data.subject.name}</h2>
                                        )}

                                        {/* 标签云 */}
                                        <div className="flex flex-wrap gap-2 mb-8">
                                            {(data?.subject?.tags || []).slice(0, 8).map((tag: any) => (
                                                <span
                                                    key={tag.name}
                                                    className="px-3 py-1 bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-600 dark:text-slate-300"
                                                >
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>

                                        {/* 简介 */}
                                        <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
                                            <h3 className="text-2xl font-bold mb-4 border-l-4 border-blue-500 pl-4">剧情简介</h3>
                                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                                {data?.subject?.summary || "暂无简介"}
                                            </p>
                                        </div>

                                        {/* 角色列表 */}
                                        {data?.characters && data.characters.length > 0 && (
                                            <div className="mb-12">
                                                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                                    <span>👥</span> 登场角色
                                                </h3>
                                                <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                                                    {data.characters.map((char) => (
                                                        <div key={char.id} className="flex-shrink-0 w-32 group">
                                                            <div className="w-32 h-32 rounded-full overflow-hidden mb-2 border-2 border-white/20 shadow-md relative">
                                                                <OptimizedImage
                                                                    src={char.images?.grid || "https://bgm.tv/img/no_icon_subject.png"}
                                                                    alt={char.name}
                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                />
                                                            </div>
                                                            <p className="text-sm font-bold text-center truncate text-slate-800 dark:text-slate-200">{char.name}</p>
                                                            <p className="text-xs text-center truncate text-slate-500 dark:text-slate-400">{char.role_name}</p>
                                                            {char.actors && char.actors[0] && (
                                                                <p className="text-[10px] text-center truncate text-blue-500">CV: {char.actors[0].name}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 制作人员 */}
                                        {data?.persons && data.persons.length > 0 && (
                                            <div className="mb-12">
                                                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                                    <span>🎬</span> 制作团队
                                                </h3>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                    {data.persons.slice(0, 9).map((person) => (
                                                        <div key={person.id} className="flex items-center gap-3 bg-white/40 dark:bg-slate-800/40 p-2 rounded-lg backdrop-blur-sm">
                                                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 relative">
                                                                <OptimizedImage
                                                                    src={person.images?.grid || "https://bgm.tv/img/no_icon_subject.png"}
                                                                    alt={person.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <p className="text-sm font-bold truncate text-slate-800 dark:text-slate-200">{person.name}</p>
                                                                <p className="text-xs truncate text-slate-500 dark:text-slate-400">{person.type}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 关联条目 */}
                                        {data?.relations && data.relations.length > 0 && (
                                            <div className="mb-12">
                                                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                                    <span>🔗</span> 关联作品
                                                </h3>
                                                <div className="space-y-3">
                                                    {data.relations.map((rel) => (
                                                        <div key={rel.id} className="flex items-center justify-between p-3 bg-white/30 dark:bg-slate-800/30 rounded-xl border border-white/10 hover:bg-white/50 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <span className="px-2 py-1 bg-blue-500/10 text-blue-600 text-xs rounded font-bold">{rel.relation}</span>
                                                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{rel.name_cn || rel.name}</span>
                                                            </div>
                                                            <span className="text-xs text-slate-400">{rel.type}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 更多信息 */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-200 dark:border-slate-800">
                                            {data?.subject?.date && (
                                                <div>
                                                    <h4 className="text-sm text-slate-400 font-bold uppercase mb-1">放送日期</h4>
                                                    <p className="text-slate-800 dark:text-slate-200">{data.subject.date}</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </Await>
                        </Suspense>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

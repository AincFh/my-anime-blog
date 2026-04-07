import { Link, useLoaderData, Await } from "react-router";
import { motion } from "framer-motion";
import { GlassCard } from "../../components/layout/GlassCard";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import type { Route } from "./+types/bangumi.$id";
import { Suspense } from "react";

// 复制一份数据用于查找 (在实际项目中应该从数据库或共享模块获取)
const sampleAnimes = [
    { id: 1, bangumi_id: 296517, title: "葬送的芙莉莲", cover_url: "https://api.paugram.com/wallpaper/", status: "watching", progress: "24/28", rating: 9.5, review: "平淡中见真章，这才是真正的神作。", created_at: 1704067200 },
    { id: 2, bangumi_id: 253046, title: "进击的巨人 最终季", cover_url: "https://api.paugram.com/wallpaper/", status: "completed", progress: "完结", rating: 10, review: "献出心脏！跨越十年的史诗。", created_at: 1701388800 },
    { id: 3, bangumi_id: 314463, title: "间谍过家家", cover_url: "https://api.paugram.com/wallpaper/", status: "watching", progress: "12/24", rating: 8.5, review: "哇库哇库！", created_at: 1696118400 },
    { id: 4, bangumi_id: 236819, title: "鬼灭之刃", cover_url: "https://api.paugram.com/wallpaper/", status: "plan", progress: "0/26", rating: 0, review: "", created_at: 1680307200 },
    { id: 5, bangumi_id: 265, title: "新世纪福音战士", cover_url: "https://api.paugram.com/wallpaper/", status: "completed", progress: "完结", rating: 10, review: "勇敢的少年啊，快去创造奇迹！", created_at: 1672531200 },
    { id: 6, bangumi_id: 253041, title: "咒术回战", cover_url: "https://api.paugram.com/wallpaper/", status: "completed", progress: "完结", rating: 9.0, review: "领域展开！", created_at: 1698796800 },
    { id: 7, bangumi_id: 386809, title: "我推的孩子", cover_url: "https://api.paugram.com/wallpaper/", status: "completed", progress: "完结", rating: 9.2, review: "偶像的谎言是爱。", created_at: 1681257600 },
    { id: 8, bangumi_id: 321885, title: "电锯人", cover_url: "https://api.paugram.com/wallpaper/", status: "completed", progress: "完结", rating: 8.8, review: "好耶！", created_at: 1665446400 },
    { id: 9, bangumi_id: 332591, title: "孤独摇滚", cover_url: "https://api.paugram.com/wallpaper/", status: "completed", progress: "完结", rating: 9.8, review: "社恐人的共鸣。", created_at: 1665187200 },
    { id: 10, bangumi_id: 309486, title: "边缘行者", cover_url: "https://api.paugram.com/wallpaper/", status: "completed", progress: "完结", rating: 9.6, review: "赛博朋克的浪漫与悲剧。", created_at: 1663027200 },
    { id: 11, bangumi_id: 364450, title: "莉科丽丝", cover_url: "https://api.paugram.com/wallpaper/", status: "dropped", progress: "8/13", rating: 6.5, review: "高开低走，可惜了。", created_at: 1656720000 },
    { id: 12, bangumi_id: 296620, title: "国王排名", cover_url: "https://api.paugram.com/wallpaper/", status: "completed", progress: "完结", rating: 8.0, review: "波吉王子加油！", created_at: 1634256000 },
    { id: 13, bangumi_id: 302636, title: "86 -不存在的战区-", cover_url: "https://api.paugram.com/wallpaper/", status: "plan", progress: "0/23", rating: 0, review: "", created_at: 1618099200 },
    { id: 14, bangumi_id: 292275, title: "无职转生", cover_url: "https://api.paugram.com/wallpaper/", status: "watching", progress: "10/24", rating: 9.0, review: "异世界天花板。", created_at: 1610236800 },
    { id: 15, bangumi_id: 4933, title: "命运石之门", cover_url: "https://api.paugram.com/wallpaper/", status: "completed", progress: "完结", rating: 10, review: "这一切都是命运石之门的选择。", created_at: 1301961600 },
    { id: 16, bangumi_id: 1386, title: "CLANNAD", cover_url: "https://api.paugram.com/wallpaper/", status: "plan", progress: "0/48", rating: 0, review: "", created_at: 1191456000 },
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
            {/* 深邃质感背景模糊层 */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
                <OptimizedImage
                    src={cover}
                    alt=""
                    className="w-full h-full object-cover blur-[100px] opacity-30 md:opacity-20 scale-125 saturate-150"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent dark:from-[#0A0A0A] dark:via-[#0A0A0A]/80 dark:to-transparent" />
                <div className="absolute inset-0 bg-white/20 dark:bg-black/40 backdrop-blur-[2px]" />
            </div>

            <div className="container max-w-7xl mx-auto px-5 sm:px-8 py-24 md:py-32">
                {/* 极简返回栏 */}
                <Link
                    to="/bangumi"
                    className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-12"
                >
                    <span className="text-lg leading-none mt-[-2px] tracking-tighter">←</span>
                    Bangumi
                </Link>

                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
                    {/* 左侧：封面与评分中枢 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full lg:w-[320px] flex-shrink-0 space-y-6"
                    >
                        {/* 震撼海报 */}
                        <div className="relative aspect-[3/4] rounded-[32px] overflow-hidden shadow-2xl shadow-indigo-500/10 dark:shadow-white/5 ring-1 ring-slate-200 dark:ring-white/10">
                            <OptimizedImage
                                src={cover}
                                alt={title}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* HIG 极简评分台 */}
                        <div className="bg-slate-50/80 dark:bg-[#151515]/80 backdrop-blur-xl rounded-[24px] p-6 text-center border border-slate-200/50 dark:border-white/5 content-center min-h-[140px]">
                            <Suspense fallback={<div className="animate-pulse space-y-3 flex flex-col items-center"><div className="h-3 w-16 bg-slate-300 dark:bg-slate-700 rounded-full"></div><div className="h-10 w-24 bg-slate-300 dark:bg-slate-700 rounded-lg"></div></div>}>
                                <Await resolve={bangumiData} errorElement={<p className="text-red-500 text-sm font-medium">评分加载失败</p>}>
                                    {(data) => {
                                        const rating = data?.subject?.rating?.score || localAnime.rating;
                                        const rank = data?.subject?.rating?.rank;
                                        return (
                                            <>
                                                <h3 className="text-[11px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-3">
                                                    Bangumi Rating
                                                </h3>
                                                <div className="flex items-baseline justify-center gap-1 mb-3">
                                                    <span className="text-[48px] leading-none font-black text-slate-900 dark:text-white tracking-tighter">{rating}</span>
                                                    <span className="text-[18px] font-bold text-slate-400">/ 10</span>
                                                </div>
                                                {rank && (
                                                    <div className="inline-block bg-slate-200/50 dark:bg-white/10 px-3 py-1.5 rounded-full text-[12px] font-bold tracking-tight text-slate-700 dark:text-slate-300">
                                                        Rank #{rank}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    }}
                                </Await>
                            </Suspense>
                        </div>

                        {/* 状态与进度台 */}
                        <div className="bg-slate-50/80 dark:bg-[#151515]/80 backdrop-blur-xl rounded-[24px] p-6 border border-slate-200/50 dark:border-white/5">
                            <h3 className="text-[11px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-4">
                                My Status
                            </h3>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[14px] text-slate-600 dark:text-slate-400 font-semibold">Status</span>
                                <span className="capitalize px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-[12px] font-black tracking-wide">
                                    {localAnime.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[14px] text-slate-600 dark:text-slate-400 font-semibold">Progress</span>
                                <span className="text-[15px] font-mono font-bold text-slate-900 dark:text-white tracking-tight">{localAnime.progress}</span>
                            </div>
                        </div>

                        {/* 个人评价台 */}
                        {(localAnime.rating > 0 || localAnime.review) && (
                            <div className="bg-slate-50/80 dark:bg-[#151515]/80 backdrop-blur-xl rounded-[24px] p-6 border border-slate-200/50 dark:border-white/5">
                                <h3 className="text-[11px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-5">
                                    My Review
                                </h3>
                                {localAnime.rating > 0 && (
                                    <div className="flex items-center gap-1.5 mb-5">
                                        {Array.from({ length: 5 }).map((_, i) => {
                                            const filled = localAnime.rating / 2;
                                            return (
                                                <svg key={i} className={`w-5 h-5 ${i < Math.floor(filled) ? 'text-amber-500' : i < filled ? 'text-amber-500/50' : 'text-slate-200 dark:text-slate-700'}`} fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            );
                                        })}
                                        <span className="ml-2 pl-2 border-l border-slate-200 dark:border-slate-700 text-[16px] font-black text-slate-900 dark:text-white">{localAnime.rating}</span>
                                    </div>
                                )}
                                {localAnime.review && (
                                    <blockquote className="relative">
                                        <span className="absolute -top-3 -left-3 text-4xl text-slate-200 dark:text-white/10 font-serif">"</span>
                                        <p className="relative text-[14px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed z-10">
                                            {localAnime.review}
                                        </p>
                                    </blockquote>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* 右侧：纵深元数据与图谱 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-1"
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-2 tracking-tight text-pretty">
                            {title}
                        </h1>

                        <Suspense fallback={<div className="animate-pulse space-y-4 mt-12"><div className="h-10 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-xl"></div><div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div></div>}>
                            <Await resolve={bangumiData}>
                                {(data: BangumiFullData | null) => (
                                    <div className="mt-4">
                                        {data?.subject?.name && data.subject.name !== title && (
                                            <h2 className="text-[18px] text-slate-500 dark:text-slate-400 font-medium mb-8">
                                                {data.subject.name}
                                            </h2>
                                        )}

                                        {/* 元标签阵列 */}
                                        <div className="flex flex-wrap gap-2.5 mb-12">
                                            {(data?.subject?.tags || []).slice(0, 8).map((tag: any) => (
                                                <span
                                                    key={tag.name}
                                                    className="px-4 py-2 bg-slate-100 dark:bg-[#151515] hover:bg-slate-200 dark:hover:bg-[#222] rounded-full text-[13px] font-bold tracking-tight text-slate-600 dark:text-slate-300 transition-colors cursor-default"
                                                >
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>

                                        {/* 大段落简介区域 */}
                                        <div className="mb-16">
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-6">Synopsis</h3>
                                            <p className="text-[16px] md:text-[18px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-6xl text-pretty font-medium opacity-90">
                                                {data?.subject?.summary || "No synopsis available."}
                                            </p>
                                        </div>

                                        {/* 沉浸式横轴：人物卡 */}
                                        {data?.characters && data.characters.length > 0 && (
                                            <div className="mb-16">
                                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-8">Characters</h3>
                                                <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide -mx-5 px-5 sm:mx-0 sm:px-0">
                                                    {data.characters.map((char) => (
                                                        <div key={char.id} className="flex-shrink-0 w-[120px] group flex flex-col items-center">
                                                            <div className="w-[100px] h-[100px] rounded-full overflow-hidden mb-4 shadow-xl dark:shadow-white/5 ring-1 ring-slate-100 dark:ring-white/10 relative">
                                                                <OptimizedImage
                                                                    src={char.images?.grid || "https://bgm.tv/img/no_icon_subject.png"}
                                                                    alt={char.name}
                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                                                />
                                                            </div>
                                                            <p className="text-[14px] font-bold text-center w-full truncate text-slate-900 dark:text-white tracking-tight">{char.name}</p>
                                                            <p className="text-[12px] text-center w-full truncate text-slate-500 font-medium mb-0.5">{char.role_name}</p>
                                                            {char.actors && char.actors[0] && (
                                                                <p className="text-[11px] text-center w-full truncate text-indigo-500 dark:text-indigo-400 font-bold tracking-tight">
                                                                    {char.actors[0].name}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 模块化矩阵：幕后制作团队 */}
                                        {data?.persons && data.persons.length > 0 && (
                                            <div className="mb-16">
                                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-8">Staff</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                                    {data.persons.slice(0, 9).map((person) => (
                                                        <div key={person.id} className="flex items-center gap-4 bg-slate-50/80 dark:bg-[#151515] p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                                                            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-800">
                                                                <OptimizedImage
                                                                    src={person.images?.grid || "https://bgm.tv/img/no_icon_subject.png"}
                                                                    alt={person.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="overflow-hidden flex-1">
                                                                <p className="text-[14px] font-bold truncate text-slate-900 dark:text-white tracking-tight">{person.name}</p>
                                                                <p className="text-[12px] font-medium truncate text-slate-500">{person.type}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 列表：关联矩阵 */}
                                        {data?.relations && data.relations.length > 0 && (
                                            <div className="mb-16">
                                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-6">Relations</h3>
                                                <div className="flex flex-col gap-3">
                                                    {data.relations.map((rel) => (
                                                        <div key={rel.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-[#151515] rounded-2xl border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-[#1A1A1A] transition-colors gap-3">
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                                                <span className="w-fit px-3 py-1 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[11px] rounded-md font-black uppercase tracking-widest whitespace-nowrap">
                                                                    {rel.relation}
                                                                </span>
                                                                <span className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">{rel.name_cn || rel.name}</span>
                                                            </div>
                                                            <span className="text-[13px] font-medium text-slate-500 whitespace-nowrap">{rel.type}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 附加参数 */}
                                        <div className="pt-8 border-t border-slate-100 dark:border-white/5 flex gap-12">
                                            {data?.subject?.date && (
                                                <div>
                                                    <h4 className="text-[11px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2">Aired Date</h4>
                                                    <p className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">{data.subject.date}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Await>
                        </Suspense>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

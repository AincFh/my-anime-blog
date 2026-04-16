import { Link, useLoaderData, Await } from "react-router";
import { motion } from "framer-motion";
import { GlassCard } from "../../components/layout/GlassCard";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import type { Route } from "./+types/bangumi.$id";
import { Suspense, useState } from "react";
import { FloatingSubNav } from "~/components/layout/FloatingSubNav";
import { cn } from "~/utils/cn";

// 删除硬编码的假数据，改为从数据库读取

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
    
    if (isNaN(id) || id <= 0) {
        throw new Response("Invalid ID", { status: 400 });
    }
    
    const { anime_db } = (context as any).cloudflare?.env || {};
    if (!anime_db) {
        throw new Response("Database not configured", { status: 500 });
    }
    
    // 从数据库查询用户的番剧记录
    const { getSessionId, verifySession } = await import("~/utils/auth");
    const sessionId = getSessionId(context?.request || new Request(""));
    let userId: number | null = null;
    
    if (sessionId) {
        const session = await verifySession(sessionId, anime_db);
        if (session?.user) {
            userId = session.user.id;
        }
    }
    
    // 查询该番剧记录（包含 bangumi_id）
    const stmt = anime_db
        .prepare("SELECT * FROM animes WHERE id = ?")
        .bind(id);
    
    // 尝试获取用户自己的记录，或任意用户的记录用于公开浏览
    const localAnime = userId !== null
        ? await stmt.first()
        : await anime_db.prepare("SELECT * FROM animes WHERE id = ?").bind(id).first();
    
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
    const [animeStatus, setAnimeStatus] = useState(localAnime.status);

    // 基础信息直接使用本地数据，实现秒开
    const title = localAnime.title;
    const cover = localAnime.cover_url;

    const statusConfig: Record<string, { label: string; color: string }> = {
        watching: { label: '在看', color: 'bg-emerald-500/20 text-emerald-500' },
        completed: { label: '看过', color: 'bg-blue-500/20 text-blue-500' },
        plan: { label: '想看', color: 'bg-purple-500/20 text-purple-500' },
        dropped: { label: '抛弃', color: 'bg-red-500/20 text-red-500' },
    };

    return (
        <div className="min-h-screen relative overflow-hidden -mt-20 md:-mt-24">
            {/* 灵动岛导航 */}
            <FloatingSubNav
                title={title}
                backUrl="/bangumi"
                rightContent={
                    <select
                        value={animeStatus}
                        onChange={(e) => setAnimeStatus(e.target.value as any)}
                        className={cn(
                            'px-3 py-1.5 rounded-full text-[12px] font-bold border-none outline-none cursor-pointer transition-all',
                            statusConfig[animeStatus]?.color
                        )}
                    >
                        <option value="watching">在看</option>
                        <option value="completed">看过</option>
                        <option value="plan">想看</option>
                        <option value="dropped">抛弃</option>
                    </select>
                }
            />

            {/* 顶部留白（适配灵动岛导航） */}
            <div className="h-14" />

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

            <div className="container max-w-7xl mx-auto px-5 sm:px-8 pt-8 md:pt-12">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
                    {/* 左侧：封面与评分中枢 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full lg:w-[320px] flex-shrink-0 space-y-6"
                    >
                        {/* 震撼海报 */}
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/10 dark:shadow-white/5 ring-1 ring-slate-200 dark:ring-white/10">
                            <OptimizedImage
                                src={cover}
                                alt={title}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* HIG 极简评分台 */}
                        <div className="bg-slate-50/80 dark:bg-[#151515]/80 backdrop-blur-xl rounded-xl p-6 text-center border border-slate-200/50 dark:border-white/5 content-center min-h-[140px]">
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
                        <div className="bg-slate-50/80 dark:bg-[#151515]/80 backdrop-blur-xl rounded-xl p-6 border border-slate-200/50 dark:border-white/5">
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
                            <div className="bg-slate-50/80 dark:bg-[#151515]/80 backdrop-blur-xl rounded-xl p-6 border border-slate-200/50 dark:border-white/5">
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

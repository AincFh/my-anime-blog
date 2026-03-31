import { motion } from "framer-motion";
import { useLoaderData, useNavigate } from "react-router";
import { HexagonBadge } from "~/components/gamification/HexagonBadge";
import { GameDashboardLayout } from "~/components/dashboard/game/GameDashboardLayout";
import { StatusHUD } from "~/components/dashboard/game/StatusHUD";
import { NavMenu } from "~/components/dashboard/game/NavMenu";
import { ClientOnly } from "~/components/common/ClientOnly";
import { cn } from "~/utils/cn";
import { getSessionToken, verifySession } from "~/services/auth.server";
import { getUserCoins } from "~/services/membership/coins.server";
import type { Route } from "./+types/user.achievements";

// Mock Achievement Data (Should be shared with AchievementSystem.tsx ideally)
const ALL_ACHIEVEMENTS = [
    {
        id: "night_owl",
        name: "夜之守望者",
        description: "在凌晨 2:00 - 4:00 期间访问网站",
        icon: "🌙",
        category: "time",
    },
    {
        id: "early_bird",
        name: "早安少女/少年",
        description: "在早上 5:00 - 7:00 期间访问",
        icon: "☕",
        category: "time",
    },
    {
        id: "combo_master",
        name: "连击大师",
        description: "在单篇文章点赞连击超过 50 次",
        icon: "⚡",
        category: "interaction",
    },
    {
        id: "first_contact",
        name: "契约缔结者",
        description: "发表第一条评论",
        icon: "🗣️",
        category: "interaction",
    },
    {
        id: "observer",
        name: "观测者",
        description: "累计阅读文章超过 10 篇",
        icon: "🔍",
        category: "interaction",
    },
    {
        id: "schrodinger_cat",
        name: "薛定谔的猫",
        description: "连续刷新 404 页面 5 次",
        icon: "🐱",
        category: "hidden",
    },
    {
        id: "pixel_hunter",
        name: "像素猎人",
        description: "找到并点击 1x1 像素的隐藏按钮",
        icon: "🖱️",
        category: "hidden",
    },
];

export async function loader({ request, context }: Route.LoaderArgs) {
    const { anime_db } = context.cloudflare.env;
    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return { loggedIn: false, unlockedIds: [], user: null, stats: { coins: 0 } };
    }

    const coins = await getUserCoins(anime_db, user.id);
    const unlockedIds: string[] = user.achievements ? JSON.parse(user.achievements) : [];

    return {
        loggedIn: true,
        unlockedIds,
        user: {
            ...user,
            avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
        },
        stats: {
            coins,
            level: user.level ?? 1,
            exp: user.exp ?? 0,
            maxExp: (user.level ?? 1) * 100,
        }
    };
}

export default function UserAchievements({ loaderData }: Route.ComponentProps) {
    const { loggedIn, unlockedIds, user, stats } = loaderData;
    const navigate = useNavigate();

    if (!loggedIn) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">ACCESS DENIED</h1>
                    <button onClick={() => navigate("/login")} className="mt-4 px-6 py-2 bg-primary-500 rounded-full">登录</button>
                </div>
            </div>
        );
    }

    // Calculate stats
    const total = ALL_ACHIEVEMENTS.length;
    const unlocked = unlockedIds.length;
    const progress = Math.round((unlocked / total) * 100);

    const userData = {
        avatar: user?.avatar_url,
        uid: user ? `UID-${user.id.toString().padStart(6, '0')}` : "UID-000000",
        level: stats.level ?? 0,
        name: user?.username || "Traveler",
        exp: stats.exp ?? 0,
        maxExp: stats.maxExp ?? 0,
    };

    return (
        <>
            <ClientOnly>
                {() => <>
                    <StatusHUD user={userData} stats={{ coins: stats.coins }} />
                    <div className="fixed inset-0 z-[-1] bg-black/20 backdrop-blur-3xl" />
                </>}
            </ClientOnly>
            <NavMenu />

            <div className="w-full h-screen overflow-y-auto pt-[calc(env(safe-area-inset-top)+6.5rem)] md:pt-[calc(env(safe-area-inset-top)+7.5rem)] pb-24 px-4 md:px-12 flex flex-col items-center scroll-smooth">
                {/* Header Section */}
                <div className="w-full max-w-6xl flex flex-col md:flex-row items-center md:items-end justify-between gap-6 mb-16 px-4">
                    <div className="flex-1 text-center md:text-left">
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl md:text-6xl font-display font-black text-white tracking-tight"
                        >
                            TROPHY <span className="text-yellow-400">ROOM</span>
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center justify-center md:justify-start gap-4 mt-2"
                        >
                            <span className="text-white/40 text-[10px] font-mono tracking-widest uppercase">Synchronization Index</span>
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`w-3 h-1 rounded-full ${i < Math.floor(progress / 20) ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'bg-white/10'}`} />
                                ))}
                            </div>
                            <span className="text-yellow-400 text-xs font-bold font-mono">{progress}%</span>
                        </motion.div>
                    </div>

                    <div className="flex gap-4">
                        <div className="px-5 py-2.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col items-center min-w-[80px]">
                            <span className="text-[10px] text-white/40 uppercase font-mono">Rank</span>
                            <span className="text-xl font-black text-white">#{loaderData.stats.level}</span>
                        </div>
                        <div className="px-5 py-2.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col items-center min-w-[80px]">
                            <span className="text-[10px] text-white/40 uppercase font-mono">Vault</span>
                            <span className="text-xl font-black text-yellow-400">{unlocked}</span>
                        </div>
                    </div>
                </div>

                {/* Medallion Wall (The Honeycomb Wall) */}
                <div className="w-full max-w-6xl pb-24">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-12 gap-x-4 px-4">
                        {ALL_ACHIEVEMENTS.map((achievement, index) => {
                            const isUnlocked = (unlockedIds as string[]).includes(achievement.id);
                            return (
                                <motion.div
                                    key={achievement.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={cn(
                                        "flex flex-col items-center perspective-1000",
                                        index % 2 === 1 ? "md:mt-12" : "" // Staggered layout
                                    )}
                                >
                                    <div className={cn(
                                        "transition-all duration-700",
                                        !isUnlocked ? "grayscale brightness-50 opacity-40 hover:grayscale-0 hover:brightness-100 hover:opacity-100" : ""
                                    )}>
                                        <HexagonBadge
                                            {...achievement}
                                            isUnlocked={isUnlocked}
                                            size="lg"
                                        />
                                    </div>
                                    
                                    {/* Achievement Label */}
                                    <div className="mt-4 text-center">
                                        <p className={cn(
                                            "text-sm font-bold tracking-tight transition-colors",
                                            isUnlocked ? "text-white" : "text-white/20"
                                        )}>
                                            {achievement.name}
                                        </p>
                                        <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5 font-mono">
                                            {achievement.category}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Footer Stats - Centered Glass Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-card p-10 max-w-2xl w-full mx-auto text-center bg-white/[0.03] border border-white/10 backdrop-blur-2xl rounded-[32px] mt-24 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(white,transparent_85%)]" />
                        <div className="grid grid-cols-3 gap-8 relative z-10">
                            <div className="space-y-1">
                                <div className="text-3xl font-display font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">{unlocked}</div>
                                <div className="text-[10px] text-white/30 uppercase tracking-widest font-mono">Unlocked</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-3xl font-display font-black text-white">{total}</div>
                                <div className="text-[10px] text-white/30 uppercase tracking-widest font-mono">Archive</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-3xl font-display font-black text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                    {unlockedIds.filter(id => ALL_ACHIEVEMENTS.find(a => a.id === id)?.category === 'hidden').length}
                                </div>
                                <div className="text-[10px] text-white/30 uppercase tracking-widest font-mono">Classified</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}

export function ErrorBoundary({ error }: { error: Error }) {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
            <div className="text-center p-8 bg-red-900/20 border border-red-500/50 rounded-2xl max-w-md">
                <h1 className="text-2xl font-bold mb-4 text-red-500">SYSTEM ERROR</h1>
                <p className="text-white/80 mb-4">无法加载成就数据。</p>
                <div className="bg-black/50 p-4 rounded text-left text-xs font-mono text-red-300 overflow-auto max-h-32 mb-6">
                    {error instanceof Error ? error.message : "Unknown Error"}
                </div>
                <a href="/user/dashboard" className="px-6 py-2 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-200 transition-colors">
                    返回指挥中心
                </a>
            </div>
        </div>
    );
}

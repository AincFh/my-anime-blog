import { motion } from "framer-motion";
import { useLoaderData, useNavigate } from "react-router";
import { HexagonBadge } from "~/components/gamification/HexagonBadge";
import { GameDashboardLayout } from "~/components/dashboard/game/GameDashboardLayout";
import { StatusHUD } from "~/components/dashboard/game/StatusHUD";
import { NavMenu } from "~/components/dashboard/game/NavMenu";
import { ClientOnly } from "~/components/common/ClientOnly";
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
                {() => <StatusHUD user={userData} stats={{ coins: stats.coins }} />}
            </ClientOnly>
            <NavMenu />

            <div className="absolute inset-0 flex items-center justify-center pl-24 pr-8 pt-24 pb-8 pointer-events-none">
                <div className="w-full h-full max-w-6xl pointer-events-auto overflow-y-auto custom-scrollbar flex flex-col items-center">
                    {/* Header */}
                    <div className="text-center mb-12 w-full">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-4 drop-shadow-lg"
                        >
                            TROPHY ROOM
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-white/60 font-display tracking-widest uppercase"
                        >
                            Sync Rate: {progress}% // Level {user?.level || 1}
                        </motion.p>
                    </div>

                    {/* Honeycomb Grid Container */}
                    <div className="flex-1 w-full flex items-center justify-center min-h-[400px]">
                        <div className="flex flex-wrap justify-center gap-4 md:gap-8 max-w-5xl mx-auto pb-12 px-4">
                            {ALL_ACHIEVEMENTS.map((achievement, index) => (
                                <motion.div
                                    key={achievement.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={index % 2 === 1 ? "md:mt-16" : ""} // Staggered layout for honeycomb effect
                                >
                                    <HexagonBadge
                                        {...achievement}
                                        isUnlocked={(unlockedIds as string[]).includes(achievement.id)}
                                        size="md"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="glass-card p-8 max-w-2xl w-full mx-auto text-center bg-black/40 border border-white/10 backdrop-blur-md rounded-2xl mt-8"
                    >
                        <div className="grid grid-cols-3 gap-8">
                            <div>
                                <div className="text-3xl font-display font-bold text-yellow-500">{unlocked}</div>
                                <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Unlocked</div>
                            </div>
                            <div>
                                <div className="text-3xl font-display font-bold text-purple-500">{total}</div>
                                <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Total</div>
                            </div>
                            <div>
                                <div className="text-3xl font-display font-bold text-red-500">
                                    {unlockedIds.filter(id => ALL_ACHIEVEMENTS.find(a => a.id === id)?.category === 'hidden').length}
                                </div>
                                <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Secrets Found</div>
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

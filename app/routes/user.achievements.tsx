import { motion } from "framer-motion";
import { useLoaderData } from "react-router";
import { HexagonBadge } from "~/components/gamification/HexagonBadge";
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

export async function loader({ context }: Route.LoaderArgs) {
    // Mock user ID for now, in real app get from session
    const userId = 1;

    try {
        const { anime_db } = (context as any).cloudflare.env;
        const user = await anime_db
            .prepare("SELECT achievements, username, avatar_url, level FROM users WHERE id = ?")
            .bind(userId)
            .first<{ achievements: string | null, username: string, avatar_url: string, level: number }>();

        if (!user) {
            return { unlockedIds: [], user: null };
        }

        const unlockedIds: string[] = user.achievements ? JSON.parse(user.achievements) : [];
        return { unlockedIds, user };
    } catch (error) {
        console.error("Failed to load achievements:", error);
        return { unlockedIds: [], user: null };
    }
}

export default function UserAchievements({ loaderData }: Route.ComponentProps) {
    const { unlockedIds, user } = loaderData;

    // Calculate stats
    const total = ALL_ACHIEVEMENTS.length;
    const unlocked = unlockedIds.length;
    const progress = Math.round((unlocked / total) * 100);

    return (
        <div className="min-h-screen pb-12 px-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/patterns/hex-grid.svg')] opacity-5 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-at-purple/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto max-w-5xl relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-at-orange via-at-red to-at-purple mb-4"
                    >
                        TROPHY ROOM
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-500 font-display tracking-widest uppercase"
                    >
                        Sync Rate: {progress}% // Level {user?.level || 1}
                    </motion.p>
                </div>

                {/* Honeycomb Grid */}
                <div className="flex flex-wrap justify-center gap-4 md:gap-8 max-w-4xl mx-auto">
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
                                isUnlocked={unlockedIds.includes(achievement.id)}
                                size="md"
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Footer Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-20 glass-card p-8 max-w-2xl mx-auto text-center"
                >
                    <div className="grid grid-cols-3 gap-8">
                        <div>
                            <div className="text-3xl font-display font-bold text-at-orange">{unlocked}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Unlocked</div>
                        </div>
                        <div>
                            <div className="text-3xl font-display font-bold text-at-purple">{total}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Total</div>
                        </div>
                        <div>
                            <div className="text-3xl font-display font-bold text-at-red">
                                {unlockedIds.filter(id => ALL_ACHIEVEMENTS.find(a => a.id === id)?.category === 'hidden').length}
                            </div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Secrets Found</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

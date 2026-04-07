import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    unlocked: boolean;
    unlockedAt?: number;
}

interface InventoryItem {
    id: string;
    name: string;
    type: "sticker" | "wallpaper" | "badge";
    image: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    obtainedAt: number;
}

interface UserStats {
    level: number;
    exp: number;
    maxExp: number;
    coins: number;
    mood?: string;
}

interface GamificationContextType {
    stats: UserStats;
    achievements: Achievement[];
    inventory: InventoryItem[];
    addExp: (amount: number) => void;
    addCoins: (amount: number) => void;
    spendCoins: (amount: number) => boolean;
    unlockAchievement: (achievementId: string) => void;
    addToInventory: (item: InventoryItem) => void;
    setMood: (mood: string) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

const DEFAULT_STATS: UserStats = { level: 1, exp: 0, maxExp: 100, coins: 500, mood: "neutral" };

const INITIAL_ACHIEVEMENTS: Achievement[] = [
    {
        id: "first_visit",
        name: "初次到访",
        description: "欢迎来到 A.T. Field！",
        icon: "sparkles",
        rarity: "common",
        unlocked: false,
    },
    {
        id: "first_read",
        name: "博览群书",
        description: "阅读了第一篇文章",
        icon: "book",
        rarity: "common",
        unlocked: false,
    },
    {
        id: "gacha_master",
        name: "扭蛋大师",
        description: "进行了首次扭蛋",
        icon: "gift",
        rarity: "rare",
        unlocked: false,
    },
    {
        id: "level_10",
        name: "资深旅人",
        description: "达到等级 10",
        icon: "star",
        rarity: "epic",
        unlocked: false,
    },
];

export function GamificationProvider({ children }: { children: ReactNode }) {
    // 使用固定初始值，避免 SSR/CSR 不匹配
    const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
    const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // 客户端加载后从 localStorage 恢复数据
    useEffect(() => {
        const savedStats = localStorage.getItem("gamification_stats");
        const savedAchievements = localStorage.getItem("gamification_achievements");
        const savedInventory = localStorage.getItem("gamification_inventory");

        if (savedStats) {
            try {
                setStats(JSON.parse(savedStats));
            } catch (e) {
                console.warn('[Gamification] 恢复 stats 失败，使用默认:', e);
            }
        }
        if (savedAchievements) {
            try {
                setAchievements(JSON.parse(savedAchievements));
            } catch (e) {
                console.warn('[Gamification] 恢复 achievements 失败，使用默认:', e);
            }
        }
        if (savedInventory) {
            try {
                setInventory(JSON.parse(savedInventory));
            } catch (e) {
                console.warn('[Gamification] 恢复 inventory 失败，使用默认:', e);
            }
        }
        setIsHydrated(true);
    }, []);

    // 持久化到 localStorage
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem("gamification_stats", JSON.stringify(stats));
        }
    }, [stats, isHydrated]);

    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem("gamification_achievements", JSON.stringify(achievements));
        }
    }, [achievements, isHydrated]);

    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem("gamification_inventory", JSON.stringify(inventory));
        }
    }, [inventory, isHydrated]);

    const addExp = (amount: number) => {
        setStats((prev) => {
            let newExp = prev.exp + amount;
            let newLevel = prev.level;
            let newMaxExp = prev.maxExp;

            while (newExp >= newMaxExp) {
                newExp -= newMaxExp;
                newLevel += 1;
                newMaxExp = Math.floor(newMaxExp * 1.5);
            }

            return { ...prev, exp: newExp, level: newLevel, maxExp: newMaxExp };
        });
    };

    const addCoins = (amount: number) => {
        setStats((prev) => ({ ...prev, coins: prev.coins + amount }));
    };

    const spendCoins = (amount: number): boolean => {
        if (stats.coins >= amount) {
            setStats((prev) => ({ ...prev, coins: prev.coins - amount }));
            return true;
        }
        return false;
    };

    const unlockAchievement = (achievementId: string) => {
        setAchievements((prev) =>
            prev.map((achievement) =>
                achievement.id === achievementId && !achievement.unlocked
                    ? { ...achievement, unlocked: true, unlockedAt: Date.now() }
                    : achievement
            )
        );
    };

    const addToInventory = (item: InventoryItem) => {
        setInventory((prev) => [...prev, item]);
    };

    const setMood = (mood: string) => {
        setStats((prev) => ({ ...prev, mood }));
    };

    return (
        <GamificationContext.Provider
            value={{
                stats,
                achievements,
                inventory,
                addExp,
                addCoins,
                spendCoins,
                unlockAchievement,
                addToInventory,
                setMood,
            }}
        >
            {children}
        </GamificationContext.Provider>
    );
}

export function useGamification() {
    const context = useContext(GamificationContext);
    if (!context) {
        throw new Error("useGamification must be used within GamificationProvider");
    }
    return context;
}

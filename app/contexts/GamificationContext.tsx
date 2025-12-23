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

const INITIAL_ACHIEVEMENTS: Achievement[] = [
    {
        id: "first_visit",
        name: "初次到访",
        description: "欢迎来到 A.T. Field！",
        icon: "🎉",
        rarity: "common",
        unlocked: false,
    },
    {
        id: "first_read",
        name: "博览群书",
        description: "阅读了第一篇文章",
        icon: "📖",
        rarity: "common",
        unlocked: false,
    },
    {
        id: "gacha_master",
        name: "扭蛋大师",
        description: "进行了首次扭蛋",
        icon: "🎰",
        rarity: "rare",
        unlocked: false,
    },
    {
        id: "level_10",
        name: "资深旅人",
        description: "达到等级 10",
        icon: "⭐",
        rarity: "epic",
        unlocked: false,
    },
];

export function GamificationProvider({ children }: { children: ReactNode }) {
    const [stats, setStats] = useState<UserStats>(() => {
        if (typeof window === 'undefined') {
            return { level: 1, exp: 0, maxExp: 100, coins: 500, mood: "neutral" };
        }
        const saved = localStorage.getItem("gamification_stats");
        return saved
            ? JSON.parse(saved)
            : { level: 1, exp: 0, maxExp: 100, coins: 500, mood: "neutral" };
    });

    const [achievements, setAchievements] = useState<Achievement[]>(() => {
        if (typeof window === 'undefined') {
            return INITIAL_ACHIEVEMENTS;
        }
        const saved = localStorage.getItem("gamification_achievements");
        return saved ? JSON.parse(saved) : INITIAL_ACHIEVEMENTS;
    });

    const [inventory, setInventory] = useState<InventoryItem[]>(() => {
        if (typeof window === 'undefined') {
            return [];
        }
        const saved = localStorage.getItem("gamification_inventory");
        return saved ? JSON.parse(saved) : [];
    });

    // 持久化到localStorage
    useEffect(() => {
        localStorage.setItem("gamification_stats", JSON.stringify(stats));
    }, [stats]);

    useEffect(() => {
        localStorage.setItem("gamification_achievements", JSON.stringify(achievements));
    }, [achievements]);

    useEffect(() => {
        localStorage.setItem("gamification_inventory", JSON.stringify(inventory));
    }, [inventory]);

    const addExp = (amount: number) => {
        setStats((prev) => {
            let newExp = prev.exp + amount;
            let newLevel = prev.level;
            let newMaxExp = prev.maxExp;

            // 升级检查
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

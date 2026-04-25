import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "~/hooks/useUser";

/**
 * 成就系统
 * 功能：自动检测并解锁成就，显示 Toast 通知
 * 支持：通过 window.triggerAchievement() 从任何组件触发成就
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "time" | "interaction" | "hidden" | "social" | "exploration";
  triggerEvent?: string; // 自定义触发事件名
}

export const ACHIEVEMENTS: Achievement[] = [
  // 时间系
  {
    id: "night_owl",
    name: "夜之守望者",
    description: "在凌晨 2:00 - 4:00 期间访问网站",
    icon: "🌙",
    category: "time",
    triggerEvent: "night_owl",
  },
  {
    id: "early_bird",
    name: "早安少女/少年",
    description: "在早上 5:00 - 7:00 期间访问",
    icon: "☀️",
    category: "time",
    triggerEvent: "early_bird",
  },
  // 互动系
  {
    id: "first_contact",
    name: "契约缔结者",
    description: "发表第一条评论",
    icon: "🗣️",
    category: "social",
    triggerEvent: "comment",
  },
  {
    id: "observer",
    name: "观测者",
    description: "累计阅读文章超过 10 篇",
    icon: "🔍",
    category: "exploration",
    triggerEvent: "article_read",
  },
  {
    id: "avatar_collector",
    name: "收藏家",
    description: "收藏第一件商城物品",
    icon: "🏪",
    category: "interaction",
    triggerEvent: "purchase",
  },
  {
    id: "first_signin",
    name: "旅行者启程",
    description: "完成首次签到",
    icon: "🚀",
    category: "interaction",
    triggerEvent: "signin",
  },
  {
    id: "week_warrior",
    name: "周之战士",
    description: "连续签到 7 天",
    icon: "⚔️",
    category: "interaction",
    triggerEvent: "signin_week",
  },
  {
    id: "combo_master",
    name: "连击大师",
    description: "点赞某篇文章",
    icon: "⚡",
    category: "interaction",
    triggerEvent: "like",
  },
  // 探索系
  {
    id: "bangumi_watcher",
    name: "追番者",
    description: "收藏第一部番剧",
    icon: "📺",
    category: "exploration",
    triggerEvent: "anime_track",
  },
  {
    id: "gacha_master",
    name: "扭蛋大师",
    description: "首次十连扭蛋",
    icon: "🎰",
    category: "interaction",
    triggerEvent: "gacha",
  },
  // 隐藏系
  {
    id: "schrodinger_cat",
    name: "薛定谔的猫",
    description: "连续刷新 404 页面 5 次",
    icon: "🐱",
    category: "hidden",
    triggerEvent: "404",
  },
  {
    id: "pixel_hunter",
    name: "像素猎人",
    description: "找到并点击 1x1 像素的隐藏按钮",
    icon: "🖱️",
    category: "hidden",
    triggerEvent: "pixel_click",
  },
];

function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function AchievementSystem() {
  const { user } = useUser();
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const [unlockedSet, setUnlockedSet] = useState<Set<string>>(new Set());

  // 显示成就通知
  const showAchievement = useCallback((achievement: Achievement) => {
    setUnlockedAchievement(achievement);
    setUnlockedSet((prev) => new Set([...prev, achievement.id]));
    setTimeout(() => setUnlockedAchievement(null), 4000);
  }, []);

  // 调用后端 API 尝试解锁成就
  const tryUnlock = useCallback(
    async (achievementId: string) => {
      if (!user || unlockedSet.has(achievementId)) return;

      try {
        const formData = new FormData();
        formData.append("achievement_id", achievementId);

        const response = await fetch("/api/achievement", {
          method: "POST",
          body: formData,
        });

        const result = await response.json() as { success?: boolean };

        if (result.success) {
          const achievement = getAchievementById(achievementId);
          if (achievement) showAchievement(achievement);
        }
      } catch (error) {
        console.error("[AchievementSystem] unlock failed:", error);
      }
    },
    [user, unlockedSet, showAchievement]
  );

  // 全局成就触发器（暴露给其他组件调用）
  useEffect(() => {
    if (typeof window === "undefined") return;

    (window as any).triggerAchievement = tryUnlock;

    return () => {
      delete (window as any).triggerAchievement;
    };
  }, [tryUnlock]);

  // 时间系成就（进站时自动检查）
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 2 && hour < 4) {
      tryUnlock("night_owl");
    } else if (hour >= 5 && hour < 7) {
      tryUnlock("early_bird");
    }
  }, [tryUnlock]);

  return (
    <AnimatePresence>
      {unlockedAchievement && (
        <motion.div
          className="fixed top-20 right-8 z-[150] bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-2xl p-5 shadow-2xl border-2 border-white/60 overflow-hidden"
          initial={{ opacity: 0, x: 120, scale: 0.7 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 120, scale: 0.7 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          {/* 背景光晕 */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-300/30 to-orange-300/30 animate-pulse pointer-events-none" />
          {/* 星星装饰 */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0], y: [-10, -30, -50] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              style={{
                left: `${15 + i * 14}%`,
                top: "50%",
              }}
            />
          ))}
          <div className="relative flex items-center gap-4 text-white">
            <motion.div
              className="text-5xl drop-shadow-lg"
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 0.6, repeat: 2 }}
            >
              {unlockedAchievement.icon}
            </motion.div>
            <div>
              <motion.div
                className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 0.8 }}
                transition={{ delay: 0.2 }}
              >
                成就解锁
              </motion.div>
              <div className="font-black text-lg leading-tight drop-shadow">
                {unlockedAchievement.name}
              </div>
              <div className="text-[11px] opacity-80 font-medium leading-tight mt-0.5">
                {unlockedAchievement.description}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 便捷触发函数 — 在业务逻辑中调用这些
// ══════════════════════════════════════════════════════════════════════

/** 签到成功后调用 */
export function onSignIn(streak: number) {
  if (typeof window !== "undefined") {
    const w = window as any;
    w.triggerAchievement?.("first_signin");
    if (streak >= 7) w.triggerAchievement?.("signin_week");
  }
}

/** 用户点赞后调用 */
export function onLike() {
  if (typeof window !== "undefined") {
    (window as any).triggerAchievement?.("combo_master");
  }
}

/** 用户评论后调用 */
export function onComment() {
  if (typeof window !== "undefined") {
    (window as any).triggerAchievement?.("first_contact");
  }
}

/** 用户阅读文章后调用 */
export function onArticleRead() {
  if (typeof window !== "undefined") {
    (window as any).triggerAchievement?.("observer");
  }
}

/** 用户购买商品后调用 */
export function onPurchase() {
  if (typeof window !== "undefined") {
    (window as any).triggerAchievement?.("avatar_collector");
  }
}

/** 用户收藏番剧后调用 */
export function onAnimeTrack() {
  if (typeof window !== "undefined") {
    (window as any).triggerAchievement?.("bangumi_watcher");
  }
}

/** 用户抽卡后调用 */
export function onGacha() {
  if (typeof window !== "undefined") {
    (window as any).triggerAchievement?.("gacha_master");
  }
}

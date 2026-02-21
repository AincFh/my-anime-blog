import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 成就系统
 * 功能：自动检测并解锁成就，显示Toast通知
 */

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "time" | "interaction" | "hidden";
}

const achievements: Achievement[] = [
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

export function AchievementSystem() {
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  // 检查时间系成就
  useEffect(() => {
    const hour = new Date().getHours();

    if (hour >= 2 && hour < 4) {
      checkAndUnlock("night_owl");
    } else if (hour >= 5 && hour < 7) {
      checkAndUnlock("early_bird");
    }
  }, []);

  const checkAndUnlock = async (achievementId: string) => {
    // TODO: 获取当前用户ID（如果有登录）
    const userId = localStorage.getItem("user_id");
    if (!userId) return; // 未登录用户不记录成就

    try {
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("achievement_id", achievementId);

      const response = await fetch("/api/achievement", {
        method: "POST",
        body: formData,
      });

      const result = await response.json() as any;
      if (result.success) {
        const achievement = achievements.find((a) => a.id === achievementId);
        if (achievement) {
          setUnlockedAchievement(achievement);
          setTimeout(() => setUnlockedAchievement(null), 5000);
        }
      }
    } catch (error) {
      console.error("Failed to unlock achievement:", error);
    }
  };

  // 暴露给其他组件使用（仅在客户端）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).unlockAchievement = checkAndUnlock;
    }
  }, [checkAndUnlock]);

  return (
    <AnimatePresence>
      {unlockedAchievement && (
        <motion.div
          className="fixed top-20 right-8 z-[150] bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-xl p-4 shadow-2xl border-2 border-white/50"
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="flex items-center gap-3 text-white">
            <motion.div
              className="text-4xl"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: 2,
              }}
            >
              {unlockedAchievement.icon}
            </motion.div>
            <div>
              <div className="font-bold text-lg">成就解锁！</div>
              <div className="text-sm opacity-90">{unlockedAchievement.name}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


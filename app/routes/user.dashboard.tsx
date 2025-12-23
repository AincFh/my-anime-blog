import { motion } from "framer-motion";
import { HolographicIDCard } from "~/components/user/HolographicIDCard";
import { ArtifactCase } from "~/components/user/ArtifactCase";
import { LiquidProgress } from "~/components/user/LiquidProgress";
import { NotificationPanel } from "~/components/user/NotificationPanel";
import { useState, useEffect } from "react";
import { WaveChart } from "~/components/ui/charts/WaveChart";
import { GamificationProvider, useGamification } from "~/contexts/GamificationContext";
import { AchievementBadge } from "~/components/gamification/AchievementBadge";
import { GachaMachine } from "~/components/gamification/GachaMachine";
import { SoulSync } from "~/components/gamification/SoulSync";
import { useUser } from "~/hooks/useUser";
import { ClientOnly } from "~/components/common/ClientOnly";

function DashboardContent() {
  const { user, loading } = useUser();
  const [currentExp, setCurrentExp] = useState(0);
  const [maxExp, setMaxExp] = useState(1000);
  const [level, setLevel] = useState(1);

  // 同步用户数据
  useEffect(() => {
    if (user) {
      setLevel(user.level || 1);
      setCurrentExp(user.exp || 0);
      setMaxExp((user.level || 1) * 100);
    }
  }, [user]);

  const userData = {
    avatar: user?.avatar_url || undefined,
    uid: user ? `UID-${user.id.toString().padStart(6, '0')}` : "UID-LOADING",
    joinDate: "2024-01-15", // TODO: 从后端获取注册时间
    level: level,
    name: user?.username || "Traveler",
    role: user?.role || "user",
  };

  const artifacts = [
    {
      id: "1",
      name: "初音未来",
      image: "https://images.unsplash.com/photo-1577056922428-a79963db266d?q=80&w=400",
      rarity: "SSR" as const,
      obtainedDate: "2024-01-20",
      description: "通过每日扭蛋获得",
    },
    {
      id: "2",
      name: "樱花徽章",
      image: "https://images.unsplash.com/photo-1616486339569-9c4050911745?q=80&w=400",
      rarity: "SR" as const,
      obtainedDate: "2024-01-18",
      description: "完成成就「夜之守望者」获得",
    },
    {
      id: "3",
      name: "像素猎人",
      image: "https://images.unsplash.com/photo-1577056922428-a79963db266d?q=80&w=400",
      rarity: "R" as const,
      obtainedDate: "2024-01-16",
      description: "解锁隐藏成就获得",
    },
  ];

  const notifications = [
    {
      id: "1",
      type: "info" as const,
      title: "系统通知",
      message: "欢迎回到 Project Blue Sky！",
      timestamp: "刚刚",
      isImportant: false,
    },
  ];

  const handleLevelUp = () => {
    setLevel(level + 1);
    setCurrentExp(0);
    setMaxExp(maxExp * 1.5);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-start border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-8 text-center font-display"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          个人中心
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <ClientOnly fallback={<div className="h-64 glass-card rounded-2xl animate-pulse" />}>
              {() => <HolographicIDCard user={userData} />}
            </ClientOnly>

            <ClientOnly fallback={<div className="h-32 glass-card rounded-2xl animate-pulse" />}>
              {() => (
                <LiquidProgress
                  currentExp={currentExp}
                  maxExp={maxExp}
                  level={level}
                  onLevelUp={handleLevelUp}
                />
              )}
            </ClientOnly>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 font-display">战利品收藏柜</h2>
              <ClientOnly fallback={<div className="h-48 glass-card rounded-2xl animate-pulse" />}>
                {() => <ArtifactCase artifacts={artifacts} />}
              </ClientOnly>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 font-display">活跃度分析</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-4 rounded-2xl">
                  <h3 className="text-sm text-slate-500 dark:text-slate-400 mb-4">本周访问趋势</h3>
                  <ClientOnly fallback={<div className="h-[150px] bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />}>
                    {() => <WaveChart data={[120, 132, 101, 134, 90, 230, 210]} color="#F472B6" height={150} />}
                  </ClientOnly>
                </div>
                <div className="glass-card p-4 rounded-2xl">
                  <h3 className="text-sm text-slate-500 dark:text-slate-400 mb-4">经验获取速率</h3>
                  <ClientOnly fallback={<div className="h-[150px] bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />}>
                    {() => <WaveChart data={[20, 32, 41, 24, 50, 80, 60]} color="#60A5FA" height={150} />}
                  </ClientOnly>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-16 space-y-8">
          <motion.h2
            className="text-2xl font-bold text-slate-800 dark:text-white mb-6 font-display"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            游戏化系统
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GameSection title="成就收藏">
              <ClientOnly fallback={<div className="h-48 animate-pulse" />}>
                {() => <AchievementsGrid />}
              </ClientOnly>
            </GameSection>

            <GameSection title="心情追踪">
              <ClientOnly fallback={<div className="h-48 animate-pulse" />}>
                {() => <SoulSync />}
              </ClientOnly>
            </GameSection>
          </div>

          <div className="mt-8">
            <GameSection title="扭蛋机">
              <ClientOnly fallback={<div className="h-64 animate-pulse" />}>
                {() => <GachaMachine />}
              </ClientOnly>
            </GameSection>
          </div>
        </div>
      </div>

      <NotificationPanel notifications={notifications} />
    </div>
  );
}

export default function UserDashboard() {
  return (
    <GamificationProvider>
      <DashboardContent />
    </GamificationProvider>
  );
}

function GameSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 font-display">{title}</h3>
      {children}
    </motion.div>
  );
}

function AchievementsGrid() {
  const { achievements } = useGamification();

  return (
    <div className="grid grid-cols-3 gap-4">
      {achievements.slice(0, 6).map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          name={achievement.name}
          description={achievement.description}
          icon={achievement.icon}
          rarity={achievement.rarity}
          unlocked={achievement.unlocked}
          size="md"
        />
      ))}
    </div>
  );
}

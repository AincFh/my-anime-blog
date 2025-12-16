import { motion } from "framer-motion";
import { HolographicIDCard } from "~/components/user/HolographicIDCard";
import { ArtifactCase } from "~/components/user/ArtifactCase";
import { LiquidProgress } from "~/components/user/LiquidProgress";
import { NotificationPanel } from "~/components/user/NotificationPanel";
import { useState } from "react";
import { WaveChart } from "~/components/ui/charts/WaveChart";
import { GamificationProvider, useGamification } from "~/contexts/GamificationContext";
import { AchievementBadge } from "~/components/gamification/AchievementBadge";
import { GachaMachine } from "~/components/gamification/GachaMachine";
import { SoulSync } from "~/components/gamification/SoulSync";

function DashboardContent() {
  const [currentExp, setCurrentExp] = useState(850);
  const [maxExp, setMaxExp] = useState(1000);
  const [level, setLevel] = useState(5);

  const user = {
    avatar: undefined,
    uid: "UID-2024001",
    joinDate: "2024-01-15",
    level: 5,
    name: "Traveler",
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
    {
      id: "2",
      type: "warning" as const,
      title: "安全提醒",
      message: "检测到异常登录，请检查账户安全",
      timestamp: "5分钟前",
      isImportant: true,
    },
    {
      id: "3",
      type: "success" as const,
      title: "成就解锁",
      message: "恭喜解锁「连击大师」成就！",
      timestamp: "1小时前",
      isImportant: false,
    },
  ];

  const handleLevelUp = () => {
    setLevel(level + 1);
    setCurrentExp(0);
    setMaxExp(maxExp * 1.5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          className="text-4xl font-bold text-white mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          个人中心
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <HolographicIDCard user={user} />
            <LiquidProgress
              currentExp={currentExp}
              maxExp={maxExp}
              level={level}
              onLevelUp={handleLevelUp}
            />
          </div>

          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">战利品收藏柜</h2>
              <ArtifactCase artifacts={artifacts} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">活跃度分析</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm text-gray-400 mb-2">本周访问趋势</h3>
                  <WaveChart data={[120, 132, 101, 134, 90, 230, 210]} color="#F472B6" height={150} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-400 mb-2">经验获取速率</h3>
                  <WaveChart data={[20, 32, 41, 24, 50, 80, 60]} color="#60A5FA" height={150} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-16">
          <motion.h2
            className="text-2xl font-bold text-white mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            游戏化系统
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GameSection title="成就收藏">
              <AchievementsGrid />
            </GameSection>

            <GameSection title="心情追踪">
              <SoulSync />
            </GameSection>
          </div>

          <div className="mt-8">
            <GameSection title="扭蛋机">
              <GachaMachine />
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
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
    >
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
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

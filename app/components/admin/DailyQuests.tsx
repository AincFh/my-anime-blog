import { motion } from "framer-motion";
import { useState, useEffect } from "react";

/**
 * 每日任务/成就系统
 * 功能：任务列表、成就徽章
 */
export function DailyQuests() {
  const [quests, setQuests] = useState([
    { id: 1, task: "登录后台", completed: true, exp: 10 },
    { id: 2, task: "更新番剧进度", completed: false, exp: 5 },
    { id: 3, task: "写100字草稿", completed: false, exp: 20 },
    { id: 4, task: "回复1条评论", completed: false, exp: 10 },
  ]);

  const [achievements] = useState([
    { id: 1, name: "初级作家", description: "发布10篇文章", unlocked: true, icon: "✍️" },
    { id: 2, name: "番剧收藏家", description: "收藏20部番剧", unlocked: false, icon: "🎬" },
    { id: 3, name: "互动达人", description: "收到100条评论", unlocked: false, icon: "💬" },
  ]);

  const totalExp = quests.filter((q) => q.completed).reduce((sum, q) => sum + q.exp, 0);
  const completedCount = quests.filter((q) => q.completed).length;
  const totalCount = quests.length;

  const toggleQuest = (id: number) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, completed: !q.completed } : q))
    );
  };

  // 每天0点重置任务
  useEffect(() => {
    const lastReset = localStorage.getItem("quests_reset_date");
    const today = new Date().toDateString();

    if (lastReset !== today) {
      setQuests((prev) => prev.map((q) => ({ ...q, completed: false })));
      localStorage.setItem("quests_reset_date", today);
    }
  }, []);

  return (
    <div className="glass-card-deep p-6 tech-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 font-orbitron">
          <span className="text-violet-400">📅</span> 每日任务
        </h2>
        <span className="text-sm text-white/50 font-mono">
          {completedCount}/{totalCount} 完成
        </span>
      </div>

      <div className="space-y-3 mb-6">
        {quests.map((quest, index) => (
          <motion.div
            key={quest.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => toggleQuest(quest.id)}
          >
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={quest.completed}
                onChange={() => toggleQuest(quest.id)}
                className="peer appearance-none w-5 h-5 rounded border border-white/30 bg-white/5 checked:bg-pink-500 checked:border-pink-500 transition-colors cursor-pointer"
              />
              <svg
                className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M3 7L5.5 9.5L11 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p
                className={`text-sm transition-colors ${quest.completed ? "line-through text-white/30" : "text-white/80 group-hover:text-white"
                  }`}
              >
                {quest.task}
              </p>
            </div>
            <span className="text-xs font-bold text-yellow-400 font-mono shadow-[0_0_10px_rgba(250,204,21,0.2)]">+{quest.exp} EXP</span>
          </motion.div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-white/60">今日获得经验</span>
          <span className="text-lg font-bold text-yellow-400 font-mono text-neon" style={{ textShadow: "0 0 10px rgba(250, 204, 21, 0.5)" }}>{totalExp} EXP</span>
        </div>

        {/* 成就徽章 */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-white/60 mb-3 tracking-wider">🏆 成就徽章</h3>
          <div className="flex gap-2">
            {achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                className={`flex flex-col items-center p-2 rounded-lg border ${achievement.unlocked
                    ? "bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-yellow-400/50 shadow-[0_0_10px_rgba(250,204,21,0.1)]"
                    : "bg-white/5 border-white/10 opacity-50 grayscale"
                  }`}
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-2xl mb-1 filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{achievement.icon}</span>
                <p className={`text-xs font-bold ${achievement.unlocked ? "text-yellow-300" : "text-white/40"}`}>{achievement.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


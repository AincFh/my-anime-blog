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
    <div className="w-full h-full flex flex-col bg-[#1e293b]/30 p-6 rounded-3xl border border-white/5 shadow-inner">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-bold text-white/80 tracking-widest uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_#eab308]"></span>
          Daily Quests
        </h3>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
          <span className="text-yellow-400">⚡</span>
          <span className="text-xs text-white/70 font-mono font-bold">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar mb-6">
        {quests.map((quest, index) => (
          <motion.div
            key={quest.id}
            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer group
              ${quest.completed
                ? 'bg-yellow-500/10 border-yellow-500/20'
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}
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

      <div className="pt-6 border-t border-white/10">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1">Earned EXP</span>
          <span className="text-2xl font-black text-yellow-400 font-orbitron drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]">+{totalExp}</span>
        </div>

        {/* 成就徽章 */}
        <div className="mt-2">
          <h3 className="text-[10px] font-bold text-white/40 mb-3 tracking-widest uppercase pl-1">Achievements</h3>
          <div className="grid grid-cols-3 gap-3">
            {achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                className={`flex flex-col items-center justify-center py-4 px-2 rounded-2xl border transition-all ${achievement.unlocked
                  ? "bg-gradient-to-b from-yellow-500/20 to-orange-500/10 border-yellow-500/30 shadow-[0_0_15px_rgba(250,204,21,0.15)] bg-yellow-500/5 hover:bg-yellow-500/10"
                  : "bg-white/5 border-white/5 opacity-50 grayscale hover:opacity-70"
                  }`}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl mb-2 filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]">{achievement.icon}</div>
                <p className={`text-[10px] font-bold text-center leading-tight ${achievement.unlocked ? "text-yellow-300" : "text-white/40"}`}>{achievement.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          📅 每日任务
        </h2>
        <span className="text-sm text-gray-500">
          {completedCount}/{totalCount} 完成
        </span>
      </div>

      <div className="space-y-3 mb-6">
        {quests.map((quest, index) => (
          <motion.div
            key={quest.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => toggleQuest(quest.id)}
          >
            <input
              type="checkbox"
              checked={quest.completed}
              onChange={() => toggleQuest(quest.id)}
              className="w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
            />
            <div className="flex-1">
              <p
                className={`text-sm ${
                  quest.completed ? "line-through text-gray-400" : "text-gray-700"
                }`}
              >
                {quest.task}
              </p>
            </div>
            <span className="text-xs font-bold text-yellow-600">+{quest.exp} EXP</span>
          </motion.div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700">今日获得经验</span>
          <span className="text-lg font-bold text-yellow-600">{totalExp} EXP</span>
        </div>

        {/* 成就徽章 */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">🏆 成就徽章</h3>
          <div className="flex gap-2">
            {achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                className={`flex flex-col items-center p-2 rounded-lg ${
                  achievement.unlocked
                    ? "bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-300"
                    : "bg-gray-100 border-2 border-gray-200 opacity-50"
                }`}
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-2xl mb-1">{achievement.icon}</span>
                <p className="text-xs font-bold text-gray-700">{achievement.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


import { motion } from "framer-motion";
import { useGamification } from "~/contexts/GamificationContext";

const MOODS = [
    { id: "energetic", name: "充满活力", icon: "⚡", color: "#FF6B6B", gradient: "from-red-400 to-pink-500" },
    { id: "peaceful", name: "平静祥和", icon: "🌊", color: "#4ECDC4", gradient: "from-cyan-400 to-blue-500" },
    { id: "creative", name: "创意无限", icon: "🎨", color: "#A78BFA", gradient: "from-purple-400 to-indigo-500" },
    { id: "focused", name: "专注投入", icon: "🎯", color: "#10B981", gradient: "from-green-400 to-emerald-500" },
    { id: "dreamy", name: "梦幻飘逸", icon: "🌙", color: "#818CF8", gradient: "from-indigo-400 to-purple-500" },
];

export function SoulSync() {
    const { stats, setMood } = useGamification();

    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">✨</span>
                <h3 className="text-xl font-bold text-slate-800">Soul Sync</h3>
            </div>

            <p className="text-sm text-slate-600 mb-4">选择你的心情，改变仪表盘的氛围</p>

            <div className="grid grid-cols-2 gap-3">
                {MOODS.map((mood) => (
                    <motion.button
                        key={mood.id}
                        onClick={() => setMood(mood.id)}
                        className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${stats.mood === mood.id
                                ? `bg-gradient-to-br ${mood.gradient} text-white shadow-lg`
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {stats.mood === mood.id && (
                            <motion.div
                                className="absolute inset-0 bg-white/20"
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        )}

                        <div className="relative z-10">
                            <div className="text-3xl mb-1">{mood.icon}</div>
                            <div className="font-bold text-sm">{mood.name}</div>
                        </div>

                        {stats.mood === mood.id && (
                            <motion.div
                                className="absolute top-2 right-2"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                            >
                                ✓
                            </motion.div>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Current Mood Display */}
            {stats.mood && (
                <motion.div
                    className="mt-4 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="text-sm text-slate-600">
                        当前心情: <span className="font-bold">{MOODS.find((m) => m.id === stats.mood)?.name}</span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

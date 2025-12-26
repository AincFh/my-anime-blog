import { motion } from "framer-motion";
import { CheckCircle2, Circle, Trophy, ArrowRight } from "lucide-react";

interface Mission {
    id: string;
    title: string;
    reward: string;
    completed: boolean;
    progress?: number;
    total?: number;
}

export function MissionBoard() {
    // Mock data for now
    const missions: Mission[] = [
        { id: "1", title: "每日签到", reward: "50 Coins", completed: false, progress: 0, total: 1 },
        { id: "2", title: "浏览商城", reward: "10 Exp", completed: true, progress: 1, total: 1 },
        { id: "3", title: "阅读一篇文章", reward: "20 Exp", completed: false, progress: 0, total: 1 },
        { id: "4", title: "更新个人资料", reward: "Badge", completed: true, progress: 1, total: 1 },
    ];

    return (
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="text-yellow-500" size={20} />
                    每日任务
                </h3>
                <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded">
                    REFRESH: 12:00:00
                </span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                {missions.map((mission, index) => (
                    <motion.div
                        key={mission.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`
                            group relative p-4 rounded-xl border transition-all duration-300
                            ${mission.completed
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                            }
                        `}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`
                                    w-6 h-6 rounded-full flex items-center justify-center
                                    ${mission.completed ? "text-green-400" : "text-white/20"}
                                `}>
                                    {mission.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                </div>
                                <div>
                                    <div className={`font-bold text-sm ${mission.completed ? "text-white/60 line-through" : "text-white"}`}>
                                        {mission.title}
                                    </div>
                                    <div className="text-xs text-yellow-500/80 font-mono mt-0.5">
                                        REWARD: {mission.reward}
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar or Status */}
                            <div className="text-right">
                                {mission.completed ? (
                                    <span className="text-xs font-bold text-green-400 bg-green-500/20 px-2 py-1 rounded">
                                        COMPLETE
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-2 text-xs text-white/40">
                                        <span>{mission.progress}/{mission.total}</span>
                                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar Background */}
                        {!mission.completed && (
                            <div className="absolute bottom-0 left-0 h-0.5 bg-white/10 w-full rounded-b-xl overflow-hidden">
                                <motion.div
                                    className="h-full bg-yellow-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(mission.progress! / mission.total!) * 100}%` }}
                                />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

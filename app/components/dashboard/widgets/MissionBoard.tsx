import { motion } from "framer-motion";
import { CheckCircle2, Circle, Trophy, ArrowRight } from "lucide-react";
import { useFetcher } from "react-router";

interface Mission {
    id: string;
    name: string;
    description: string;
    reward_coins: number;
    reward_exp: number;
    progress: number;
    target_count: number;
    status: 'in_progress' | 'completed' | 'claimed';
}

export function MissionBoard({ missions = [] }: { missions?: Mission[] }) {
    const fetcher = useFetcher();

    const handleClaim = (missionId: string) => {
        fetcher.submit({ missionId }, { method: "post", action: "/api/user/api.missions.claim" });
    };

    return (
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="text-yellow-500" size={20} />
                    使命终端
                </h3>
                <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded">
                    REFRESH: 00:00:00
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
                            ${mission.status === 'claimed'
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                            }
                        `}
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`
                                    w-6 h-6 rounded-full flex items-center justify-center
                                    ${mission.status === 'claimed' ? "text-green-400" : "text-white/20"}
                                `}>
                                    {mission.status === 'claimed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                </div>
                                <div>
                                    <div className={`font-bold text-sm ${mission.status === 'claimed' ? "text-white/60 line-through" : "text-white"}`}>
                                        {mission.name}
                                    </div>
                                    <div className="text-xs text-yellow-500/80 font-mono mt-0.5">
                                        REWARD: {mission.reward_coins > 0 ? `+${mission.reward_coins} C` : ''} {mission.reward_exp > 0 ? `+${mission.reward_exp} EXP` : ''}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                {mission.status === 'claimed' ? (
                                    <span className="text-xs font-bold text-green-400 bg-green-500/20 px-2 py-1 rounded border border-green-500/20">
                                        领取成功
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white/40">{mission.progress}/{mission.target_count}</span>
                                        {mission.status === 'completed' ? (
                                            <button
                                                onClick={() => handleClaim(mission.id)}
                                                disabled={fetcher.state !== 'idle'}
                                                className="px-3 py-1 bg-yellow-400 text-black text-[10px] font-black rounded-lg hover:shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all disabled:opacity-50"
                                            >
                                                {fetcher.formData?.get('missionId') === mission.id ? '...' : 'CLAIM'}
                                            </button>
                                        ) : (
                                            <ArrowRight size={12} className="text-white/20 group-hover:translate-x-1 transition-transform" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar Background */}
                        {mission.status === 'in_progress' && (
                            <div className="absolute bottom-0 left-0 h-0.5 bg-white/5 w-full rounded-b-xl overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((mission.progress / mission.target_count) * 100, 100)}%` }}
                                />
                            </div>
                        )}
                    </motion.div>
                ))}

                {missions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-white/20 italic">
                        <Circle size={40} className="mb-4 opacity-50" />
                        <p>暂无可用使命</p>
                    </div>
                )}
            </div>
        </div>
    );
}

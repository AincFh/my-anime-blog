import { motion } from "framer-motion";
import { Coins, Sparkles, Plus, Crown } from "lucide-react";
import { Link } from "react-router";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";

interface StatusHUDProps {
    user: {
        name: string;
        level: number;
        exp: number;
        maxExp: number;
        avatar?: string;
        uid: string;
        tier?: {
            name: string;
            display_name: string;
            badge_color: string | null;
        } | null;
    };
    stats: {
        coins: number;
        gems?: number; // 预留
    };
}

export function StatusHUD({ user, stats }: StatusHUDProps) {
    const expPercent = Math.min((user.exp / user.maxExp) * 100, 100);

    return (
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-20">
            {/* 左上角：玩家信息 */}
            <motion.div
                className="flex items-center gap-4 pointer-events-auto"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                {/* 头像框 (六边形或圆形) */}
                <div className="relative group">
                    <div className="w-16 h-16 rounded-full border-2 border-white/50 overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] transition-shadow duration-300 relative">
                        <OptimizedImage
                            src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Traveler"}
                            alt="Avatar"
                            aspectRatio="square"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-xs font-bold px-1.5 py-0.5 rounded border border-white/20">
                        Lv.{user.level}
                    </div>
                </div>

                {/* 信息条 */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white drop-shadow-md font-display tracking-wide">{user.name}</h2>
                        {user.tier && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`
                                    px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shadow-lg
                                    ${user.tier.name === 'svip'
                                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-pink-500/50 animate-pulse"
                                        : "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-yellow-500/50"
                                    }
                                `}
                            >
                                {user.tier.display_name}
                            </motion.span>
                        )}
                        <span className="text-xs text-white/60 font-mono">{user.uid}</span>
                    </div>

                    {/* 经验条 (斜切风格) */}
                    <div className="w-48 h-3 bg-black/40 backdrop-blur-sm skew-x-[-15deg] border border-white/10 overflow-hidden relative">
                        <motion.div
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${expPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/80 skew-x-[15deg]">
                            {user.exp} / {user.maxExp} EXP
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 右上角：资源栏 */}
            <motion.div
                className="flex items-center gap-4 pointer-events-auto"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                {/* 星尘 (Coins) */}
                <Link to="/shop?tab=recharge" className="flex items-center bg-black/40 backdrop-blur-md rounded-full pl-2 pr-1 py-1 border border-white/10 hover:bg-black/60 transition-colors cursor-pointer group">
                    <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center mr-2">
                        <Coins className="w-4 h-4 text-yellow-400" />
                    </div>
                    <span className="text-white font-bold font-mono mr-3 min-w-[60px] text-right">
                        {stats.coins.toLocaleString()}
                    </span>
                    <div className="w-6 h-6 bg-white/10 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                        <Plus className="w-3 h-3 text-white" />
                    </div>
                </Link>

                {/* VIP 快捷入口 */}
                <Link to="/shop?tab=membership" className="flex items-center bg-gradient-to-r from-yellow-600/20 to-orange-600/20 backdrop-blur-md rounded-full px-3 py-1.5 border border-yellow-500/30 hover:border-yellow-500/60 transition-all cursor-pointer group">
                    <Crown className="w-4 h-4 text-yellow-400 mr-2" />
                    <span className="text-xs font-bold text-yellow-400 group-hover:text-yellow-300">开通会员</span>
                </Link>

                {/* 钻石/Gem (预留) */}
                {/* <div className="flex items-center bg-black/40 backdrop-blur-md rounded-full pl-2 pr-1 py-1 border border-white/10">
            <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-white font-bold font-mono mr-3">0</span>
            <button className="w-6 h-6 bg-white/10 hover:bg-white/30 rounded-full flex items-center justify-center">
                <Plus className="w-3 h-3 text-white" />
            </button>
        </div> */}
            </motion.div>
        </div>
    );
}

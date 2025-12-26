import { motion } from "framer-motion";
import { Calendar, Sparkles, ShoppingBag, ChevronRight } from "lucide-react";

interface ActionPanelProps {
    onSignIn: () => void;
    onGacha: () => void;
    onShop: () => void;
    signInStatus: {
        hasSignedIn: boolean;
        consecutiveDays: number;
        isSubmitting: boolean;
    };
}

export function ActionPanel({ onSignIn, onGacha, onShop, signInStatus }: ActionPanelProps) {
    return (
        <div className="absolute bottom-8 right-8 flex items-end gap-6 z-20">

            {/* 1. 次要操作组 (商城 & 扭蛋) */}
            <div className="flex flex-col gap-4 mb-2">
                {/* 商城按钮 */}
                <motion.button
                    onClick={onShop}
                    className="group flex items-center justify-end gap-3"
                    whileHover={{ x: -10 }}
                >
                    <span className="text-white/80 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">商城</span>
                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-colors">
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                </motion.button>

                {/* 扭蛋按钮 */}
                <motion.button
                    onClick={onGacha}
                    className="group flex items-center justify-end gap-3"
                    whileHover={{ x: -10 }}
                >
                    <span className="text-white/80 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">祈愿</span>
                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white group-hover:border-purple-400 transition-colors">
                        <Sparkles className="w-5 h-5" />
                    </div>
                </motion.button>
            </div>

            {/* 2. 主要操作按钮 (签到/开始) */}
            <motion.button
                onClick={onSignIn}
                disabled={signInStatus.hasSignedIn || signInStatus.isSubmitting}
                className={`
            relative group overflow-hidden rounded-full pl-8 pr-2 py-2 flex items-center gap-4
            ${signInStatus.hasSignedIn
                        ? "bg-slate-800/80 border border-white/10 cursor-default"
                        : "bg-white text-slate-900 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.6)]"
                    }
            transition-all duration-300
        `}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
            >
                {/* 按钮文字 */}
                <div className="flex flex-col items-start">
                    <span className={`text-2xl font-black font-display tracking-widest ${signInStatus.hasSignedIn ? "text-white/50" : "text-slate-900"}`}>
                        {signInStatus.hasSignedIn ? "COMPLETED" : "SIGN IN"}
                    </span>
                    <span className={`text-[10px] font-bold tracking-[0.2em] ${signInStatus.hasSignedIn ? "text-white/30" : "text-slate-500"}`}>
                        {signInStatus.hasSignedIn ? "已完成今日签到" : "点击领取今日奖励"}
                    </span>
                </div>

                {/* 圆形图标/箭头 */}
                <div className={`
            w-14 h-14 rounded-full flex items-center justify-center
            ${signInStatus.hasSignedIn ? "bg-white/10 text-white/30" : "bg-slate-900 text-white group-hover:rotate-90 transition-transform duration-300"}
        `}>
                    {signInStatus.isSubmitting ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : signInStatus.hasSignedIn ? (
                        <Calendar className="w-6 h-6" />
                    ) : (
                        <ChevronRight className="w-8 h-8" />
                    )}
                </div>

                {/* 扫光动画 (未签到时) */}
                {!signInStatus.hasSignedIn && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
                        animate={{ x: ["-150%", "150%"] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    />
                )}
            </motion.button>

        </div>
    );
}

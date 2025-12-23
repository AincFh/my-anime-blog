import { motion } from "framer-motion";
import { User } from "lucide-react";

interface UserHUDProps {
    user: {
        username: string;
        avatar_url?: string;
        level?: number;
        exp?: number;
        coins?: number;
    };
    compact?: boolean;
}

export function UserHUD({ user, compact = false }: UserHUDProps) {
    // Mock max exp logic: level * 100
    const level = user.level || 1;
    const exp = user.exp || 0;
    const maxExp = level * 100;
    const progress = Math.min((exp / maxExp) * 100, 100);

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                {/* Avatar Ring with Level */}
                <div className="relative">
                    <div className="w-8 h-8 rounded-full p-[1px] bg-gradient-to-br from-at-orange to-at-red">
                        <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-at-orange font-bold text-xs">
                                    {user.username?.charAt(0).toUpperCase() || "U"}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-at-purple text-white text-[8px] font-display font-bold px-1 rounded-full border border-white dark:border-slate-900 shadow-sm">
                        LV.{level}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 font-display">
            {/* EXP Bar & Info */}
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-at-orange font-bold tracking-wider">LV.{level}</span>
                    <span className="text-slate-400 dark:text-slate-500">/</span>
                    <span className="text-slate-600 dark:text-slate-300">{user.username}</span>
                </div>

                {/* EXP Bar Container */}
                <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-at-orange to-at-red"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                    {/* Scanline effect */}
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" style={{ animationDuration: '2s' }} />
                </div>
            </div>

            {/* Avatar Hexagon */}
            <div className="relative group cursor-pointer">
                <div className="w-10 h-10 clip-hexagon bg-gradient-to-br from-at-orange to-at-purple p-[2px]">
                    <div className="w-full h-full clip-hexagon bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-at-orange font-bold text-sm">
                                {user.username?.charAt(0).toUpperCase() || "U"}
                            </span>
                        )}
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
            </div>
        </div>
    );
}

import { motion } from "framer-motion";

interface AchievementBadgeProps {
    name: string;
    description: string;
    icon: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    unlocked: boolean;
    size?: "sm" | "md" | "lg";
}

const rarityColors = {
    common: "from-gray-400 to-gray-600",
    rare: "from-blue-400 to-blue-600",
    epic: "from-purple-400 to-purple-600",
    legendary: "from-yellow-400 to-orange-500",
};

const rarityGlow = {
    common: "shadow-gray-500/50",
    rare: "shadow-blue-500/50",
    epic: "shadow-purple-500/50",
    legendary: "shadow-yellow-500/50",
};

export function AchievementBadge({
    name,
    description,
    icon,
    rarity,
    unlocked,
    size = "md",
}: AchievementBadgeProps) {
    const sizeClasses = {
        sm: "w-16 h-16 text-2xl",
        md: "w-24 h-24 text-4xl",
        lg: "w-32 h-32 text-5xl",
    };

    return (
        <motion.div
            className="relative group"
            whileHover={{ scale: unlocked ? 1.05 : 1 }}
            whileTap={{ scale: unlocked ? 0.95 : 1 }}
        >
            {/* Badge Container */}
            <div
                className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center relative overflow-hidden ${unlocked
                        ? `bg-gradient-to-br ${rarityColors[rarity]} shadow-lg ${rarityGlow[rarity]}`
                        : "bg-gray-800 opacity-40 grayscale"
                    }`}
            >
                {/* Shine Effect */}
                {unlocked && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{
                            x: ["-100%", "200%"],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3,
                        }}
                    />
                )}

                {/* Icon */}
                <span className="relative z-10">{icon}</span>

                {/* Lock Overlay */}
                {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <span className="text-2xl">🔒</span>
                    </div>
                )}
            </div>

            {/* Tooltip */}
            <motion.div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20"
                initial={{ y: 10 }}
                whileHover={{ y: 0 }}
            >
                <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                    <div className="font-bold text-sm">{name}</div>
                    <div className="text-xs text-gray-400">{description}</div>
                    <div className={`text-xs mt-1 font-bold bg-gradient-to-r ${rarityColors[rarity]} bg-clip-text text-transparent`}>
                        {rarity.toUpperCase()}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

import { motion } from "framer-motion";
import clsx from "clsx";

interface HexagonBadgeProps {
    icon: string;
    name: string;
    description: string;
    isUnlocked: boolean;
    size?: "sm" | "md" | "lg";
    onClick?: () => void;
}

export function HexagonBadge({
    icon,
    name,
    description,
    isUnlocked,
    size = "md",
    onClick
}: HexagonBadgeProps) {

    const sizeClasses = {
        sm: "w-24 h-24 text-2xl",
        md: "w-32 h-32 text-4xl",
        lg: "w-40 h-40 text-5xl",
    };

    return (
        <motion.div
            className={clsx(
                "relative group cursor-pointer",
                sizeClasses[size]
            )}
            onClick={onClick}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Hexagon Shape */}
            <div
                className={clsx(
                    "absolute inset-0 clip-hexagon transition-all duration-500",
                    isUnlocked
                        ? "bg-gradient-to-br from-at-orange/80 to-at-purple/80 backdrop-blur-md shadow-[0_0_30px_rgba(255,159,67,0.4)]"
                        : "bg-slate-800/50 backdrop-blur-sm border border-white/5"
                )}
            >
                {/* Inner Border */}
                <div className={clsx(
                    "absolute inset-[2px] clip-hexagon flex items-center justify-center transition-all duration-500",
                    isUnlocked
                        ? "bg-black/20"
                        : "bg-black/40"
                )}>
                    {/* Icon */}
                    <span className={clsx(
                        "filter transition-all duration-500",
                        isUnlocked
                            ? "grayscale-0 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            : "grayscale opacity-30 blur-[1px]"
                    )}>
                        {icon}
                    </span>
                </div>
            </div>

            {/* Locked Overlay (Scanlines) */}
            {!isUnlocked && (
                <div className="absolute inset-0 clip-hexagon bg-[url('/patterns/grid.svg')] opacity-20 pointer-events-none" />
            )}

            {/* Hover Info (Holographic Tooltip) */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                <div className="bg-black/80 backdrop-blur-xl border border-at-orange/30 p-3 rounded-lg text-center shadow-2xl relative overflow-hidden">
                    {/* Holographic Glint */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-pulse" />

                    <h4 className={clsx(
                        "font-display font-bold text-sm mb-1",
                        isUnlocked ? "text-at-orange" : "text-slate-500"
                    )}>
                        {isUnlocked ? name : "???"}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        {isUnlocked ? description : "此成就尚未解锁"}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

import { type HTMLMotionProps, motion } from "framer-motion";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function if not already present
function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
    variant?: "warm" | "sunset";
}

export function GlassCard({
    children,
    className,
    hoverEffect = true,
    variant = "warm",
    ...props
}: GlassCardProps) {
    const variantClasses = variant === "warm"
        ? "bg-gradient-to-br from-white/80 to-orange-50/60 dark:from-slate-800/80 dark:to-slate-900/60"
        : "bg-gradient-to-br from-orange-50/80 to-pink-50/60 dark:from-slate-800/80 dark:to-purple-900/60";

    return (
        <motion.div
            className={cn("glass-card relative overflow-hidden p-6 group", variantClasses, className)}
            whileHover={hoverEffect ? {
                y: -5,
                boxShadow: "0 16px 48px 0 rgba(255, 159, 67, 0.25)",
                borderColor: "rgba(255, 159, 67, 0.4)"
            } : {}}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            {...props}
        >
            {/* Noise Texture */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                }}
            />

            {/* Border Beam (Hover) */}
            {hoverEffect && (
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                </div>
            )}

            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
}

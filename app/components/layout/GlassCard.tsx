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
        ? "bg-gradient-to-br from-white/80 to-orange-50/60" 
        : "bg-gradient-to-br from-orange-50/80 to-pink-50/60";

    return (
        <motion.div
            className={cn("glass-card p-6", variantClasses, className)}
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
            {children}
        </motion.div>
    );
}

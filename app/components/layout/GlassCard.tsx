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
    /** 启用 3D 倾斜效果 */
    tiltEffect?: boolean;
}

export function GlassCard({
    children,
    className,
    hoverEffect = true,
    variant = "warm",
    tiltEffect = false,
    ...props
}: GlassCardProps) {
    const variantClasses = variant === "warm"
        ? "bg-gradient-to-br from-white/80 to-orange-50/60"
        : "bg-gradient-to-br from-orange-50/80 to-pink-50/60";

    // 增强的悬停动效 - 包含 3D 倾斜
    const hoverAnimation = hoverEffect ? {
        y: -8,
        rotateX: tiltEffect ? 2 : 0,  // 轻微 3D 倾斜
        rotateY: tiltEffect ? -1 : 0,
        scale: 1.01,
        boxShadow: "0 20px 50px -10px rgba(255, 159, 67, 0.3), 0 0 20px rgba(255, 159, 67, 0.1)",
        borderColor: "rgba(255, 159, 67, 0.5)",
        transition: {
            type: "spring" as const,
            stiffness: 400,
            damping: 25,
        }
    } : undefined;

    return (
        <motion.div
            className={cn("glass-card p-6", variantClasses, className)}
            style={{ transformStyle: tiltEffect ? "preserve-3d" : undefined }}
            whileHover={hoverAnimation}
            whileTap={hoverEffect ? { scale: 0.98 } : {}}
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


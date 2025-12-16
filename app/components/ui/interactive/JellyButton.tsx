import { motion, type HTMLMotionProps } from "framer-motion";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function if not already present
function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface JellyButtonProps extends HTMLMotionProps<"button"> {
    children: React.ReactNode;
    className?: string;
    variant?: "primary" | "secondary";
}

export function JellyButton({ 
    children, 
    className, 
    variant = "primary",
    ...props 
}: JellyButtonProps) {
    const variantClasses = variant === "primary" 
        ? "bg-gradient-to-r from-primary-start to-primary-end text-white shadow-soft-orange"
        : "bg-gradient-to-r from-white to-orange-50 text-primary-start border shadow-soft-orange";

    const borderStyle = variant === "secondary" ? { borderColor: 'rgba(255, 159, 67, 0.3)' } : {};

    return (
        <motion.button
            className={cn(
                "px-8 py-3 rounded-full font-bold text-lg uppercase tracking-wider transition-all duration-300",
                "hover:shadow-lg hover:shadow-primary-start/20",
                "relative overflow-hidden",
                variantClasses,
                className
            )}
            style={borderStyle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            {...props}
        >
            {/* 内部高光 */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 rounded-full blur-sm transform -translate-y-1/2 animate-pulse-slow" />
            {children}
        </motion.button>
    );
}

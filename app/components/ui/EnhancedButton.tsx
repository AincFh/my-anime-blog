/**
 * 增强按钮组件 (Enhanced Button)
 * 
 * 特性：
 * - 丰富的微交互反馈
 * - 性能感知动效降级
 * - 多种视觉变体
 */

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface EnhancedButtonProps extends HTMLMotionProps<"button"> {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    /** 是否启用涟漪效果 */
    ripple?: boolean;
    /** 是否启用发光效果 */
    glow?: boolean;
    isLoading?: boolean;
}

const variantStyles = {
    primary: "bg-gradient-to-r from-primary-start to-primary-end text-white shadow-soft-orange",
    secondary: "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50",
    ghost: "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50",
    danger: "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg",
};

const sizeStyles = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-5 py-2.5 text-base rounded-xl",
    lg: "px-8 py-4 text-lg rounded-2xl font-semibold",
};

const glowStyles = {
    primary: "hover:shadow-[0_0_30px_rgba(255,159,67,0.4)]",
    secondary: "hover:shadow-[0_0_20px_rgba(100,116,139,0.2)]",
    ghost: "",
    danger: "hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]",
};

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
    function EnhancedButton(
        {
            children,
            variant = "primary",
            size = "md",
            ripple = true,
            glow = true,
            isLoading = false,
            className,
            disabled,
            ...props
        },
        ref
    ) {
        return (
            <motion.button
                ref={ref}
                className={cn(
                    "relative overflow-hidden font-medium transition-all duration-300",
                    "focus:outline-none focus:ring-2 focus:ring-primary-start/50 focus:ring-offset-2",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
                    variantStyles[variant],
                    sizeStyles[size],
                    glow && glowStyles[variant],
                    className
                )}
                whileHover={{
                    scale: disabled ? 1 : 1.03,
                    y: disabled ? 0 : -2,
                }}
                whileTap={{
                    scale: disabled ? 1 : 0.97,
                }}
                transition={{
                    type: "spring" as const,
                    stiffness: 500,
                    damping: 30,
                }}
                disabled={disabled || isLoading}
                {...props}
            >
                {/* 渐变叠加层（悬停时显示） */}
                <motion.div
                    className="absolute inset-0 bg-white/10 opacity-0 pointer-events-none"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                />

                {/* 内容 */}
                <span className={cn(
                    "relative z-10 flex items-center justify-center gap-2",
                    isLoading && "opacity-0"
                )}>
                    {children}
                </span>

                {/* 加载状态 */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        />
                    </div>
                )}
            </motion.button>
        );
    }
);

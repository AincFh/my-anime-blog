import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { type HTMLMotionProps, motion } from "framer-motion";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface SoftCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
}

export function SoftCard({ children, className, ...props }: SoftCardProps) {
    return (
        <motion.div
            className={cn("soft-panel p-6", className)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            {...props}
        >
            {children}
        </motion.div>
    );
}

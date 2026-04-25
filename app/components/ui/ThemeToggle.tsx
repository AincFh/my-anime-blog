import { Moon, Sun } from "lucide-react";
import { Theme, useTheme } from "remix-themes";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
    const [theme, setTheme] = useTheme();
    const isDark = theme === Theme.DARK;

    const toggleTheme = () => {
        setTheme(isDark ? Theme.LIGHT : Theme.DARK);
    };

    return (
        <motion.button
            onClick={toggleTheme}
            className="relative w-10 h-10 rounded-full
              bg-white/15 dark:bg-white/8
              backdrop-blur-md
              border border-white/25 dark:border-white/15
              hover:bg-white/25 dark:hover:bg-white/12
              transition-all duration-200
              flex items-center justify-center overflow-hidden group"
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.08 }}
            aria-label="Toggle Theme"
        >
            {/* 背景光晕动效 - 更柔和 */}
            <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                    background: isDark
                        ? "radial-gradient(circle, rgba(255, 159, 67, 0.15) 0%, transparent 70%)"
                        : "radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%)",
                }}
                transition={{ duration: 0.4 }}
            />

            <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                    <motion.div
                        key="moon"
                        initial={{ y: -24, opacity: 0, rotate: -90, scale: 0.5 }}
                        animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ y: 24, opacity: 0, rotate: 90, scale: 0.5 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="flex items-center justify-center"
                    >
                        <Moon className="w-5 h-5 text-white/80 drop-shadow-[0_0_6px_rgba(255,159,67,0.5)]" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sun"
                        initial={{ y: -24, opacity: 0, rotate: -90, scale: 0.5 }}
                        animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ y: 24, opacity: 0, rotate: 90, scale: 0.5 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="flex items-center justify-center"
                    >
                        <Sun className="w-5 h-5 text-amber-500 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
}

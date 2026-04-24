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
            className="relative w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center overflow-hidden group"
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.08 }}
            aria-label="Toggle Theme"
        >
            {/* 背景光晕动效 */}
            <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                    background: isDark
                        ? "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)"
                        : "radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)",
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
                        <Moon className="w-5 h-5 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
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
                        <Sun className="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
}

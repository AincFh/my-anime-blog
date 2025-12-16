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
            className="relative w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center overflow-hidden"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            aria-label="Toggle Theme"
        >
            <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                    <motion.div
                        key="moon"
                        initial={{ y: -20, opacity: 0, rotate: -90 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: 20, opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="flex items-center justify-center"
                    >
                        <Moon className="w-5 h-5 text-blue-400" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sun"
                        initial={{ y: -20, opacity: 0, rotate: -90 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: 20, opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="flex items-center justify-center"
                    >
                        <Sun className="w-5 h-5 text-orange-500" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
}

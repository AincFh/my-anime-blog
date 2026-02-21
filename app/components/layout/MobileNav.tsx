import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Book, Tv, ShoppingBag, User } from "lucide-react";
import { cn } from "~/utils/cn";

export function MobileNav() {
    const location = useLocation();

    const tabs = [
        { name: "首页", path: "/", icon: Home },
        { name: "文章", path: "/articles", icon: Book },
        { name: "番剧", path: "/bangumi", icon: Tv },
        { name: "我的", path: "/user/dashboard", icon: User },
    ];

    return (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
            <nav className="
                flex items-center justify-around p-2 rounded-2xl
                bg-white/80 dark:bg-slate-900/80 
                backdrop-blur-xl border border-white/20 dark:border-white/10
                shadow-lg shadow-black/5
            ">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path ||
                        (tab.path !== "/" && location.pathname.startsWith(tab.path));

                    return (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            prefetch="intent"
                            className={cn(
                                "relative flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors",
                                isActive ? "text-primary-start" : "text-slate-400 dark:text-slate-500"
                            )}
                        >
                            {/* 背景高亮 */}
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-active"
                                    className="absolute inset-0 bg-primary-start/10 dark:bg-primary-start/20 rounded-xl"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}

                            {/* 图标与文字 */}
                            <div className="relative z-10 flex flex-col items-center gap-1">
                                <motion.div
                                    animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                >
                                    <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                </motion.div>
                                <motion.span
                                    className="text-[10px] font-medium"
                                    animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0.8, y: 0 }}
                                >
                                    {tab.name}
                                </motion.span>
                            </div>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

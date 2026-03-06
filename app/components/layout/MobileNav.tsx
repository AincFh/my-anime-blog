import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Book, Tv, ShoppingBag, User } from "lucide-react";
import { cn } from "~/utils/cn";

export function MobileNav() {
    const location = useLocation();

    const tabs = [
        { name: "首页", path: "/", icon: Home },
        { name: "文章", path: "/articles", icon: Book },
        { name: "商城", path: "/shop", icon: ShoppingBag },
        { name: "番剧", path: "/bangumi", icon: Tv },
        { name: "我的", path: "/user/dashboard", icon: User },
    ];

    return (
        <div className="md:hidden fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] left-1/2 -translate-x-1/2 z-50">
            <nav className="
                flex items-center py-2.5 px-3 rounded-full gap-2
                /* --- iOS 玻璃态核心样式 (与 FloatingNav 一致) --- */
                bg-white/60
                backdrop-blur-xl
                border border-white/40
                shadow-[0_8px_30px_rgb(0,0,0,0.12)]
                dark:bg-slate-900/60 dark:border-white/10
            ">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path ||
                        (tab.path !== "/" && location.pathname.startsWith(tab.path));

                    return (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            prefetch="intent"
                            style={{ WebkitTapHighlightColor: "transparent" }}
                            className={cn(
                                "group relative flex flex-col items-center justify-center w-[4rem] h-[3.5rem] rounded-full transition-colors active:scale-95",
                                isActive ? "text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400"
                            )}
                        >
                            {/* 图标与文字 */}
                            <div className="relative z-10 flex flex-col items-center gap-1 transition-transform duration-200">
                                <tab.icon
                                    size={20}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={isActive ? "" : "group-hover:scale-110 transition-transform duration-200"}
                                />
                                <span className="text-[9px] font-bold tracking-wider">
                                    {tab.name}
                                </span>
                            </div>

                            {/* 与 FloatingNav 完全一致的极简流体小圆点指示器 */}
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-active-indicator"
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 40,
                                        mass: 0.8
                                    }}
                                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-800 dark:bg-white rounded-full shadow-sm"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";
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
            <nav className="nav-mobile flex items-center py-2.5 px-3 rounded-[2rem] gap-2">
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
                                "group relative flex flex-col items-center justify-center w-[4rem] h-[3.5rem] rounded-full transition-all duration-200 ease-out active:scale-95",
                                isActive
                                    ? "text-slate-800 dark:text-white"
                                    : "text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white"
                            )}
                        >
                            {/* 图标与文字 */}
                            <div className="relative z-10 flex flex-col items-center gap-1 transition-all duration-200 ease-out">
                                <tab.icon
                                    size={20}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={cn(
                                        "transition-all duration-200 ease-out group-hover:scale-110",
                                        isActive
                                            ? "text-primary-start dark:text-primary-start"
                                            : "text-slate-400 dark:text-white/35 group-hover:text-primary-start dark:group-hover:text-white/90"
                                    )}
                                />
                                <span className="text-[9px] font-bold tracking-wider">{tab.name}</span>
                            </div>

                            {/* 指示器小圆点 */}
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-active-indicator"
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 40,
                                        mass: 0.8
                                    }}
                                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary-start dark:bg-primary-start rounded-full shadow-[0_0_8px_rgba(255,159,67,0.7),0_0_16px_rgba(255,159,67,0.4)] dark:shadow-[0_0_10px_rgba(255,159,67,0.9),0_0_20px_rgba(255,159,67,0.5)]"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

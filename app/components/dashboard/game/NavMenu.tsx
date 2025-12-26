import { motion } from "framer-motion";
import { Home, Backpack, Trophy, Settings, LogOut, LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router";

interface NavItem {
    id: string;
    label: string;
    icon: LucideIcon;
    path: string;
}

const NAV_ITEMS: NavItem[] = [
    { id: "home", label: "指挥中心", icon: Home, path: "/user/dashboard" },
    { id: "inventory", label: "背包", icon: Backpack, path: "/user/inventory" }, // TODO: Create route
    { id: "achievements", label: "成就", icon: Trophy, path: "/user/achievements" }, // TODO: Create route
    { id: "settings", label: "设置", icon: Settings, path: "/settings" },
];

export function NavMenu() {
    const location = useLocation();

    return (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 pl-6">
            <div className="flex flex-col gap-4">
                {NAV_ITEMS.map((item, index) => {
                    const isActive = location.pathname === item.path;

                    return (
                        <Link key={item.id} to={item.path}>
                            <motion.div
                                className="group flex items-center gap-4 cursor-pointer"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 * index }}
                                whileHover={{ x: 10 }}
                            >
                                {/* 图标容器 (菱形) */}
                                <div className={`
                        w-12 h-12 flex items-center justify-center transform rotate-45 border-2 transition-all duration-300
                        ${isActive
                                        ? "bg-white text-slate-900 border-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                        : "bg-black/40 text-white/70 border-white/20 group-hover:bg-black/60 group-hover:text-white group-hover:border-white/60"
                                    }
                    `}>
                                    <item.icon className={`w-5 h-5 -rotate-45 ${isActive ? "text-slate-900" : "text-white"}`} />
                                </div>

                                {/* 文字标签 (悬停显示) */}
                                <div className="relative overflow-hidden">
                                    <motion.span
                                        className={`text-lg font-bold font-display tracking-wider ${isActive ? "text-white" : "text-white/60 group-hover:text-white"}`}
                                        initial={{ opacity: 0.6 }}
                                        whileHover={{ opacity: 1 }}
                                    >
                                        {item.label}
                                    </motion.span>
                                    {/* 下划线动画 */}
                                    <motion.div
                                        className="absolute bottom-0 left-0 h-[2px] bg-white"
                                        initial={{ width: 0 }}
                                        animate={{ width: isActive ? "100%" : "0%" }}
                                        whileHover={{ width: "100%" }}
                                    />
                                </div>
                            </motion.div>
                        </Link>
                    );
                })}

                {/* 分隔线 */}
                <motion.div
                    className="w-8 h-[1px] bg-white/20 my-2 ml-2"
                    initial={{ width: 0 }}
                    animate={{ width: 32 }}
                    transition={{ delay: 0.5 }}
                />

                {/* 退出按钮 */}
                <form action="/logout" method="post">
                    <button type="submit" className="group flex items-center gap-4 cursor-pointer w-full text-left">
                        <div className="w-10 h-10 flex items-center justify-center transform rotate-45 border-2 border-red-500/30 bg-red-500/10 text-red-400 transition-all duration-300 group-hover:bg-red-500 group-hover:text-white group-hover:border-red-500 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                            <LogOut className="w-4 h-4 -rotate-45" />
                        </div>
                        <span className="text-sm font-bold text-red-400/80 group-hover:text-red-400 transition-colors">退出</span>
                    </button>
                </form>
            </div>
        </div>
    );
}

import { Outlet, useLocation, useLoaderData, redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { GameDashboardLayout } from "~/components/dashboard/game/GameDashboardLayout";
import { getSessionToken, verifySession } from "~/services/auth.server";
import { getUnreadCount } from "~/services/notification.server";
import { NotificationPanel } from "~/components/user/NotificationPanel";
import { useState } from "react";
import { Bell } from "lucide-react";

export async function loader({ request, context }: LoaderFunctionArgs) {
    const { anime_db } = context.cloudflare.env as { anime_db: import('~/services/db.server').Database };
    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        throw redirect("/login");
    }

    let backgroundImage: string | null = null;
    if (user?.preferences) {
        try {
            const prefs = JSON.parse(user.preferences);
            backgroundImage = prefs.equipped_theme || null;
        } catch {
            // ignore
        }
    }

    let unreadCount = 0;
    try {
        unreadCount = await getUnreadCount(anime_db, user.id);
    } catch {
        // ignore if notification table doesn't exist yet
    }

    return { backgroundImage, unreadCount };
}

export default function GameLayout() {
    const location = useLocation();
    const loaderData = useLoaderData<typeof loader>();
    const { backgroundImage, unreadCount: initialUnread } = loaderData;
    // API 返回的原始通知数据，由 NotificationPanel 内部映射
const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(initialUnread || 0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    // 加载通知
    const loadNotifications = async () => {
        try {
            const res = await fetch("/api/user/notifications");
            if (res.ok) {
                const data = await res.json() as { notifications?: any[]; unreadCount?: number };
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch {
            // ignore
        }
    };

    // 打开时加载
    const handleNotifOpen = () => {
        setIsNotifOpen(true);
        loadNotifications();
    };

    const handleNotifClose = () => {
        setIsNotifOpen(false);
        setNotifications([]);
    };

    const handleMarkRead = async (id: string) => {
        await fetch("/api/user/notifications", {
            method: "POST",
            body: new URLSearchParams({ action: "mark", id }),
        });
        setUnreadCount((c: number) => Math.max(0, c - 1));
        setNotifications((prev: any[]) => prev.map(n => n.id.toString() === id ? { ...n, is_read: 1 } : n));
    };

    const handleMarkAllRead = async () => {
        await fetch("/api/user/notifications", {
            method: "POST",
            body: new URLSearchParams({ action: "mark_all" }),
        });
        setUnreadCount(0);
        setNotifications((prev: any[]) => prev.map(n => ({ ...n, is_read: 1 })));
    };

    return (
        <>
            {/* 通知按钮（浮在右下角） */}
            <button
                onClick={handleNotifOpen}
                className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-indigo-500/80 backdrop-blur-md border border-indigo-400/30 flex items-center justify-center text-white shadow-lg hover:bg-indigo-500 transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <NotificationPanel
                notifications={notifications}
                isOpen={isNotifOpen}
                onClose={handleNotifClose}
                onRead={handleMarkRead}
            />

            <GameDashboardLayout backgroundImage={backgroundImage}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-full h-full"
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </GameDashboardLayout>
        </>
    );
}

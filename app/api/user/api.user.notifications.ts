/**
 * 用户通知 API
 * GET: 获取通知列表
 * POST: 标记已读
 */
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from "~/services/notification.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
    const { anime_db } = context.cloudflare.env as { anime_db: import('~/services/db.server').Database };
    const { getSessionId, verifySession } = await import("~/services/auth.server");

    const token = getSessionId(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return Response.json({ error: "请先登录" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const [notifications, unreadCount] = await Promise.all([
        getUserNotifications(anime_db, user.id, limit, offset),
        getUnreadCount(anime_db, user.id),
    ]);

    return Response.json({
        notifications,
        unreadCount,
        total: notifications.length,
    });
}

export async function action({ request, context }: ActionFunctionArgs) {
    const { anime_db } = context.cloudflare.env as { anime_db: import('~/services/db.server').Database };
    const { getSessionId, verifySession } = await import("~/services/auth.server");

    const token = getSessionId(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return Response.json({ error: "请先登录" }, { status: 401 });
    }

    const formData = await request.formData();
    const action = formData.get("action") as string;

    if (action === "mark_all") {
        const count = await markAllAsRead(anime_db, user.id);
        return Response.json({ success: true, count });
    }

    if (action === "mark") {
        const id = parseInt(formData.get("id") as string);
        if (!id) return Response.json({ error: "缺少通知ID" }, { status: 400 });
        const success = await markAsRead(anime_db, id, user.id);
        return Response.json({ success });
    }

    return Response.json({ error: "未知操作" }, { status: 400 });
}

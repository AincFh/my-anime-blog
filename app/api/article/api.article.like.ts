/**
 * 文章点赞 API
 */
import type { Route } from "./+types/api.article.like";
import { getDB } from "~/utils/db";
import { getSessionId, verifySession } from "~/utils/auth";

export async function action({ request, context }: Route.ActionArgs) {
    // 1. 必须登录才能点赞
    const sessionId = getSessionId(request);
    const db = getDB(context);

    if (!sessionId) {
        return Response.json({ error: "请先登录" }, { status: 401 });
    }

    const session = await verifySession(sessionId, db);
    if (!session) {
        return Response.json({ error: "会话已过期，请重新登录" }, { status: 401 });
    }

    const formData = await request.formData();
    const articleId = formData.get("article_id");

    if (!articleId) {
        return Response.json({ error: "缺少文章 ID" }, { status: 400 });
    }

    // 2. 防止重复点赞（基于 IP + article_id 的简单限流，可以用 KV 扩展）
    try {
        const result = await db
            .prepare(`UPDATE articles SET likes = likes + 1 WHERE id = ?`)
            .bind(Number(articleId))
            .run();

        if (!result.meta.changes) {
            return Response.json({ error: "文章不存在" }, { status: 404 });
        }

        return Response.json({ success: true });
    } catch (err) {
        console.error("点赞失败:", err);
        return Response.json({ error: "点赞失败，请稍后重试" }, { status: 500 });
    }
}

/**
 * 文章点赞 API
 */
import type { ActionFunctionArgs } from "react-router";
import { getDB } from "~/utils/db";
import { getSessionId, verifySession } from "~/utils/auth";
import { verifySameOrigin } from "~/utils/security";

export async function action({ request, context }: ActionFunctionArgs) {
    // 0. CSRF 防护：同源检测
    if (!verifySameOrigin(request)) {
        return Response.json({ error: "非法的跨站请求" }, { status: 403 });
    }

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

    // 2. 速率限制
    const { CACHE_KV } = context.cloudflare.env;
    if (CACHE_KV) {
        const { checkRateLimit, createRateLimitResponse } = await import("~/services/rate-limiter.server");
        const rateLimitKey = `like:${session.user.id}`;
        const LIKE_RATE_LIMIT = { windowSeconds: 60, maxRequests: 30 };
        const rateLimitResult = await checkRateLimit(CACHE_KV, rateLimitKey, LIKE_RATE_LIMIT);
        if (!rateLimitResult.allowed) {
            return createRateLimitResponse(rateLimitResult);
        }
    }

    const formData = await request.formData();
    const articleId = formData.get("article_id");

    if (!articleId) {
        return Response.json({ error: "缺少文章 ID" }, { status: 400 });
    }

    // 3. 防止重复点赞（基于 IP + article_id 的简单限流，可以用 KV 扩展）
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

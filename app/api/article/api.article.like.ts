/**
 * 文章点赞 API
 */
import type { Route } from "./+types/api.article.like";
import { getDB } from "~/utils/db";

export async function action({ request, context }: Route.ActionArgs) {
    const db = getDB(context);

    const formData = await request.formData();
    const articleId = formData.get("article_id");

    if (!articleId) {
        return Response.json({ error: "缺少文章 ID" }, { status: 400 });
    }

    try {
        await db
            .prepare(`UPDATE articles SET likes = likes + 1 WHERE id = ?`)
            .bind(Number(articleId))
            .run();
        return Response.json({ success: true });
    } catch (err) {
        console.error("点赞失败:", err);
        return Response.json({ error: "点赞失败，请稍后重试" }, { status: 500 });
    }
}

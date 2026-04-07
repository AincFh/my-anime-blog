import type { Route } from "./+types/api.comments";
import { sanitizeComment, jsonWithSecurity, verifySameOrigin } from "~/utils/security";
import { getSessionId, verifySession } from "~/utils/auth";
import { updateMissionProgress } from "~/services/membership/mission.server";
import { z } from "zod";

/** 评论输入验证 schema */
const CommentSchema = z.object({
    content: z.string().min(3, "评论内容过短").max(2000, "内容超出字数限制"),
    article_id: z.string().regex(/^\d+$/, "文章 ID 格式错误"),
    author: z.string().max(50, "昵称过长").optional(),
    "cf-turnstile-response": z.string().min(1, "安全校验令牌缺失"),
});

/**
 * 评论API
 * 加固：防止 Turnstile 绕过与会话一致性锁定 / 同源死锁防御CSRF
 */
export async function action({ request, context }: Route.ActionArgs) {
    // 0. CSRF 物理风控拦截
    if (!verifySameOrigin(request)) {
        return Response.json({ error: "非法的跨站请求" }, { status: 403 });
    }

    const env = (context as any).cloudflare.env;
    const { anime_db } = env;
    const formData = await request.formData();

    const rawData = {
        content: formData.get("content") as string | null,
        article_id: formData.get("article_id") as string | null,
        author: formData.get("author") as string | null,
        "cf-turnstile-response": formData.get("cf-turnstile-response") as string | null,
    };

    // 1. Zod 输入验证
    const parsed = CommentSchema.safeParse(rawData);
    if (!parsed.success) {
        const firstError = parsed.error.errors[0];
        return Response.json({ error: firstError.message }, { status: 400 });
    }

    const { content, article_id: articleId } = parsed.data;
    const authorInput = rawData.author;
    const turnstileToken = rawData["cf-turnstile-response"]!;

    // 2. 验证Turnstile Token (必须强制验证)
    if (!turnstileToken) {
        return Response.json({ error: "安全校验令牌缺失" }, { status: 400 });
    }

    const turnstileSecret = env.TURNSTILE_SECRET;
    if (!turnstileSecret) {
        console.warn("Turnstile secret not configured, assuming dev environment");
    } else {
        try {
            const verifyResult = await fetch(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        secret: turnstileSecret,
                        response: turnstileToken,
                    }),
                }
            );

            const outcome = await verifyResult.json() as { success: boolean };
            if (!outcome.success) {
                return Response.json({ error: "极盾风控检测未通过，请刷新重试" }, { status: 400 });
            }
        } catch (error) {
            console.error("Turnstile verification error:", error);
            return Response.json({ error: "安全验证服务暂不可用" }, { status: 500 });
        }
    }

    // 3. 身份验证
    const sessionId = getSessionId(request);
    const session = await verifySession(sessionId, anime_db);

    // 区分用户与游客
    const userId = session?.userId ?? null;
    const guestName = !userId ? (authorInput || "次元访客") : null;

    // 4. 清理和验证内容
    const cleanedContent = sanitizeComment(content);
    if (!cleanedContent || cleanedContent.length < 3) {
        return Response.json({ error: "评论内容过短" }, { status: 400 });
    }

    // 限制恶意超长内容
    if (cleanedContent.length > 2000) {
        return Response.json({ error: "内容超出字数限制" }, { status: 400 });
    }

    // 5. 文章存在性验证
    const article = await anime_db.prepare("SELECT id FROM articles WHERE id = ?").bind(Number(articleId)).first();
    if (!article) {
        return Response.json({ error: "文章不存在" }, { status: 404 });
    }

    try {
        await anime_db
            .prepare(
                `INSERT INTO comments (article_id, user_id, guest_name, content, is_danmaku, status)
         VALUES (?, ?, ?, ?, ?, ?)`
            )
            .bind(articleId, userId, guestName, cleanedContent, false, "approved")
            .run();

        // 6. 更新任务/成就进度
        if (userId) {
            try {
                await updateMissionProgress(anime_db, userId, "comment");
            } catch (e) {
                console.warn("Mission update failed, but comment saved", e);
            }
        }

        return jsonWithSecurity({ success: true, message: "发送成功" });
    } catch (error) {
        console.error("Database persistence failed:", error);
        return jsonWithSecurity({ error: "评论持久化失败" }, { status: 500 });
    }
}

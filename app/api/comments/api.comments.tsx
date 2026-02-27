import type { Route } from "./+types/api.comments";
import { sanitizeComment, jsonWithSecurity } from "~/utils/security";
import { getSessionId, verifySession } from '~/utils/auth';
import { updateMissionProgress } from '~/services/membership/mission.server';

/**
 * 评论API
 * 加固：防止 Turnstile 绕过与会话一致性锁定
 */
export async function action({ request, context }: Route.ActionArgs) {
  const env = (context as any).cloudflare.env;
  const { anime_db } = env;
  const formData = await request.formData();

  const content = formData.get("content") as string;
  const articleId = formData.get("article_id") as string;
  const authorInput = formData.get("author") as string;
  const turnstileToken = formData.get("cf-turnstile-response") as string;

  // 1. 验证Turnstile Token (必须强制验证)
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

  // 2. 身份验证
  const sessionId = getSessionId(request);
  const session = await verifySession(sessionId, anime_db);
  const finalAuthor = session ? session.username : (authorInput || "次元访客");

  // 3. 清理和验证内容
  const cleanedContent = sanitizeComment(content);
  if (!cleanedContent || cleanedContent.length < 3) {
    return Response.json({ error: "评论内容过短" }, { status: 400 });
  }

  // 限制恶意超长内容
  if (cleanedContent.length > 2000) {
    return Response.json({ error: "内容超出字数限制" }, { status: 400 });
  }

  try {
    await anime_db
      .prepare(
        `INSERT INTO comments (article_id, author, content, is_danmaku, status, is_spam)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(articleId, finalAuthor, cleanedContent, false, "approved", false)
      .run();

    // 4. 更新任务/成就进度
    if (session) {
      try {
        await updateMissionProgress(anime_db, session.userId, 'comment');
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

import type { Route } from "./+types/api.admin.comments";
import { jsonWithSecurity } from "~/utils/security";
import { getSessionId } from "~/utils/auth";

/**
 * 管理员评论管理 API
 * 功能：批准、删除评论
 */
export async function action({ request, context }: Route.ActionArgs) {
    // 1. 权限验证
    // 1. 权限验证
    const { requireAdmin } = await import("~/utils/auth");
    const { anime_db } = (context as any).cloudflare.env;

    // 强制校验管理员权限
    const session = await requireAdmin(request, anime_db);
    if (!session) {
        return jsonWithSecurity({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const formData = await request.formData();

    // 2. CSRF 校验
    const env = (context as any).cloudflare.env;
    const { validateCSRFToken } = await import("~/services/security/csrf.server");
    const csrfToken = formData.get("_csrf") as string;
    // 使用 PAYMENT_SECRET 作为备用密钥 (实际应配置 CSRF_SECRET)
    const secret = env.CSRF_SECRET || env.PAYMENT_SECRET || "default-secret";

    // Session ID 在 session.sessionId 中 (根据 utils/auth.ts 类型定义)
    // requireAdmin 返回的 session 对象结构: { sessionId, userId, ... }
    const csrfResult = await validateCSRFToken(csrfToken, session.sessionId, env.CACHE_KV, secret);

    if (!csrfResult.valid) {
        return jsonWithSecurity({ error: "CSRF Validation Failed: " + csrfResult.error }, { status: 403 });
    }

    const intent = formData.get("intent") as string;
    const commentId = formData.get("commentId") as string;

    if (!commentId) {
        return jsonWithSecurity({ error: "Missing comment ID" }, { status: 400 });
    }

    try {
        if (intent === "approve") {
            await anime_db
                .prepare("UPDATE comments SET status = 'approved' WHERE id = ?")
                .bind(commentId)
                .run();
            return jsonWithSecurity({ success: true, message: "评论已批准" });
        }

        else if (intent === "delete") {
            await anime_db
                .prepare("DELETE FROM comments WHERE id = ?")
                .bind(commentId)
                .run();
            return jsonWithSecurity({ success: true, message: "评论已删除" });
        }

        return jsonWithSecurity({ error: "Invalid intent" }, { status: 400 });
    } catch (error) {
        console.error("Admin comment action failed:", error);
        return jsonWithSecurity({ error: "Operation failed" }, { status: 500 });
    }
}

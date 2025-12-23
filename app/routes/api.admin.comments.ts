import type { Route } from "./+types/api.admin.comments";
import { jsonWithSecurity } from "~/utils/security";
import { getSessionId } from "~/utils/auth";

/**
 * 管理员评论管理 API
 * 功能：批准、删除评论
 */
export async function action({ request, context }: Route.ActionArgs) {
    // 1. 权限验证
    const sessionId = getSessionId(request);
    if (!sessionId) {
        return jsonWithSecurity({ error: "Unauthorized" }, { status: 401 });
    }

    const { anime_db } = (context as any).cloudflare.env;
    const formData = await request.formData();
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

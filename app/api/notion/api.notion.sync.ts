/**
 * Notion 同步 API 端点
 * 
 * GET  /api/notion/sync - 手动触发同步
 * GET  /api/notion/sync-status - 获取同步状态和历史
 */
import type { Route } from "./+types/api.notion.sync";
import { getSessionId } from "~/utils/auth";
import { syncNotionArticles, getSyncHistory } from "~/services/notion-sync.server";

export async function loader({ request, context }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "status";

    // 管理权限验证
    const env = (context as any).cloudflare?.env;
    const db = env?.anime_db;

    const sessionId = getSessionId(request);
    if (!sessionId || !db) {
        return Response.json({ error: "未授权" }, { status: 401 });
    }

    const { verifySession } = await import("~/utils/auth");
    const session = await verifySession(sessionId, db);

    if (!session || session.role !== "admin") {
        return Response.json({ error: "需要管理员权限" }, { status: 403 });
    }

    // 检查 Notion 配置
    if (!env.NOTION_TOKEN || !env.NOTION_DATABASE_ID) {
        return Response.json({
            error: "Notion 未配置",
            message: "请设置 NOTION_TOKEN 和 NOTION_DATABASE_ID 环境变量"
        }, { status: 400 });
    }

    const kv = env.CACHE_KV || null;

    if (action === "status") {
        // 获取同步状态
        const history = await getSyncHistory(kv);
        const lastSync = history[0] || null;
        
        return Response.json({
            configured: true,
            lastSync,
            history: history.slice(0, 10)
        });
    }

    if (action === "sync") {
        // 执行同步
        console.log("[API] Starting Notion sync...");
        
        const result = await syncNotionArticles(
            db,
            env.NOTION_TOKEN,
            env.NOTION_DATABASE_ID,
            kv
        );

        return Response.json({
            success: result.success,
            message: result.success 
                ? `同步完成：新增 ${result.added}，更新 ${result.updated}，删除 ${result.deleted}`
                : "同步失败",
            details: result,
            timestamp: Date.now()
        });
    }

    return Response.json({ error: "未知操作" }, { status: 400 });
}

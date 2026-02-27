/**
 * 系统监控与健康检查 API
 * 用于后台看板实时监测数据库、KV 及外部服务状态
 */

import type { Route } from "./+types/api.system.health";
import { queryFirst } from "~/services/db.server";

export async function loader({ context, request }: Route.LoaderArgs) {
    // 仅限管理员访问
    const env = (context as any).cloudflare.env;
    const db = env.anime_db;

    const { requireAdmin } = await import("~/utils/auth");
    const session = await requireAdmin(request, db);
    if (!session) {
        return Response.json({ status: "error", message: "🔒 Access Denied" }, { status: 401 });
    }

    const healthData: any = {
        status: "healthy",
        timestamp: Date.now(),
        services: {
            database: "unknown",
            kv: "unknown",
            ai: "unknown",
        }
    };

    try {
        // 1. 验证数据库
        const dbTest = await queryFirst(db, "SELECT 1 as test");
        healthData.services.database = dbTest ? "online" : "offline";
    } catch (e) {
        healthData.services.database = "error";
        healthData.status = "degraded";
    }

    try {
        // 2. 验证 KV
        const kv = env.CACHE_KV;
        if (kv) {
            await kv.put("_health_check", "ok", { expirationTtl: 60 });
            healthData.services.kv = "online";
        } else {
            healthData.services.kv = "not_configured";
        }
    } catch (e) {
        healthData.services.kv = "error";
        healthData.status = "degraded";
    }

    // 3. AI 服务状态（基于配置）
    const { getAIConfig } = await import("~/services/ai-config.server");
    try {
        const aiConfig = await getAIConfig(db);
        healthData.services.ai = aiConfig.enabled ? "ready" : "disabled";
    } catch (e) {
        healthData.services.ai = "config_error";
    }

    return Response.json(healthData);
}

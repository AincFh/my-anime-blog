import { createRequestHandler } from "react-router";

const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE
);

export default {
    fetch(request: Request, env: Env, ctx: ExecutionContext) {
        return requestHandler(request, {
            cloudflare: { env: env as any, cf: request.cf as any, ctx },
        });
    },

    // Cron Trigger: 定时同步 Notion
    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
        console.log('[Cron] Triggered at:', new Date(event.scheduledTime).toISOString());

        // 只处理 Notion 同步定时任务
        if (event.cron === "0 */6 * * *") {
            console.log('[Cron] Starting Notion sync...');

            try {
                // 动态导入同步服务
                const { syncNotionArticles } = await import("~/services/notion-sync.server");
                
                const result = await syncNotionArticles(
                    env.anime_db,
                    env.NOTION_TOKEN,
                    env.NOTION_DATABASE_ID,
                    env.CACHE_KV
                );

                console.log('[Cron] Sync result:', {
                    success: result.success,
                    added: result.added,
                    updated: result.updated,
                    deleted: result.deleted,
                    errors: result.errors.length
                });
            } catch (error) {
                console.error('[Cron] Sync failed:', error);
            }
        }
    },
} satisfies ExportedHandler<Env>;

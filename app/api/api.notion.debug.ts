/**
 * Notion API 调试端点 — 用于验证属性映射
 * 使用后请删除
 */
import type { Route } from "./+types/api.notion.debug";

export async function loader({ context }: Route.LoaderArgs) {
    try {
        const env = context.cloudflare.env;

        if (!env.NOTION_TOKEN) {
            return Response.json({ error: "NOTION_TOKEN not set" });
        }
        if (!env.NOTION_DATABASE_ID) {
            return Response.json({ error: "NOTION_DATABASE_ID not set" });
        }

        // 直接调用 Notion API，不走缓存，不过滤状态
        const response = await fetch(
            `https://api.notion.com/v1/databases/${env.NOTION_DATABASE_ID}/query`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.NOTION_TOKEN}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    page_size: 3 // 仅取 3 条用于调试
                })
            }
        );

        const data = await response.json() as any;

        if (!response.ok) {
            return Response.json({
                error: "Notion API Error",
                status: response.status,
                detail: data
            });
        }

        // 返回前 3 条记录的属性名和类型
        const debugInfo = data.results?.map((page: any) => {
            const props: Record<string, any> = {};
            for (const [key, value] of Object.entries(page.properties as Record<string, any>)) {
                props[key] = {
                    type: value.type,
                    sample: JSON.stringify(value).slice(0, 200)
                };
            }
            return {
                id: page.id,
                cover: page.cover,
                properties: props
            };
        });

        return Response.json({
            total: data.results?.length,
            has_more: data.has_more,
            pages: debugInfo
        }, { headers: { 'Content-Type': 'application/json' } });

    } catch (error: any) {
        return Response.json({ error: error.message });
    }
}

/**
 * 网站设定 API 端点
 *
 * GET /api/notion/site-content
 *   ?page=首页        — 按所属页面过滤
 *   ?pageKey=xxx     — 按页面标识精确查询
 *   ?navOnly=true    — 仅导航显示项
 */
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request, context }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const page = url.searchParams.get("page") || undefined;
    const pageKey = url.searchParams.get("pageKey") || undefined;
    const navOnly = url.searchParams.get("navOnly") === "true";

    const env = context.cloudflare.env as {
        NOTION_TOKEN?: string;
        NOTION_SITE_CONTENT_DATABASE_ID?: string;
        CACHE_KV?: import("@cloudflare/workers-types").KVNamespace;
    };

    const { getSiteContent } = await import("~/services/content/site-content");

    const result = await getSiteContent(
        env.NOTION_TOKEN,
        env.NOTION_SITE_CONTENT_DATABASE_ID,
        env.CACHE_KV,
        { page, pageKey, navOnly }
    );

    return Response.json(result);
}

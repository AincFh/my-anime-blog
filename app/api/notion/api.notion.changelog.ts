/**
 * 更新日志 API 端点
 *
 * GET /api/notion/changelog
 *   ?featured=true  — 首页精选
 *   ?major=true     — 重大更新
 *   ?type=功能更新  — 按类型过滤
 */
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request, context }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const featuredOnly = url.searchParams.get("featured") === "true";
    const majorOnly = url.searchParams.get("major") === "true";
    const type = url.searchParams.get("type") || undefined;

    const env = context.cloudflare.env as {
        NOTION_TOKEN?: string;
        NOTION_CHANGELOG_DATABASE_ID?: string;
        CACHE_KV?: import("@cloudflare/workers-types").KVNamespace;
    };

    const { getChangelog } = await import("~/services/content/changelog");

    const result = await getChangelog(
        env.NOTION_TOKEN,
        env.NOTION_CHANGELOG_DATABASE_ID,
        env.CACHE_KV,
        { featuredOnly, majorOnly, type }
    );

    return Response.json(result);
}

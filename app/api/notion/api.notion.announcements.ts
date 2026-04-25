/**
 * 网站公告 API 端点
 *
 * GET /api/notion/announcements
 *   ?featured=true      — 首页展示（横幅/弹窗场景）
 *   ?displayMode=顶部横幅 — 按展示方式过滤
 *   ?displayMode=首页弹窗
 *   ?displayMode=全站提示
 *   ?displayMode=公告列表
 *   ?active=false       — 禁用时间窗过滤（仅管理端）
 *
 * 规范要求三重过滤：
 *   1. 状态 = ✅ 已发布（服务端执行）
 *   2. 首页展示 = true（featured=true 时）
 *   3. 开始日期 ≤ now ≤ 结束日期（默认强制执行）
 */
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request, context }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const featuredOnly = url.searchParams.get("featured") === "true";
    const displayMode = url.searchParams.get("displayMode") || undefined;
    // 默认强制时间窗过滤，除非显式传 active=false（管理端调试用）
    const activeOnly = url.searchParams.get("active") !== "false";

    const env = context.cloudflare.env as {
        NOTION_TOKEN?: string;
        NOTION_ANNOUNCEMENT_DATABASE_ID?: string;
        CACHE_KV?: import("@cloudflare/workers-types").KVNamespace;
    };

    const { getAnnouncements } = await import("~/services/announcement");

    const result = await getAnnouncements(
        env.NOTION_TOKEN,
        env.NOTION_ANNOUNCEMENT_DATABASE_ID,
        env.CACHE_KV,
        { activeOnly, featuredOnly, displayMode }
    );

    return Response.json(result);
}

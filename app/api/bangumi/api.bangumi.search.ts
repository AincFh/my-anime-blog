import { searchAnime } from "~/services/bangumi.server";

/**
 * Bangumi 搜索 API
 * GET /api/bangumi/search?q=关键词
 */
export async function loader({ request }: { request: Request }) {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("q") || "";

    if (!keyword.trim()) {
        return Response.json({ results: [] });
    }

    try {
        const results = await searchAnime(keyword, 10);
        return Response.json({ results });
    } catch (error) {
        console.error("Bangumi search API error:", error);
        return Response.json({ error: "搜索失败" }, { status: 500 });
    }
}

import { getAnimeDetail, getAnimeCharacters, getAnimeStaff, extractInfoFromInfobox } from "~/services/bangumi.server";

/**
 * Bangumi 详情 API
 * GET /api/bangumi/detail?id=123456
 */
export async function loader({ request }: { request: Request }) {
    const url = new URL(request.url);
    const idStr = url.searchParams.get("id");

    if (!idStr) {
        return Response.json({ error: "缺少 id 参数" }, { status: 400 });
    }

    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
        return Response.json({ error: "无效的 id" }, { status: 400 });
    }

    try {
        // 并行获取详情、角色、制作人员
        const [detail, characters, staff] = await Promise.all([
            getAnimeDetail(id),
            getAnimeCharacters(id),
            getAnimeStaff(id),
        ]);

        if (!detail) {
            return Response.json({ error: "未找到该番剧" }, { status: 404 });
        }

        // 提取制作信息
        const productionInfo = extractInfoFromInfobox(detail.infobox);

        return Response.json({
            ...detail,
            characters: characters.slice(0, 10),
            staff: staff.slice(0, 10),
            production: productionInfo,
        });
    } catch (error) {
        console.error("Bangumi detail API error:", error);
        return Response.json({ error: "获取详情失败" }, { status: 500 });
    }
}

import type { Route } from "./+types/sitemap[.]xml";

export async function loader({ request, context }: Route.LoaderArgs) {
    const { getDBSafe } = await import("~/utils/db");
    const anime_db = getDBSafe(context);
    const baseUrl = new URL(request.url).origin;

    // 1. 获取所有公开文章
    let articles: any[] = [];
    if (anime_db) {
        try {
            const result = await anime_db
                .prepare("SELECT slug, updated_at FROM articles WHERE status = 'published' ORDER BY created_at DESC")
                .all();
            if (result.results) {
                articles = result.results;
            }
        } catch (error) {
            console.error("Failed to fetch articles for sitemap:", error);
        }
    }

    // 2. 定义静态页面
    const staticPages = [
        "",
        "/articles",
        "/archive",
        "/bangumi",
        "/gallery",
    ];

    // 3. 生成 XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
            .map((page) => {
                return `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>daily</changefreq>
    <priority>${page === "" ? 1.0 : 0.8}</priority>
  </url>`;
            })
            .join("")}
  ${articles
            .map((article) => {
                return `
  <url>
    <loc>${baseUrl}/articles/${article.slug}</loc>
    <lastmod>${new Date(article.updated_at * 1000).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
            })
            .join("")}
</urlset>`;

    return new Response(sitemap, {
        headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
        },
    });
}

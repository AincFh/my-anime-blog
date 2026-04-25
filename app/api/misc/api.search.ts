/**
 * 通用搜索 API
 * 支持全文搜索（FTS5），可选 AI 语义搜索增强
 * 对所有用户可用，无需登录
 */
import type { ActionFunctionArgs } from "react-router";
import { getDB } from "~/utils/db";

interface SearchResult {
    id: number;
    type: "article" | "anime";
    title: string;
    description?: string;
    slug?: string;
    url: string;
}

export async function action({ request, context }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
    }

    const db = getDB(context);

    try {
        const body = await request.json() as { q?: string };
        const query = body?.q?.trim();

        if (!query || query.length < 2) {
            return Response.json({ success: true, results: [] });
        }

        const results: SearchResult[] = [];

        // 1. FTS5 文章搜索
        try {
            const ftsQuery = query.split(/\s+/).map(term => `"${term.replace(/"/g, '')}"*`).join(' ');
            const articles = await db
                .prepare(`
                    SELECT a.id, a.title, a.slug, a.summary, a.category
                    FROM articles a
                    JOIN articles_fts fts ON a.id = fts.rowid
                    WHERE articles_fts MATCH ?
                    AND a.status = 'published'
                    ORDER BY rank
                    LIMIT 5
                `)
                .bind(ftsQuery)
                .all<{ id: number; title: string; slug: string; summary: string | null; category: string | null }>();

            for (const a of articles.results || []) {
                results.push({
                    id: a.id,
                    type: "article",
                    title: a.title,
                    description: a.summary || a.category || undefined,
                    slug: a.slug,
                    url: `/articles/${a.slug}`,
                });
            }
        } catch {
            // FTS5 出错时静默降级
        }

        // 2. 番剧名称模糊搜索
        const animes = await db
            .prepare(`
                SELECT id, title, status
                FROM animes
                WHERE title LIKE ? AND status IN ('watching', 'completed', 'plan')
                LIMIT 3
            `)
            .bind(`%${query}%`)
            .all<{ id: number; title: string; status: string }>();

        for (const anime of animes.results || []) {
            results.push({
                id: anime.id,
                type: "anime",
                title: anime.title,
                url: `/bangumi/${anime.id}`,
            });
        }

        return Response.json({ success: true, results: results.slice(0, 8) });
    } catch (error) {
        console.error("Search error:", error);
        return Response.json({ success: false, error: "搜索失败" }, { status: 500 });
    }
}

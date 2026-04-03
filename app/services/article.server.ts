/**
 * 文章点赞服务
 */
export async function likeArticle(articleId: number, context: any): Promise<void> {
    const { getDB } = await import('~/utils/db');
    const db = getDB(context);
    await db
        .prepare(`UPDATE articles SET likes = likes + 1 WHERE id = ?`)
        .bind(articleId)
        .run();
}

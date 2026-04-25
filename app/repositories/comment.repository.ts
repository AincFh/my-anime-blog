/**
 * 评论数据访问层
 * 封装 comments 表的所有数据库操作
 */

import { queryFirst, execute, queryAll, type Database } from '~/services/db.server';

export interface CommentRow {
    id: number;
    article_id: number | null;
    user_id: number | null;
    guest_name: string | null;
    content: string;
    is_danmaku: number;
    sticker_url: string | null;
    position_x: number | null;
    position_y: number | null;
    avatar_style: string | null;
    status: 'pending' | 'approved' | 'spam';
    created_at: number;
}

export interface CreateCommentDTO {
    articleId: number | null;
    userId: number | null;
    guestName: string | null;
    content: string;
    isDanmaku?: boolean;
    stickerUrl?: string | null;
    positionX?: number | null;
    positionY?: number | null;
    avatarStyle?: string | null;
    status?: 'pending' | 'approved' | 'spam';
}

export const commentRepository = {
    async findById(db: Database, id: number): Promise<CommentRow | null> {
        return queryFirst<CommentRow>(
            db,
            'SELECT * FROM comments WHERE id = ?',
            id
        );
    },

    async findByArticleId(
        db: Database,
        articleId: number,
        status: string = 'approved',
        limit: number = 50,
        offset: number = 0
    ): Promise<CommentRow[]> {
        return queryAll<CommentRow>(
            db,
            `SELECT * FROM comments
             WHERE article_id = ? AND status = ?
             ORDER BY created_at ASC
             LIMIT ? OFFSET ?`,
            articleId,
            status,
            limit,
            offset
        );
    },

    async findGlobalComments(
        db: Database,
        status: string = 'approved',
        limit: number = 50,
        offset: number = 0
    ): Promise<CommentRow[]> {
        return queryAll<CommentRow>(
            db,
            `SELECT * FROM comments
             WHERE article_id IS NULL AND status = ?
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            status,
            limit,
            offset
        );
    },

    async getCountByArticle(db: Database, articleId: number): Promise<number> {
        const result = await queryFirst<{ count: number }>(
            db,
            'SELECT COUNT(*) as count FROM comments WHERE article_id = ? AND status = ?',
            articleId,
            'approved'
        );
        return result?.count || 0;
    },

    async create(db: Database, dto: CreateCommentDTO): Promise<number> {
        const result = await execute(
            db,
            `INSERT INTO comments (
                article_id, user_id, guest_name, content,
                is_danmaku, sticker_url, position_x, position_y,
                avatar_style, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            dto.articleId,
            dto.userId,
            dto.guestName,
            dto.content,
            dto.isDanmaku ? 1 : 0,
            dto.stickerUrl || null,
            dto.positionX || null,
            dto.positionY || null,
            dto.avatarStyle || null,
            dto.status || 'approved'
        );
        return result.meta.last_row_id || 0;
    },

    async updateStatus(db: Database, id: number, status: CommentRow['status']): Promise<boolean> {
        const result = await db.prepare(
            'UPDATE comments SET status = ? WHERE id = ?'
        ).bind(status, id).run();

        return Boolean(result.meta.changes);
    },

    async delete(db: Database, id: number): Promise<boolean> {
        const result = await execute(
            db,
            'DELETE FROM comments WHERE id = ?',
            id
        );
        return result.success;
    },

    async findPending(db: Database, limit: number = 20, offset: number = 0): Promise<CommentRow[]> {
        return queryAll<CommentRow>(
            db,
            `SELECT * FROM comments
             WHERE status = 'pending'
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            limit,
            offset
        );
    },

    async getPendingCount(db: Database): Promise<number> {
        const result = await queryFirst<{ count: number }>(
            db,
            "SELECT COUNT(*) as count FROM comments WHERE status = 'pending'"
        );
        return result?.count || 0;
    },
};

/**
 * 通知数据访问层
 * 封装 user_notifications 表的所有数据库操作
 */

import { queryFirst, execute, queryAll, type Database } from '~/services/db.server';

export interface NotificationRow {
    id: number;
    user_id: number;
    type: string;
    title: string;
    message: string;
    is_read: number;
    is_important: number;
    action_url: string | null;
    metadata: string | null;
    created_at: number;
}

export type NotificationType =
    | 'achievement'
    | 'signin'
    | 'mission'
    | 'mission_reward'
    | 'membership'
    | 'comment_reply'
    | 'system'
    | 'purchase'
    | 'gacha';

export interface CreateNotificationDTO {
    userId: number;
    type: NotificationType;
    title: string;
    message: string;
    isImportant?: boolean;
    actionUrl?: string | null;
    metadata?: Record<string, unknown> | null;
}

export const notificationRepository = {
    async findById(db: Database, id: number): Promise<NotificationRow | null> {
        return queryFirst<NotificationRow>(
            db,
            'SELECT * FROM user_notifications WHERE id = ?',
            id
        );
    },

    async findByUserId(
        db: Database,
        userId: number,
        limit: number = 20,
        offset: number = 0
    ): Promise<NotificationRow[]> {
        return queryAll<NotificationRow>(
            db,
            `SELECT * FROM user_notifications
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            userId,
            limit,
            offset
        );
    },

    async getUnreadCount(db: Database, userId: number): Promise<number> {
        const result = await queryFirst<{ count: number }>(
            db,
            'SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ? AND is_read = 0',
            userId
        );
        return result?.count || 0;
    },

    async create(db: Database, dto: CreateNotificationDTO): Promise<number> {
        const result = await db.prepare(`
            INSERT INTO user_notifications
                (user_id, type, title, message, is_important, action_url, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
        `).bind(
            dto.userId,
            dto.type,
            dto.title,
            dto.message,
            dto.isImportant ? 1 : 0,
            dto.actionUrl || null,
            dto.metadata ? JSON.stringify(dto.metadata) : null
        ).run();

        return result.meta.last_row_id || 0;
    },

    async markAsRead(db: Database, id: number, userId: number): Promise<boolean> {
        const result = await db.prepare(
            'UPDATE user_notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
        ).bind(id, userId).run();

        return Boolean(result.meta.changes);
    },

    async markAllAsRead(db: Database, userId: number): Promise<number> {
        const result = await db.prepare(
            'UPDATE user_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0'
        ).bind(userId).run();

        return result.meta.changes || 0;
    },

    async delete(db: Database, id: number, userId: number): Promise<boolean> {
        const result = await db.prepare(
            'DELETE FROM user_notifications WHERE id = ? AND user_id = ?'
        ).bind(id, userId).run();

        return Boolean(result.meta.changes);
    },

    async pruneOld(db: Database, daysOld: number = 30): Promise<number> {
        const cutoff = Math.floor(Date.now() / 1000) - daysOld * 24 * 60 * 60;
        const result = await db.prepare(
            'DELETE FROM user_notifications WHERE created_at < ? AND is_read = 1'
        ).bind(cutoff).run();

        return result.meta.changes || 0;
    },
};

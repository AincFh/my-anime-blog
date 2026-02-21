import { type Database, queryFirst, execute, queryAll } from '~/services/db.server';
import type { IRepository } from './index';

export interface Subscription {
    id: number;
    user_id: number;
    tier_id: number;
    period: 'monthly' | 'quarterly' | 'yearly';
    status: 'active' | 'expired' | 'cancelled' | 'pending';
    start_date: number;
    end_date: number;
    auto_renew: number;
    next_notify_at: number | null;
    cancelled_at: number | null;
    cancel_reason: string | null;
    created_at: number;
    updated_at: number;
}

export type CreateSubscriptionDTO = Omit<Subscription, 'id' | 'created_at' | 'updated_at' | 'cancelled_at' | 'cancel_reason'>;

export class SubscriptionRepository implements IRepository<Subscription, CreateSubscriptionDTO> {
    constructor(private db: Database) { }

    async findById(id: number): Promise<Subscription | null> {
        return queryFirst<Subscription>(
            this.db,
            'SELECT * FROM subscriptions WHERE id = ?',
            id
        );
    }

    async findActiveByUserId(userId: number): Promise<Subscription | null> {
        const now = Math.floor(Date.now() / 1000);
        return queryFirst<Subscription>(
            this.db,
            `SELECT * FROM subscriptions 
             WHERE user_id = ? AND status = 'active' AND end_date > ?`,
            userId,
            now
        );
    }

    async findWithTierInfo(userId: number): Promise<(Subscription & { display_name: string }) | null> {
        const now = Math.floor(Date.now() / 1000);
        return queryFirst<Subscription & { display_name: string }>(
            this.db,
            `SELECT s.*, t.display_name 
             FROM subscriptions s
             JOIN membership_tiers t ON s.tier_id = t.id
             WHERE s.user_id = ? AND s.status = 'active' AND s.end_date > ?
             ORDER BY s.end_date DESC
             LIMIT 1`,
            userId,
            now
        );
    }

    async create(data: CreateSubscriptionDTO): Promise<Subscription> {
        const result = await execute(
            this.db,
            `INSERT INTO subscriptions (
                user_id, tier_id, period, status, start_date, end_date, 
                auto_renew, next_notify_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            data.user_id,
            data.tier_id,
            data.period,
            data.status,
            data.start_date,
            data.end_date,
            data.auto_renew,
            data.next_notify_at
        );

        if (!result.success) {
            throw new Error('Subscription creation failed');
        }

        const sub = await this.findById(result.meta.last_row_id);
        if (!sub) throw new Error('Subscription created but not found');
        return sub;
    }

    async update(id: number, data: Partial<Subscription>): Promise<Subscription | null> {
        // 简化版更新，实际按需添加字段
        const now = Math.floor(Date.now() / 1000);

        if (data.status === 'cancelled') { // 特殊处理取消
            await execute(
                this.db,
                `UPDATE subscriptions 
                 SET auto_renew = 0, cancelled_at = ?, cancel_reason = ?, updated_at = ?
                 WHERE id = ?`,
                now,
                data.cancel_reason || null,
                now,
                id
            );
        } else {
            // 通用更新逻辑...
        }

        return this.findById(id as number);
    }

    async findHistoryByUserId(userId: number, limit: number = 20): Promise<(Subscription & { tier_name: string })[]> {
        const result = await this.db.prepare(
            `SELECT s.*, t.display_name as tier_name
             FROM subscriptions s
             JOIN membership_tiers t ON s.tier_id = t.id
             WHERE s.user_id = ?
             ORDER BY s.created_at DESC
             LIMIT ?`
        )
            .bind(userId, limit)
            .all();
        return (result.results || []) as unknown as (Subscription & { tier_name: string })[];
    }

    async expireSubscriptions(): Promise<number> {
        const now = Math.floor(Date.now() / 1000);
        const result = await execute(
            this.db,
            `UPDATE subscriptions 
             SET status = 'expired', updated_at = ?
             WHERE status = 'active' AND end_date < ?`,
            now,
            now
        );
        return result.meta?.changes || 0;
    }

    async findNeedingNotification(time: number): Promise<(Subscription & { email: string; username: string; tier_name: string })[]> {
        const result = await this.db.prepare(
            `SELECT s.*, u.email, u.username, t.display_name as tier_name
             FROM subscriptions s
             JOIN users u ON s.user_id = u.id
             JOIN membership_tiers t ON s.tier_id = t.id
             WHERE s.status = 'active' 
               AND s.auto_renew = 1 
               AND s.next_notify_at IS NOT NULL 
               AND s.next_notify_at <= ?`
        )
            .bind(time)
            .all();
        return (result.results || []) as any[];
    }

    async markNotificationSent(id: number): Promise<void> {
        await execute(
            this.db,
            'UPDATE subscriptions SET next_notify_at = NULL WHERE id = ?',
            id
        );
    }

    async delete(id: number): Promise<boolean> {
        const result = await execute(this.db, 'DELETE FROM subscriptions WHERE id = ?', id);
        return result.success;
    }
}

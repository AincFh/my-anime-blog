/**
 * 订阅管理服务
 * 处理订阅创建、续费、取消等操作
 */

import { execute, queryFirst } from '../db.server';
import { getTierById, calculateEndDate } from './tier.server';

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

export interface CreateSubscriptionParams {
    userId: number;
    tierId: number;
    period: 'monthly' | 'quarterly' | 'yearly';
    orderId?: string;
}

/**
 * 创建订阅
 */
export async function createSubscription(
    db: any,
    params: CreateSubscriptionParams
): Promise<{ success: boolean; subscription?: Subscription; error?: string }> {
    const now = Math.floor(Date.now() / 1000);
    const endDate = calculateEndDate(now, params.period);
    const notifyDate = endDate - 3 * 24 * 60 * 60; // 到期前3天通知

    try {
        // 检查是否有现有有效订阅
        const existing = await queryFirst<Subscription>(
            db,
            `SELECT * FROM subscriptions 
       WHERE user_id = ? AND status = 'active' AND end_date > ?`,
            params.userId,
            now
        );

        if (existing) {
            // 已有订阅，进行升级/续费处理
            return upgradeSubscription(db, existing, params.tierId, params.period);
        }

        // 创建新订阅
        const result = await execute(
            db,
            `INSERT INTO subscriptions (
        user_id, tier_id, period, status, start_date, end_date, 
        auto_renew, next_notify_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            params.userId,
            params.tierId,
            params.period,
            'active',
            now,
            endDate,
            1,
            notifyDate
        );

        if (!result.success) {
            return { success: false, error: '创建订阅失败' };
        }

        const subscription = await queryFirst<Subscription>(
            db,
            'SELECT * FROM subscriptions WHERE id = ?',
            result.meta.last_row_id
        );

        return { success: true, subscription: subscription! };
    } catch (error) {
        console.error('Create subscription error:', error);
        return { success: false, error: '创建订阅失败' };
    }
}

/**
 * 升级/续费订阅
 */
async function upgradeSubscription(
    db: any,
    existing: Subscription,
    newTierId: number,
    newPeriod: 'monthly' | 'quarterly' | 'yearly'
): Promise<{ success: boolean; subscription?: Subscription; error?: string }> {
    const now = Math.floor(Date.now() / 1000);

    // 如果是同等级续费，从当前到期时间开始计算
    // 如果是升级，从现在开始计算
    const isUpgrade = newTierId > existing.tier_id;
    const startDate = isUpgrade ? now : existing.end_date;
    const endDate = calculateEndDate(startDate, newPeriod);
    const notifyDate = endDate - 3 * 24 * 60 * 60;

    try {
        if (isUpgrade) {
            // 升级：更新现有订阅
            await execute(
                db,
                `UPDATE subscriptions 
         SET tier_id = ?, period = ?, end_date = ?, next_notify_at = ?, updated_at = ?
         WHERE id = ?`,
                newTierId,
                newPeriod,
                endDate,
                notifyDate,
                now,
                existing.id
            );
        } else {
            // 续费：延长到期时间
            await execute(
                db,
                `UPDATE subscriptions 
         SET end_date = ?, next_notify_at = ?, updated_at = ?
         WHERE id = ?`,
                endDate,
                notifyDate,
                now,
                existing.id
            );
        }

        const subscription = await queryFirst<Subscription>(
            db,
            'SELECT * FROM subscriptions WHERE id = ?',
            existing.id
        );

        return { success: true, subscription: subscription! };
    } catch (error) {
        console.error('Upgrade subscription error:', error);
        return { success: false, error: '升级订阅失败' };
    }
}

/**
 * 取消订阅（到期后不续费）
 */
export async function cancelSubscription(
    db: any,
    userId: number,
    reason?: string
): Promise<{ success: boolean; error?: string }> {
    const now = Math.floor(Date.now() / 1000);

    try {
        const result = await execute(
            db,
            `UPDATE subscriptions 
       SET auto_renew = 0, cancelled_at = ?, cancel_reason = ?, updated_at = ?
       WHERE user_id = ? AND status = 'active'`,
            now,
            reason || null,
            now,
            userId
        );

        return { success: true };
    } catch (error) {
        console.error('Cancel subscription error:', error);
        return { success: false, error: '取消订阅失败' };
    }
}

/**
 * 恢复自动续费
 */
export async function resumeAutoRenew(
    db: any,
    userId: number
): Promise<{ success: boolean; error?: string }> {
    const now = Math.floor(Date.now() / 1000);

    try {
        await execute(
            db,
            `UPDATE subscriptions 
       SET auto_renew = 1, cancelled_at = NULL, cancel_reason = NULL, updated_at = ?
       WHERE user_id = ? AND status = 'active'`,
            now,
            userId
        );

        return { success: true };
    } catch (error) {
        console.error('Resume auto renew error:', error);
        return { success: false, error: '恢复续费失败' };
    }
}

/**
 * 获取用户当前订阅
 */
export async function getUserSubscription(
    db: any,
    userId: number
): Promise<(Subscription & { display_name: string }) | null> {
    const now = Math.floor(Date.now() / 1000);

    return queryFirst<Subscription & { display_name: string }>(
        db,
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

/**
 * 获取用户订阅历史
 */
export async function getUserSubscriptionHistory(
    db: any,
    userId: number,
    limit: number = 20
): Promise<Subscription[]> {
    const result = await db
        .prepare(
            `SELECT s.*, t.display_name as tier_name
       FROM subscriptions s
       JOIN membership_tiers t ON s.tier_id = t.id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC
       LIMIT ?`
        )
        .bind(userId, limit)
        .all();

    return result.results || [];
}

/**
 * 检查并过期订阅
 */
export async function expireSubscriptions(db: any): Promise<number> {
    const now = Math.floor(Date.now() / 1000);

    const result = await execute(
        db,
        `UPDATE subscriptions 
     SET status = 'expired', updated_at = ?
     WHERE status = 'active' AND end_date < ?`,
        now,
        now
    );

    return result.meta?.changes || 0;
}

/**
 * 获取需要发送续费通知的订阅
 */
export async function getSubscriptionsNeedingNotification(
    db: any
): Promise<Subscription[]> {
    const now = Math.floor(Date.now() / 1000);

    const result = await db
        .prepare(
            `SELECT s.*, u.email, u.username, t.display_name as tier_name
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       JOIN membership_tiers t ON s.tier_id = t.id
       WHERE s.status = 'active' 
         AND s.auto_renew = 1 
         AND s.next_notify_at IS NOT NULL 
         AND s.next_notify_at <= ?`
        )
        .bind(now)
        .all();

    return result.results || [];
}

/**
 * 标记通知已发送
 */
export async function markNotificationSent(
    db: any,
    subscriptionId: number
): Promise<void> {
    await execute(
        db,
        'UPDATE subscriptions SET next_notify_at = NULL WHERE id = ?',
        subscriptionId
    );
}

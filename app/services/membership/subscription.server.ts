/**
 * 订阅管理服务
 * 处理订阅创建、续费、取消等操作
 */

import { SubscriptionRepository } from '~/repositories';
import type { Subscription } from '~/repositories/subscription.repository';
import { calculateEndDate } from './tier.server';

export type { Subscription };

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
    const subRepo = new SubscriptionRepository(db);
    const now = Math.floor(Date.now() / 1000);
    const endDate = calculateEndDate(now, params.period);
    const notifyDate = endDate - 3 * 24 * 60 * 60; // 到期前3天通知

    try {
        // 检查是否有现有有效订阅
        const existing = await subRepo.findActiveByUserId(params.userId);

        if (existing) {
            // 已有订阅，进行升级/续费处理
            return upgradeSubscription(db, existing, params.tierId, params.period);
        }

        // 创建新订阅
        const subscription = await subRepo.create({
            user_id: params.userId,
            tier_id: params.tierId,
            period: params.period,
            status: 'active',
            start_date: now,
            end_date: endDate,
            auto_renew: 1,
            next_notify_at: notifyDate
        });

        return { success: true, subscription };
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
    const subRepo = new SubscriptionRepository(db);
    const now = Math.floor(Date.now() / 1000);

    // 如果是同等级续费，从当前到期时间开始计算
    // 如果是升级，从现在开始计算
    const isUpgrade = newTierId > existing.tier_id;
    const startDate = isUpgrade ? now : existing.end_date;
    const endDate = calculateEndDate(startDate, newPeriod);
    const notifyDate = endDate - 3 * 24 * 60 * 60;

    try {
        let updatedSub: Subscription | null = null;

        if (isUpgrade) {
            // 升级：更新现有订阅
            updatedSub = await subRepo.update(existing.id, {
                tier_id: newTierId,
                period: newPeriod,
                end_date: endDate,
                next_notify_at: notifyDate,
                updated_at: now
            });
        } else {
            // 续费：延长到期时间
            updatedSub = await subRepo.update(existing.id, {
                end_date: endDate,
                next_notify_at: notifyDate,
                updated_at: now
            });
        }

        if (!updatedSub) throw new Error('Update failed');

        return { success: true, subscription: updatedSub };
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
    const subRepo = new SubscriptionRepository(db);

    try {
        // 需要先找到 user 的 active subscription ID
        // 目前 cancelSubscription 只传了 userId，但 Update 需要 ID
        // 原逻辑是 update ... where user_id = ?
        // Repository update 是 by ID.
        // 所以需要先查 Sub
        const sub = await subRepo.findActiveByUserId(userId);
        if (!sub) return { success: false, error: '未找到有效订阅' };

        await subRepo.update(sub.id, {
            status: 'cancelled', // 这里的 status 是传给 update 方法用于触发特殊逻辑，或者 update 方法本身需要支持 status 更新
            cancel_reason: reason
        });
        // 注意：Repository 的 create 定义中 CreateDTO 没有 updated_at，但 Update 是 Partial<Subscription>，包含 updated_at
        // SubscriptionRepository.update 特殊处理了 status='cancelled'

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
    const subRepo = new SubscriptionRepository(db);
    const now = Math.floor(Date.now() / 1000);

    try {
        const sub = await subRepo.findActiveByUserId(userId);
        if (!sub) return { success: false, error: '未找到有效订阅' };

        // 这里需要一种方式仅更新 auto_renew，Repository update 应该通用
        // 但原逻辑还清空了 cancelled_at 等
        await subRepo.update(sub.id, {
            auto_renew: 1,
            cancelled_at: null as any, // 强转，因为 interface 是 number | null，Partial 可能受限？
            cancel_reason: null,
            updated_at: now
        });

        // 注意：需要确保 Repository update 支持 null 值更新
        // 我需要检查 SubscriptionRepository.update 实现是否过滤了 null/undefined
        // Repository 实现： checks undefined via !== undefined. null passes through. Good.

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
    const subRepo = new SubscriptionRepository(db);
    return subRepo.findWithTierInfo(userId);
}

/**
 * 获取用户订阅历史
 */
export async function getUserSubscriptionHistory(
    db: any,
    userId: number,
    limit: number = 20
): Promise<Subscription[]> {
    const subRepo = new SubscriptionRepository(db);
    return subRepo.findHistoryByUserId(userId, limit);
}

/**
 * 检查并过期订阅
 */
export async function expireSubscriptions(db: any): Promise<number> {
    const subRepo = new SubscriptionRepository(db);
    return subRepo.expireSubscriptions();
}

/**
 * 获取需要发送续费通知的订阅
 */
export async function getSubscriptionsNeedingNotification(
    db: any
): Promise<Subscription[]> {
    const subRepo = new SubscriptionRepository(db);
    return subRepo.findNeedingNotification(Math.floor(Date.now() / 1000));
}

/**
 * 标记通知已发送
 */
export async function markNotificationSent(
    db: any,
    subscriptionId: number
): Promise<void> {
    const subRepo = new SubscriptionRepository(db);
    await subRepo.markNotificationSent(subscriptionId);
}

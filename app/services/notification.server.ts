/**
 * 通知服务
 * 封装通知业务逻辑，委托数据访问给 NotificationRepository
 */

import { notificationRepository } from '~/repositories/notification.repository';
import type { Database } from '~/services/db.server';

export type { Notification, NotificationType } from '~/repositories/notification.repository';

export interface Notification {
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

export type NotificationType = Parameters<typeof notificationRepository.create>[1]['type'];

export async function createNotification(
    db: Database,
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    options?: {
        isImportant?: boolean;
        actionUrl?: string;
        metadata?: Record<string, unknown>;
    }
): Promise<number> {
    return notificationRepository.create(db, {
        userId,
        type,
        title,
        message,
        isImportant: options?.isImportant,
        actionUrl: options?.actionUrl,
        metadata: options?.metadata,
    });
}

export async function getUnreadCount(db: Database, userId: number): Promise<number> {
    return notificationRepository.getUnreadCount(db, userId);
}

export async function getUserNotifications(
    db: Database,
    userId: number,
    limit: number = 20,
    offset: number = 0
): Promise<Notification[]> {
    return notificationRepository.findByUserId(db, userId, limit, offset);
}

export async function markAsRead(
    db: Database,
    notificationId: number,
    userId: number
): Promise<boolean> {
    return notificationRepository.markAsRead(db, notificationId, userId);
}

export async function markAllAsRead(db: Database, userId: number): Promise<number> {
    return notificationRepository.markAllAsRead(db, userId);
}

export async function pruneOldNotifications(
    db: Database,
    daysOld: number = 30
): Promise<number> {
    return notificationRepository.pruneOld(db, daysOld);
}

export async function notifyAchievement(
    db: Database,
    userId: number,
    achievementName: string,
    achievementIcon: string
): Promise<void> {
    await createNotification(db, userId, 'achievement', '成就解锁', `${achievementIcon} ${achievementName}`, {
        isImportant: true,
        actionUrl: '/user/achievements',
    });
}

export async function notifyMissionReward(
    db: Database,
    userId: number,
    missionName: string,
    coins: number,
    exp: number
): Promise<void> {
    const parts: string[] = [];
    if (coins > 0) parts.push(`+${coins} 金币`);
    if (exp > 0) parts.push(`+${exp} 经验`);
    await createNotification(
        db,
        userId,
        'mission_reward',
        '任务奖励',
        `完成「${missionName}」获得 ${parts.join(' 和 ')}`
    );
}

export async function notifySignIn(
    db: Database,
    userId: number,
    coins: number,
    streak: number
): Promise<void> {
    await createNotification(
        db,
        userId,
        'signin',
        '签到成功',
        `连续签到 ${streak} 天，获得 ${coins} 金币`
    );
}

export async function notifyGacha(
    db: Database,
    userId: number,
    itemName: string,
    rarity: string
): Promise<void> {
    await createNotification(
        db,
        userId,
        'gacha',
        '扭蛋结果',
        `恭喜抽到 ${rarity} 级物品「${itemName}」`,
        { actionUrl: '/user/inventory' }
    );
}

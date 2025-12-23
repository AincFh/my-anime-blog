/**
 * 续费通知服务
 * 处理会员到期提醒、过期通知等
 */

import { getSubscriptionsNeedingNotification, markNotificationSent } from './subscription.server';
import { getTierById } from './tier.server';

export interface NotificationResult {
    success: boolean;
    sent: number;
    failed: number;
    errors: string[];
}

export interface RenewalNotification {
    userId: number;
    userEmail: string;
    userName: string;
    tierName: string;
    endDate: Date;
    daysUntilExpiry: number;
    autoRenew: boolean;
}

/**
 * 获取需要发送续费提醒的用户
 */
export async function getPendingRenewalNotifications(
    db: any
): Promise<RenewalNotification[]> {
    const subscriptions = await getSubscriptionsNeedingNotification(db);
    const notifications: RenewalNotification[] = [];

    for (const sub of subscriptions) {
        // 获取用户信息
        const user = await db
            .prepare('SELECT id, email, nickname FROM users WHERE id = ?')
            .bind(sub.user_id)
            .first();

        if (!user) continue;

        // 获取等级信息
        const tier = await getTierById(db, sub.tier_id);
        if (!tier) continue;

        const endDate = new Date(sub.end_date * 1000);
        const now = new Date();
        const daysUntilExpiry = Math.ceil(
            (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        notifications.push({
            userId: user.id,
            userEmail: user.email,
            userName: user.nickname || '用户',
            tierName: tier.display_name,
            endDate,
            daysUntilExpiry,
            autoRenew: Boolean(sub.auto_renew),
        });
    }

    return notifications;
}

/**
 * 发送续费提醒邮件
 */
export async function sendRenewalReminder(
    notification: RenewalNotification,
    emailService: any // 邮件服务
): Promise<{ success: boolean; error?: string }> {
    const subject = `【续费提醒】您的 ${notification.tierName} 即将到期`;

    const content = `
亲爱的 ${notification.userName}：

您的 ${notification.tierName} 将于 ${notification.endDate.toLocaleDateString('zh-CN')} 到期。
${notification.autoRenew
            ? '✅ 您已开启自动续费，系统将在到期前自动为您续费。'
            : '⚠️ 您未开启自动续费，到期后将失去会员权益。'
        }

${notification.autoRenew ? '' : '立即续费，继续享受专属权益：\n前往会员中心 > 续费订阅'}

感谢您的支持！

---
Project Blue Sky
    `.trim();

    try {
        if (emailService) {
            await emailService.send({
                to: notification.userEmail,
                subject,
                text: content,
            });
        }
        return { success: true };
    } catch (error) {
        console.error('Send renewal reminder error:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * 发送过期通知
 */
export async function sendExpiredNotice(
    notification: RenewalNotification,
    emailService: any
): Promise<{ success: boolean; error?: string }> {
    const subject = `【会员过期】您的 ${notification.tierName} 已到期`;

    const content = `
亲爱的 ${notification.userName}：

您的 ${notification.tierName} 已于 ${notification.endDate.toLocaleDateString('zh-CN')} 到期。

现在续费，继续享受专属权益：
- 无限追番记录
- 更多 AI 聊天次数
- 去除广告
- 专属徽章和表情

立即续费：前往会员中心

感谢您的支持！

---
Project Blue Sky
    `.trim();

    try {
        if (emailService) {
            await emailService.send({
                to: notification.userEmail,
                subject,
                text: content,
            });
        }
        return { success: true };
    } catch (error) {
        console.error('Send expired notice error:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * 批量处理续费通知
 * 设计为定时任务调用（如每天一次）
 */
export async function processRenewalNotifications(
    db: any,
    emailService?: any
): Promise<NotificationResult> {
    const result: NotificationResult = {
        success: true,
        sent: 0,
        failed: 0,
        errors: [],
    };

    try {
        const notifications = await getPendingRenewalNotifications(db);

        for (const notification of notifications) {
            let sendResult;

            if (notification.daysUntilExpiry <= 0) {
                // 已过期
                sendResult = await sendExpiredNotice(notification, emailService);
            } else {
                // 即将过期
                sendResult = await sendRenewalReminder(notification, emailService);
            }

            if (sendResult.success) {
                result.sent++;
                // 标记通知已发送（避免重复发送）
                // 这里需要从 subscription 表获取 subscription_id
            } else {
                result.failed++;
                result.errors.push(`User ${notification.userId}: ${sendResult.error}`);
            }
        }
    } catch (error) {
        result.success = false;
        result.errors.push(String(error));
    }

    return result;
}

/**
 * 计算下次通知时间
 * 到期前 3 天、1 天、到期当天
 */
export function calculateNextNotifyTime(endDate: number): number {
    const end = endDate;
    const now = Math.floor(Date.now() / 1000);
    const daysUntilEnd = Math.floor((end - now) / (24 * 60 * 60));

    if (daysUntilEnd > 3) {
        // 3 天前通知
        return end - 3 * 24 * 60 * 60;
    } else if (daysUntilEnd > 1) {
        // 1 天前通知
        return end - 1 * 24 * 60 * 60;
    } else if (daysUntilEnd > 0) {
        // 到期当天通知
        return end;
    } else {
        // 已过期，立即通知
        return now;
    }
}

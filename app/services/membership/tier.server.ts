/**
 * 会员等级服务
 * 管理会员等级、权限检查
 */

import { queryFirst, execute } from '../db.server';

export interface MembershipTier {
    id: number;
    name: string;
    display_name: string;
    description: string | null;
    price_monthly: number;
    price_quarterly: number;
    price_yearly: number;
    privileges: string;
    badge_url: string | null;
    badge_color: string | null;
    sort_order: number;
    is_active: number;
}

export interface TierPrivileges {
    maxAnimes: number;           // -1 = 无限
    maxGalleryPerDay: number;
    aiChatPerDay: number;
    coinMultiplier: number;
    adFree: boolean;
    download: boolean;
    customTheme: boolean;
    exclusiveEmoji: boolean;
    exclusiveEffect: boolean;
    earlyAccess: boolean;
    prioritySupport: boolean;
    exclusiveBadge: boolean;
    exclusiveBanner: boolean;
    missionBonus: number;
    chatModel: string;
    badge?: string;
}

// 默认免费用户权限
const DEFAULT_PRIVILEGES: TierPrivileges = {
    maxAnimes: 20,
    maxGalleryPerDay: 50,
    aiChatPerDay: 3,
    coinMultiplier: 1,
    adFree: false,
    download: false,
    customTheme: false,
    exclusiveEmoji: false,
    exclusiveEffect: false,
    earlyAccess: false,
    prioritySupport: false,
    exclusiveBadge: false,
    exclusiveBanner: false,
    missionBonus: 0, // 任务奖励加成
    chatModel: 'gpt-3.5-turbo',
};

/**
 * 获取所有会员等级
 */
export async function getAllTiers(db: any): Promise<MembershipTier[]> {
    const result = await db
        .prepare('SELECT * FROM membership_tiers WHERE is_active = 1 ORDER BY sort_order')
        .all();
    return result.results || [];
}

/**
 * 获取会员等级详情
 */
export async function getTierById(
    db: any,
    tierId: number
): Promise<MembershipTier | null> {
    return queryFirst<MembershipTier>(
        db,
        'SELECT * FROM membership_tiers WHERE id = ?',
        tierId
    );
}

/**
 * 根据名称获取等级
 */
export async function getTierByName(
    db: any,
    name: string
): Promise<MembershipTier | null> {
    return queryFirst<MembershipTier>(
        db,
        'SELECT * FROM membership_tiers WHERE name = ?',
        name
    );
}

/**
 * 解析等级权限
 */
export function parsePrivileges(tier: MembershipTier | null): TierPrivileges {
    if (!tier || !tier.privileges) {
        return DEFAULT_PRIVILEGES;
    }

    try {
        return { ...DEFAULT_PRIVILEGES, ...JSON.parse(tier.privileges) };
    } catch {
        return DEFAULT_PRIVILEGES;
    }
}

/**
 * 获取用户当前会员等级
 */
export async function getUserMembershipTier(
    db: any,
    userId: number
): Promise<{ tier: MembershipTier | null; subscription: any | null }> {
    // 查询用户的有效订阅
    const now = Math.floor(Date.now() / 1000);
    const subscription = await queryFirst<any>(
        db,
        `SELECT s.*, t.* 
     FROM subscriptions s
     JOIN membership_tiers t ON s.tier_id = t.id
     WHERE s.user_id = ? AND s.status = 'active' AND s.end_date > ?
     ORDER BY t.sort_order DESC
     LIMIT 1`,
        userId,
        now
    );

    if (subscription) {
        return {
            tier: {
                id: subscription.tier_id,
                name: subscription.name,
                display_name: subscription.display_name,
                description: subscription.description,
                price_monthly: subscription.price_monthly,
                price_quarterly: subscription.price_quarterly,
                price_yearly: subscription.price_yearly,
                privileges: subscription.privileges,
                badge_url: subscription.badge_url,
                badge_color: subscription.badge_color,
                sort_order: subscription.sort_order,
                is_active: subscription.is_active,
            },
            subscription,
        };
    }

    // 返回免费等级
    const freeTier = await getTierByName(db, 'free');
    return { tier: freeTier, subscription: null };
}

/**
 * 检查用户是否有特定权限
 */
export async function checkUserPrivilege(
    db: any,
    userId: number,
    privilege: keyof TierPrivileges
): Promise<boolean> {
    const { tier } = await getUserMembershipTier(db, userId);
    const privileges = parsePrivileges(tier);

    const value = privileges[privilege];
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        return value !== 0;
    }
    return !!value;
}

/**
 * 获取用户权限值
 */
export async function getUserPrivilegeValue<T extends keyof TierPrivileges>(
    db: any,
    userId: number,
    privilege: T
): Promise<TierPrivileges[T]> {
    const { tier } = await getUserMembershipTier(db, userId);
    const privileges = parsePrivileges(tier);
    return privileges[privilege];
}

/**
 * 检查用户是否是 VIP 或更高
 */
export async function isVIPOrAbove(db: any, userId: number): Promise<boolean> {
    const { tier } = await getUserMembershipTier(db, userId);
    return tier ? tier.name !== 'free' : false;
}

/**
 * 检查用户是否是 SVIP
 */
export async function isSVIP(db: any, userId: number): Promise<boolean> {
    const { tier } = await getUserMembershipTier(db, userId);
    return tier?.name === 'svip';
}

/**
 * 获取价格（根据周期）
 */
export function getTierPrice(
    tier: MembershipTier,
    period: 'monthly' | 'quarterly' | 'yearly'
): number {
    switch (period) {
        case 'monthly':
            return tier.price_monthly;
        case 'quarterly':
            return tier.price_quarterly;
        case 'yearly':
            return tier.price_yearly;
        default:
            return tier.price_monthly;
    }
}

/**
 * 计算订阅结束时间
 */
export function calculateEndDate(
    startDate: number,
    period: 'monthly' | 'quarterly' | 'yearly'
): number {
    const date = new Date(startDate * 1000);

    switch (period) {
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'quarterly':
            date.setMonth(date.getMonth() + 3);
            break;
        case 'yearly':
            date.setFullYear(date.getFullYear() + 1);
            break;
    }

    return Math.floor(date.getTime() / 1000);
}

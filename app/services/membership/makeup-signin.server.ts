/**
 * 补签服务
 * 核心逻辑：计算补签费用、验证日期合法性、处理补签流程
 */

import { queryFirst, execute, type Database } from '~/services/db.server';
import { spendCoins, getUserCoins } from './coins.server';
import { MAKEUP_SIGNIN_CONFIG } from './game-config';

export interface MakeupSigninResult {
    success: boolean;
    cost?: number;
    consecutiveMakeupCount?: number;
    rewardCoins?: number;
    newBalance?: number;
    error?: string;
}

export interface MakeupStatus {
    canMakeup: boolean;
    missedDays: string[];        // 可补签的日期列表 (YYYY-MM-DD)
    missedDaysFormatted: string[]; // 格式化后的日期列表 (如 "4月18日")
    consecutiveMakeupCount: number; // 连续补签次数（用于计算费用）
    currentCost: number;          // 当前补签费用
    maxDaysBack: number;
}

/**
 * 获取指定日期的 0 点时间戳（本地时间）
 */
function getStartOfDay(dateStr: string): number {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return Math.floor(d.getTime() / 1000);
}

/**
 * 获取指定日期的 23:59:59 时间戳（本地时间）
 */
function getEndOfDay(dateStr: string): number {
    const d = new Date(dateStr);
    d.setHours(23, 59, 59, 999);
    return Math.floor(d.getTime() / 1000);
}

/**
 * 计算补签费用
 * 公式：baseCost + (consecutiveMakeupCount - 1) * incrementalCost，封顶于 maxCostPerDay
 */
export function calculateMakeupCost(consecutiveCount: number): number {
    const { baseCost, incrementalCost, maxCostPerDay } = MAKEUP_SIGNIN_CONFIG;
    const rawCost = baseCost + (consecutiveCount - 1) * incrementalCost;
    return Math.min(rawCost, maxCostPerDay);
}

/**
 * 获取本月补签次数（从本月1日开始）
 */
async function getMonthMakeupCount(db: Database, userId: number): Promise<number> {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const result = await queryFirst<{ count: number }>(
        db,
        `SELECT COUNT(*) as count FROM user_signin_records
         WHERE user_id = ? AND is_makeup = 1 AND signin_date >= ?`,
        userId,
        monthStart
    );

    return result?.count || 0;
}

/**
 * 获取用户本月的连续补签次数
 * 连续补签 = 本月连续的补签次数（每次补签都计一次）
 */
export async function getConsecutiveMakeupCount(db: Database, userId: number): Promise<number> {
    return getMonthMakeupCount(db, userId);
}

/**
 * 获取可补签的日期列表
 * 遍历过去 maxDaysBack 天，找出未签到的日期
 */
export async function getMissedSigninDays(
    db: Database,
    userId: number
): Promise<MakeupStatus> {
    const { maxDaysBack } = MAKEUP_SIGNIN_CONFIG;
    const missedDays: string[] = [];
    const missedDaysFormatted: string[] = [];
    const today = new Date();

    // 遍历过去 maxDaysBack 天
    for (let i = 1; i <= maxDaysBack; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);

        // 跳过今天（今天还没结束，不算漏签）
        const dateStr = d.toISOString().split('T')[0];

        // 检查该日期是否已签到
        const signedIn = await queryFirst<{ id: number }>(
            db,
            'SELECT id FROM user_signin_records WHERE user_id = ? AND signin_date = ?',
            userId,
            dateStr
        );

        if (!signedIn) {
            missedDays.push(dateStr);

            // 格式化为 "4月18日" 形式
            const month = d.getMonth() + 1;
            const day = d.getDate();
            missedDaysFormatted.push(`${month}月${day}日`);
        }
    }

    const consecutiveMakeupCount = await getMonthMakeupCount(db, userId) + 1; // +1 因为即将进行下一次补签
    const currentCost = calculateMakeupCost(consecutiveMakeupCount);

    return {
        canMakeup: missedDays.length > 0,
        missedDays,
        missedDaysFormatted,
        consecutiveMakeupCount,
        currentCost,
        maxDaysBack,
    };
}

/**
 * 验证补签日期是否合法
 */
async function validateMakeupDate(
    db: Database,
    userId: number,
    targetDate: string
): Promise<{ valid: boolean; error?: string }> {
    const { maxDaysBack } = MAKEUP_SIGNIN_CONFIG;

    // 格式验证
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(targetDate)) {
        return { valid: false, error: '日期格式无效' };
    }

    // 禁止补签今天
    const today = new Date().toISOString().split('T')[0];
    if (targetDate === today) {
        return { valid: false, error: '今天还未结束，无法补签' };
    }

    // 禁止补签未来日期
    if (targetDate > today) {
        return { valid: false, error: '禁止穿越补签' };
    }

    // 检查是否超过补签期限
    const d = new Date(targetDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > maxDaysBack) {
        return { valid: false, error: `仅支持补签近 ${maxDaysBack} 天的漏签` };
    }

    // 检查是否已签到
    const existing = await queryFirst<{ id: number }>(
        db,
        'SELECT id FROM user_signin_records WHERE user_id = ? AND signin_date = ?',
        userId,
        targetDate
    );

    if (existing) {
        return { valid: false, error: '该日期已完成签到，无需补签' };
    }

    return { valid: true };
}

/**
 * 获取用户在目标日期的连续签到天数
 * 规则：从目标日期往前数有多少个连续的签到记录
 */
async function calculateStreakForDate(
    db: Database,
    userId: number,
    targetDate: string
): Promise<number> {
    const result = await db.prepare(`
        WITH RECURSIVE dates AS (
            SELECT date(?) as curr_date
            UNION ALL
            SELECT date(curr_date, '-1 day')
            FROM dates
            WHERE curr_date > date('now', '-30 days')
        )
        SELECT COUNT(*) as streak FROM (
            SELECT d.curr_date
            FROM dates d
            LEFT JOIN user_signin_records r
                ON d.curr_date = r.signin_date AND r.user_id = ?
            WHERE r.id IS NOT NULL
            AND d.curr_date <= ?
        )
    `).bind(userId, targetDate).first();

    return (result as { streak?: number })?.streak || 0;
}

/**
 * 补签核心流程
 */
export async function processMakeupSignin(
    db: Database,
    userId: number,
    targetDate: string,
    baseReward: number = 5
): Promise<MakeupSigninResult> {
    // 1. 验证日期
    const validation = await validateMakeupDate(db, userId, targetDate);
    if (!validation.valid) {
        return { success: false, error: validation.error };
    }

    // 2. 计算费用
    const consecutiveMakeupCount = await getMonthMakeupCount(db, userId) + 1;
    const cost = calculateMakeupCost(consecutiveMakeupCount);

    // 3. 检查余额
    const currentBalance = await getUserCoins(db, userId);
    if (currentBalance < cost) {
        return {
            success: false,
            error: `星辰不足，需要 ${cost} 星尘，当前余额 ${currentBalance} 星尘`,
        };
    }

    // 4. 扣费
    const spendResult = await spendCoins(
        db,
        userId,
        cost,
        'makeup_signin',
        `补签 ${targetDate}（本月第${consecutiveMakeupCount}次补签）`
    );

    if (!spendResult.success) {
        return { success: false, error: spendResult.error || '扣费失败' };
    }

    // 5. 计算该日期的连续签到天数
    const streakDays = await calculateStreakForDate(db, userId, targetDate);

    // 6. 插入签到记录
    const now = Math.floor(Date.now() / 1000);
    await execute(
        db,
        `INSERT INTO user_signin_records
         (user_id, signin_date, is_makeup, reward_coins, streak_days, created_at)
         VALUES (?, ?, 1, ?, ?, ?)`,
        userId,
        targetDate,
        baseReward,
        streakDays,
        now
    );

    return {
        success: true,
        cost,
        consecutiveMakeupCount,
        rewardCoins: baseReward,
        newBalance: spendResult.newBalance,
    };
}

/**
 * 获取用户某月的签到记录（用于日历展示）
 * 返回该月每天的签到状态
 */
export async function getMonthlySigninRecords(
    db: Database,
    userId: number,
    year: number,
    month: number // 1-12
): Promise<Map<string, { signedIn: boolean; isMakeup: boolean; rewardCoins: number }>> {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    const records = await db.prepare(`
        SELECT signin_date, is_makeup, reward_coins
        FROM user_signin_records
        WHERE user_id = ? AND signin_date LIKE ?
        ORDER BY signin_date
    `).bind(userId, `${monthStr}%`).all<{
        signin_date: string;
        is_makeup: number;
        reward_coins: number;
    }>();

    const map = new Map<string, { signedIn: boolean; isMakeup: boolean; rewardCoins: number }>();

    for (const r of records.results || []) {
        map.set(r.signin_date, {
            signedIn: true,
            isMakeup: r.is_makeup === 1,
            rewardCoins: r.reward_coins,
        });
    }

    return map;
}

/**
 * 获取补签预估费用（给前端预览用）
 * 不执行任何写入操作
 */
export async function getMakeupEstimate(
    db: Database,
    userId: number,
    targetDate: string
): Promise<{ cost: number; balance: number; canAfford: boolean; error?: string }> {
    const validation = await validateMakeupDate(db, userId, targetDate);
    if (!validation.valid) {
        return { cost: 0, balance: 0, canAfford: false, error: validation.error };
    }

    const consecutiveCount = await getMonthMakeupCount(db, userId) + 1;
    const cost = calculateMakeupCost(consecutiveCount);
    const balance = await getUserCoins(db, userId);

    return {
        cost,
        balance,
        canAfford: balance >= cost,
    };
}

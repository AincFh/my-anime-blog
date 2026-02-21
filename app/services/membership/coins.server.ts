/**
 * 积分系统服务
 * 管理积分获取、消费、余额查询
 */

import { execute, queryFirst } from '../db.server';

export interface CoinTransaction {
    id: number;
    user_id: number;
    amount: number;
    type: 'earn' | 'spend' | 'gift' | 'refund' | 'expire';
    source: string;
    reference_type: string | null;
    reference_id: string | null;
    balance_before: number;
    balance_after: number;
    description: string | null;
    operator_id: number | null;
    created_at: number;
}

export type CoinSource =
    | 'daily_login'
    | 'daily_signin'
    | 'purchase'
    | 'activity'
    | 'referral'
    | 'achievement'
    | 'admin'
    | 'refund'
    | 'shop';

/**
 * 获取用户积分余额
 */
export async function getUserCoins(db: any, userId: number): Promise<number> {
    const user = await queryFirst<{ coins: number }>(
        db,
        'SELECT coins FROM users WHERE id = ?',
        userId
    );
    return user?.coins || 0;
}

/**
 * 增加积分（原子操作）
 */
export async function addCoins(
    db: any,
    userId: number,
    amount: number,
    source: CoinSource,
    description?: string,
    referenceType?: string,
    referenceId?: string,
    operatorId?: number
): Promise<{ success: boolean; newBalance: number; error?: string }> {
    if (amount <= 0) {
        return { success: false, newBalance: 0, error: '积分数量必须为正数' };
    }

    try {
        // 获取当前余额（用于记录交易）
        const currentBalance = await getUserCoins(db, userId);

        // ⚠️ 使用原子更新，避免并发问题
        await execute(
            db,
            'UPDATE users SET coins = coins + ? WHERE id = ?',
            amount,
            userId
        );

        // 查询更新后的余额
        const newBalance = await getUserCoins(db, userId);

        // 记录交易
        await execute(
            db,
            `INSERT INTO coin_transactions (
        user_id, amount, type, source, reference_type, reference_id,
        balance_before, balance_after, description, operator_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            userId,
            amount,
            'earn',
            source,
            referenceType || null,
            referenceId || null,
            currentBalance,
            newBalance,
            description || null,
            operatorId || null
        );

        return { success: true, newBalance };
    } catch (error) {
        console.error('Add coins error:', error);
        return { success: false, newBalance: 0, error: '积分增加失败' };
    }
}

/**
 * 消费积分（原子操作）
 */
export async function spendCoins(
    db: any,
    userId: number,
    amount: number,
    source: CoinSource,
    description?: string,
    referenceType?: string,
    referenceId?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
    if (amount <= 0) {
        return { success: false, newBalance: 0, error: '消费数量必须为正数' };
    }

    try {
        // 获取当前余额
        const currentBalance = await getUserCoins(db, userId);

        if (currentBalance < amount) {
            return { success: false, newBalance: currentBalance, error: '积分不足' };
        }

        // ⚠️ 使用原子更新 + 条件检查，防止并发时透支
        // coins >= amount 确保不会扣成负数
        const updateResult = await execute(
            db,
            'UPDATE users SET coins = coins - ? WHERE id = ? AND coins >= ?',
            amount,
            userId,
            amount
        );

        // 检查是否更新成功（如果没有更新行，说明余额不足）
        if (!updateResult.meta?.changes || updateResult.meta.changes === 0) {
            return { success: false, newBalance: currentBalance, error: '积分不足或并发冲突' };
        }

        // 查询更新后的余额
        const newBalance = await getUserCoins(db, userId);

        // 记录交易
        await execute(
            db,
            `INSERT INTO coin_transactions (
        user_id, amount, type, source, reference_type, reference_id,
        balance_before, balance_after, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            userId,
            -amount,
            'spend',
            source,
            referenceType || null,
            referenceId || null,
            currentBalance,
            newBalance,
            description || null
        );

        return { success: true, newBalance };
    } catch (error) {
        console.error('Spend coins error:', error);
        return { success: false, newBalance: 0, error: '积分消费失败' };
    }
}

/**
 * 退还积分
 */
export async function refundCoins(
    db: any,
    userId: number,
    amount: number,
    originalTransactionId: string,
    description?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
    return addCoins(
        db,
        userId,
        amount,
        'refund',
        description || '积分退还',
        'transaction',
        originalTransactionId
    );
}

/**
 * 获取用户积分交易历史
 */
export async function getCoinTransactionHistory(
    db: any,
    userId: number,
    limit: number = 50,
    offset: number = 0
): Promise<CoinTransaction[]> {
    const result = await db
        .prepare(
            `SELECT * FROM coin_transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`
        )
        .bind(userId, limit, offset)
        .all();

    return result.results || [];
}

/**
 * 每日登录奖励
 */
export async function claimDailyLoginReward(
    db: any,
    userId: number,
    multiplier: number = 1
): Promise<{ success: boolean; coins: number; error?: string }> {
    const baseReward = 10;
    const reward = Math.floor(baseReward * multiplier);

    // 检查今天是否已领取
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = Math.floor(today.getTime() / 1000);

    const alreadyClaimed = await queryFirst<{ id: number }>(
        db,
        `SELECT id FROM coin_transactions 
     WHERE user_id = ? AND source = 'daily_login' AND created_at >= ?`,
        userId,
        todayStart
    );

    if (alreadyClaimed) {
        return { success: false, coins: 0, error: '今日已领取' };
    }

    const result = await addCoins(
        db,
        userId,
        reward,
        'daily_login',
        `每日登录奖励 (+${reward}积分)`
    );

    if (result.success) {
        return { success: true, coins: reward };
    }

    return { success: false, coins: 0, error: result.error };
}

/**
 * 管理员赠送积分
 */
export async function giftCoins(
    db: any,
    userId: number,
    amount: number,
    operatorId: number,
    reason?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
    try {
        const currentBalance = await getUserCoins(db, userId);
        const newBalance = currentBalance + amount;

        await execute(
            db,
            'UPDATE users SET coins = ? WHERE id = ?',
            newBalance,
            userId
        );

        await execute(
            db,
            `INSERT INTO coin_transactions (
        user_id, amount, type, source, balance_before, balance_after,
        description, operator_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            userId,
            amount,
            'gift',
            'admin',
            currentBalance,
            newBalance,
            reason || '管理员赠送',
            operatorId
        );

        return { success: true, newBalance };
    } catch (error) {
        console.error('Gift coins error:', error);
        return { success: false, newBalance: 0, error: '赠送失败' };
    }
}

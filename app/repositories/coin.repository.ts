/**
 * 积分数据访问层
 * 封装 coin_transactions 表的所有数据库操作
 */

import { queryFirst, execute, queryAll, type Database } from '~/services/db.server';

export interface CoinTransactionRow {
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
    | 'shop'
    | 'gacha'
    | 'mission_reward'
    | 'makeup_signin';

export interface CreateCoinTransactionDTO {
    userId: number;
    amount: number;
    type: CoinTransactionRow['type'];
    source: CoinSource;
    balanceBefore: number;
    balanceAfter: number;
    description?: string | null;
    referenceType?: string | null;
    referenceId?: string | null;
    operatorId?: number | null;
}

export interface SpendCoinDTO {
    userId: number;
    amount: number;
    source: CoinSource;
    description: string;
    referenceType?: string;
    referenceId?: string;
}

export const coinRepository = {
    async getBalance(db: Database, userId: number): Promise<number> {
        const result = await queryFirst<{ coins: number }>(
            db,
            'SELECT coins FROM users WHERE id = ?',
            userId
        );
        return result?.coins || 0;
    },

    async addCoins(db: Database, dto: CreateCoinTransactionDTO): Promise<{ success: boolean; newBalance: number }> {
        if (dto.amount <= 0) {
            return { success: false, newBalance: dto.balanceBefore };
        }

        const newBalance = dto.balanceBefore + dto.amount;

        await db.batch([
            db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').bind(dto.amount, dto.userId),
            db.prepare(`
                INSERT INTO coin_transactions
                    (user_id, amount, type, source, reference_type, reference_id,
                     balance_before, balance_after, description, operator_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
            `).bind(
                dto.userId,
                dto.amount,
                dto.type,
                dto.source,
                dto.referenceType || null,
                dto.referenceId || null,
                dto.balanceBefore,
                newBalance,
                dto.description || null,
                dto.operatorId || null
            ),
        ]);

        return { success: true, newBalance };
    },

    async spendCoins(db: Database, dto: SpendCoinDTO): Promise<{ success: boolean; newBalance: number; error?: string }> {
        if (dto.amount <= 0) {
            return { success: false, newBalance: 0, error: '积分数量必须为正数' };
        }

        const currentBalance = await this.getBalance(db, dto.userId);
        if (currentBalance < dto.amount) {
            return { success: false, newBalance: currentBalance, error: '积分余额不足' };
        }

        const newBalance = currentBalance - dto.amount;

        await db.batch([
            db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').bind(dto.amount, dto.userId),
            db.prepare(`
                INSERT INTO coin_transactions
                    (user_id, amount, type, source, reference_type, reference_id,
                     balance_before, balance_after, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
            `).bind(
                dto.userId,
                -dto.amount,
                'spend',
                dto.source,
                dto.referenceType || null,
                dto.referenceId || null,
                currentBalance,
                newBalance,
                dto.description
            ),
        ]);

        return { success: true, newBalance };
    },

    async findUserTransactions(
        db: Database,
        userId: number,
        limit: number = 20,
        offset: number = 0
    ): Promise<CoinTransactionRow[]> {
        return queryAll<CoinTransactionRow>(
            db,
            `SELECT * FROM coin_transactions
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            userId,
            limit,
            offset
        );
    },

    async getTransactionById(db: Database, id: number): Promise<CoinTransactionRow | null> {
        return queryFirst<CoinTransactionRow>(
            db,
            'SELECT * FROM coin_transactions WHERE id = ?',
            id
        );
    },

    async getTotalEarned(db: Database, userId: number): Promise<number> {
        const result = await queryFirst<{ total: number }>(
            db,
            `SELECT COALESCE(SUM(amount), 0) as total FROM coin_transactions
             WHERE user_id = ? AND amount > 0`,
            userId
        );
        return result?.total || 0;
    },

    async getTotalSpent(db: Database, userId: number): Promise<number> {
        const result = await queryFirst<{ total: number }>(
            db,
            `SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM coin_transactions
             WHERE user_id = ? AND amount < 0`,
            userId
        );
        return result?.total || 0;
    },
};

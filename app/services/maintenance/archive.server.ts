/**
 * 日志归档服务
 * 将超过保留期的日志数据迁移到归档表，并从主表删除
 */

import { execute, executeBatch, queryFirst } from '../db.server';

// ... (retain existing code) ...

/**
 * 获取归档统计信息（预计可归档数量）
 */
export async function getArchiveStats(db: any): Promise<{
    auditLogs: number;
    loginHistory: number;
    coinTransactions: number;
}> {
    const auditCutoff = Math.floor(Date.now() / 1000) - RETENTION_DAYS.AUDIT_LOGS * 24 * 60 * 60;
    const loginCutoff = Math.floor(Date.now() / 1000) - RETENTION_DAYS.LOGIN_HISTORY * 24 * 60 * 60;
    const coinCutoff = Math.floor(Date.now() / 1000) - RETENTION_DAYS.COIN_TRANSACTIONS * 24 * 60 * 60;

    const [audit, login, coin] = await Promise.all([
        queryFirst<{ count: number }>(db, 'SELECT COUNT(*) as count FROM audit_logs WHERE created_at < ?', auditCutoff),
        queryFirst<{ count: number }>(db, 'SELECT COUNT(*) as count FROM login_history WHERE created_at < ?', loginCutoff),
        queryFirst<{ count: number }>(db, 'SELECT COUNT(*) as count FROM coin_transactions WHERE created_at < ?', coinCutoff),
    ]);

    return {
        auditLogs: audit?.count || 0,
        loginHistory: login?.count || 0,
        coinTransactions: coin?.count || 0
    };
}


export interface ArchiveResult {
    success: boolean;
    archivedCount: number;
    error?: string;
}

// 默认保留天数
const RETENTION_DAYS = {
    AUDIT_LOGS: 90,
    LOGIN_HISTORY: 30,
    COIN_TRANSACTIONS: 180, // 财务数据保留半年
};

/**
 * 归档审计日志
 * @param retentionDays 保留天数
 */
export async function archiveAuditLogs(
    db: any,
    retentionDays: number = RETENTION_DAYS.AUDIT_LOGS
): Promise<ArchiveResult> {
    const cutoffDate = Math.floor(Date.now() / 1000) - retentionDays * 24 * 60 * 60;

    try {
        // 1. 复制数据到归档表
        const copyResult = await execute(
            db,
            `INSERT INTO audit_logs_archive (
                id, user_id, action, target_type, target_id, 
                old_value, new_value, ip_address, user_agent, 
                risk_level, metadata, created_at
             )
             SELECT 
                id, user_id, action, target_type, target_id, 
                old_value, new_value, ip_address, user_agent, 
                risk_level, metadata, created_at
             FROM audit_logs
             WHERE created_at < ?`,
            cutoffDate
        );

        if (!copyResult.success) {
            return { success: false, archivedCount: 0, error: '复制数据失败' };
        }

        const count = copyResult.meta?.changes || 0;

        if (count > 0) {
            // 2. 从主表删除数据
            await execute(
                db,
                'DELETE FROM audit_logs WHERE created_at < ?',
                cutoffDate
            );
        }

        return { success: true, archivedCount: count };
    } catch (error) {
        console.error('Archive audit logs error:', error);
        return { success: false, archivedCount: 0, error: String(error) };
    }
}

/**
 * 归档登录历史
 */
export async function archiveLoginHistory(
    db: any,
    retentionDays: number = RETENTION_DAYS.LOGIN_HISTORY
): Promise<ArchiveResult> {
    const cutoffDate = Math.floor(Date.now() / 1000) - retentionDays * 24 * 60 * 60;

    try {
        const copyResult = await execute(
            db,
            `INSERT INTO login_history_archive (
                id, user_id, ip_address, user_agent, device_type,
                browser, os, location, status, fail_reason,
                session_token, created_at
             )
             SELECT 
                id, user_id, ip_address, user_agent, device_type,
                browser, os, location, status, fail_reason,
                session_token, created_at
             FROM login_history
             WHERE created_at < ?`,
            cutoffDate
        );

        const count = copyResult.meta?.changes || 0;

        if (count > 0) {
            await execute(
                db,
                'DELETE FROM login_history WHERE created_at < ?',
                cutoffDate
            );
        }

        return { success: true, archivedCount: count };
    } catch (error) {
        console.error('Archive login history error:', error);
        return { success: false, archivedCount: 0, error: String(error) };
    }
}

/**
 * 归档积分交易记录
 */
export async function archiveCoinTransactions(
    db: any,
    retentionDays: number = RETENTION_DAYS.COIN_TRANSACTIONS
): Promise<ArchiveResult> {
    const cutoffDate = Math.floor(Date.now() / 1000) - retentionDays * 24 * 60 * 60;

    try {
        const copyResult = await execute(
            db,
            `INSERT INTO coin_transactions_archive (
                id, user_id, amount, type, source,
                reference_type, reference_id, balance_before,
                balance_after, description, operator_id, created_at
             )
             SELECT 
                id, user_id, amount, type, source,
                reference_type, reference_id, balance_before,
                balance_after, description, operator_id, created_at
             FROM coin_transactions
             WHERE created_at < ?`,
            cutoffDate
        );

        const count = copyResult.meta?.changes || 0;

        if (count > 0) {
            await execute(
                db,
                'DELETE FROM coin_transactions WHERE created_at < ?',
                cutoffDate
            );
        }

        return { success: true, archivedCount: count };
    } catch (error) {
        console.error('Archive coin transactions error:', error);
        return { success: false, archivedCount: 0, error: String(error) };
    }
}

/**
 * 执行所有归档任务
 */
export async function runAllArchives(db: any): Promise<Record<string, ArchiveResult>> {
    return {
        auditLogs: await archiveAuditLogs(db),
        loginHistory: await archiveLoginHistory(db),
        coinTransactions: await archiveCoinTransactions(db),
    };
}




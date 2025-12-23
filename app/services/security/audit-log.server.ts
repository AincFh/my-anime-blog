/**
 * 审计日志服务
 * 记录所有关键操作，用于安全审计和问题追溯
 */

import { execute } from '../db.server';

export type AuditAction =
    | 'login'
    | 'login_failed'
    | 'logout'
    | 'register'
    | 'password_change'
    | '2fa_enable'
    | '2fa_disable'
    | '2fa_verify'
    | 'profile_update'
    | 'subscription_create'
    | 'subscription_cancel'
    | 'subscription_renew'
    | 'payment_create'
    | 'payment_success'
    | 'payment_failed'
    | 'payment_refund'
    | 'coins_earn'
    | 'coins_spend'
    | 'shop_purchase'
    | 'admin_action'
    | 'session_revoke'
    | 'settings_change';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface AuditLogEntry {
    userId?: number;
    action: AuditAction;
    targetType?: string;
    targetId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
    riskLevel?: RiskLevel;
    metadata?: Record<string, any>;
}

/**
 * 记录审计日志
 */
export async function logAudit(
    db: any,
    entry: AuditLogEntry
): Promise<void> {
    try {
        await execute(
            db,
            `INSERT INTO audit_logs (
        user_id, action, target_type, target_id, 
        old_value, new_value, ip_address, user_agent, 
        risk_level, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            entry.userId || null,
            entry.action,
            entry.targetType || null,
            entry.targetId || null,
            entry.oldValue ? JSON.stringify(entry.oldValue) : null,
            entry.newValue ? JSON.stringify(entry.newValue) : null,
            entry.ipAddress || null,
            entry.userAgent || null,
            entry.riskLevel || determineRiskLevel(entry.action),
            entry.metadata ? JSON.stringify(entry.metadata) : null
        );
    } catch (error) {
        // 审计日志失败不应影响主业务
        console.error('Audit log failed:', error);
    }
}

/**
 * 根据操作类型确定风险等级
 */
function determineRiskLevel(action: AuditAction): RiskLevel {
    const highRiskActions: AuditAction[] = [
        'password_change',
        '2fa_disable',
        'payment_refund',
        'admin_action',
        'session_revoke',
    ];

    const mediumRiskActions: AuditAction[] = [
        '2fa_enable',
        'payment_success',
        'subscription_cancel',
        'settings_change',
    ];

    if (highRiskActions.includes(action)) return 'high';
    if (mediumRiskActions.includes(action)) return 'medium';
    return 'low';
}

/**
 * 从请求中提取审计信息
 */
export function extractAuditInfo(request: Request): {
    ipAddress: string;
    userAgent: string;
} {
    const ipAddress =
        request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
        request.headers.get('X-Real-IP') ||
        'unknown';

    const userAgent = request.headers.get('User-Agent') || 'unknown';

    return { ipAddress, userAgent };
}

/**
 * 记录登录审计
 */
export async function logLoginAudit(
    db: any,
    userId: number,
    success: boolean,
    request: Request,
    failReason?: string
): Promise<void> {
    const { ipAddress, userAgent } = extractAuditInfo(request);

    await logAudit(db, {
        userId,
        action: success ? 'login' : 'login_failed',
        ipAddress,
        userAgent,
        riskLevel: success ? 'low' : 'medium',
        metadata: failReason ? { reason: failReason } : undefined,
    });
}

/**
 * 记录支付审计
 */
export async function logPaymentAudit(
    db: any,
    userId: number,
    orderId: string,
    action: 'payment_create' | 'payment_success' | 'payment_failed' | 'payment_refund',
    amount: number,
    request: Request,
    metadata?: Record<string, any>
): Promise<void> {
    const { ipAddress, userAgent } = extractAuditInfo(request);

    await logAudit(db, {
        userId,
        action,
        targetType: 'order',
        targetId: orderId,
        ipAddress,
        userAgent,
        riskLevel: action === 'payment_refund' ? 'high' : 'medium',
        metadata: { amount, ...metadata },
    });
}

/**
 * 记录订阅审计
 */
export async function logSubscriptionAudit(
    db: any,
    userId: number,
    subscriptionId: string,
    action: 'subscription_create' | 'subscription_cancel' | 'subscription_renew',
    request: Request,
    oldValue?: any,
    newValue?: any
): Promise<void> {
    const { ipAddress, userAgent } = extractAuditInfo(request);

    await logAudit(db, {
        userId,
        action,
        targetType: 'subscription',
        targetId: subscriptionId,
        oldValue,
        newValue,
        ipAddress,
        userAgent,
    });
}

/**
 * 查询用户审计日志
 */
export async function getUserAuditLogs(
    db: any,
    userId: number,
    limit: number = 50,
    offset: number = 0
): Promise<any[]> {
    const result = await db
        .prepare(
            `SELECT * FROM audit_logs 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`
        )
        .bind(userId, limit, offset)
        .all();

    return result.results || [];
}

/**
 * 查询高风险操作
 */
export async function getHighRiskAuditLogs(
    db: any,
    limit: number = 100
): Promise<any[]> {
    const result = await db
        .prepare(
            `SELECT al.*, u.email, u.username 
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.risk_level = 'high'
       ORDER BY al.created_at DESC 
       LIMIT ?`
        )
        .bind(limit)
        .all();

    return result.results || [];
}

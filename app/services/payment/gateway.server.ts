/**
 * 统一支付网关
 * 抽象支付接口，支持多种支付方式
 */

import { generateOrderNo, generateNonce, generatePaymentSign } from '../security/payment-sign.server';
import { execute, queryFirst } from '../db.server';

export type PaymentMethod = 'wechat' | 'alipay' | 'paypal' | 'mock';
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled' | 'expired';
export type ProductType = 'subscription' | 'coins' | 'shop_item';

// ==================== 订单状态机 ====================
/**
 * 订单状态转换规则
 * - pending: 可转为 paid/failed/cancelled/expired
 * - paid: 仅可转为 refunded
 * - failed: 可重试转为 pending
 * - cancelled/expired/refunded: 终态，不可转换
 */
export const ORDER_STATE_MACHINE: Record<OrderStatus, OrderStatus[]> = {
    pending: ['paid', 'failed', 'cancelled', 'expired'],
    paid: ['refunded'],
    failed: ['pending'], // 允许重试
    cancelled: [],
    expired: [],
    refunded: [],
};

/**
 * 检查订单状态是否可以转换
 */
export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
    return ORDER_STATE_MACHINE[from]?.includes(to) ?? false;
}

/**
 * 判断是否为终态
 */
export function isTerminalStatus(status: OrderStatus): boolean {
    return ORDER_STATE_MACHINE[status]?.length === 0;
}
// ==================== End 状态机 ====================

export interface CreateOrderParams {
    userId: number;
    amount: number;           // 金额（分）
    productType: ProductType;
    productId: string;
    productName: string;
    paymentMethod: PaymentMethod;
    clientIp?: string;
    userAgent?: string;
}

export interface PaymentOrder {
    id: number;
    order_no: string;
    user_id: number;
    amount: number;
    currency: string;
    payment_method: string;
    status: OrderStatus;
    product_type: string;
    product_id: string;
    product_name: string;
    trade_no: string | null;
    nonce: string;
    created_at: number;
    paid_at: number | null;
    expires_at: number;
}

export interface PaymentResult {
    success: boolean;
    orderNo?: string;
    payUrl?: string;
    qrCode?: string;
    error?: string;
}

export interface PaymentCallbackData {
    orderNo: string;
    tradeNo: string;
    amount: number;
    status: 'success' | 'failed';
    paidAt?: number;
}

/**
 * 创建支付订单
 */
export async function createPaymentOrder(
    db: any,
    params: CreateOrderParams
): Promise<{ success: boolean; order?: PaymentOrder; error?: string }> {
    const orderNo = generateOrderNo();
    const nonce = generateNonce();
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60; // 30分钟过期

    try {
        const result = await execute(
            db,
            `INSERT INTO payment_orders (
        order_no, user_id, amount, currency, payment_method,
        status, product_type, product_id, product_name,
        nonce, client_ip, user_agent, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            orderNo,
            params.userId,
            params.amount,
            'CNY',
            params.paymentMethod,
            'pending',
            params.productType,
            params.productId,
            params.productName,
            nonce,
            params.clientIp || null,
            params.userAgent || null,
            expiresAt
        );

        if (!result.success) {
            return { success: false, error: '创建订单失败' };
        }

        const order = await queryFirst<PaymentOrder>(
            db,
            'SELECT * FROM payment_orders WHERE order_no = ?',
            orderNo
        );

        return { success: true, order: order! };
    } catch (error) {
        console.error('Create order error:', error);
        return { success: false, error: '创建订单失败' };
    }
}

/**
 * 获取订单
 */
export async function getOrder(
    db: any,
    orderNo: string
): Promise<PaymentOrder | null> {
    return queryFirst<PaymentOrder>(
        db,
        'SELECT * FROM payment_orders WHERE order_no = ?',
        orderNo
    );
}

/**
 * 更新订单状态
 */
export async function updateOrderStatus(
    db: any,
    orderNo: string,
    status: OrderStatus,
    tradeNo?: string,
    paidAt?: number
): Promise<boolean> {
    try {
        const updates: string[] = ['status = ?'];
        const values: any[] = [status];

        if (tradeNo) {
            updates.push('trade_no = ?');
            values.push(tradeNo);
        }

        if (paidAt) {
            updates.push('paid_at = ?');
            values.push(paidAt);
        }

        values.push(orderNo);

        await execute(
            db,
            `UPDATE payment_orders SET ${updates.join(', ')} WHERE order_no = ?`,
            ...values
        );

        return true;
    } catch (error) {
        console.error('Update order status error:', error);
        return false;
    }
}

/**
 * 获取用户订单列表
 */
export async function getUserOrders(
    db: any,
    userId: number,
    status?: OrderStatus,
    limit: number = 20,
    offset: number = 0
): Promise<PaymentOrder[]> {
    let query = 'SELECT * FROM payment_orders WHERE user_id = ?';
    const params: any[] = [userId];

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await db.prepare(query).bind(...params).all();
    return result.results || [];
}

/**
 * 检查并过期超时订单
 */
export async function expireTimeoutOrders(db: any): Promise<number> {
    const now = Math.floor(Date.now() / 1000);

    const result = await execute(
        db,
        `UPDATE payment_orders 
     SET status = 'expired' 
     WHERE status = 'pending' AND expires_at < ?`,
        now
    );

    return result.meta?.changes || 0;
}

/**
 * 验证订单是否可支付
 */
export function validateOrderForPayment(order: PaymentOrder): {
    valid: boolean;
    error?: string;
} {
    if (!order) {
        return { valid: false, error: '订单不存在' };
    }

    if (order.status !== 'pending') {
        return { valid: false, error: `订单状态不正确: ${order.status}` };
    }

    const now = Math.floor(Date.now() / 1000);
    if (order.expires_at < now) {
        return { valid: false, error: '订单已过期' };
    }

    return { valid: true };
}

// ============ 幂等性保护 ============

/**
 * 获取支付处理锁（防止并发重复处理）
 * @param kv KV 命名空间
 * @param lockKey 锁的键名
 * @param ttlSeconds 锁的过期时间（秒）
 * @returns 是否成功获取锁
 */
export async function acquirePaymentLock(
    kv: KVNamespace | null,
    lockKey: string,
    ttlSeconds: number = 30
): Promise<boolean> {
    // 开发环境跳过锁检查
    if (!kv) return true;

    try {
        const existing = await kv.get(lockKey);
        if (existing) {
            console.log(`支付锁已存在: ${lockKey}`);
            return false;
        }

        // 设置锁，带过期时间
        await kv.put(lockKey, JSON.stringify({
            acquiredAt: Date.now(),
            expiresAt: Date.now() + ttlSeconds * 1000
        }), { expirationTtl: ttlSeconds });

        return true;
    } catch (error) {
        console.error('获取支付锁失败:', error);
        return false;
    }
}

/**
 * 释放支付处理锁
 */
export async function releasePaymentLock(
    kv: KVNamespace | null,
    lockKey: string
): Promise<void> {
    if (!kv) return;

    try {
        await kv.delete(lockKey);
    } catch (error) {
        console.error('释放支付锁失败:', error);
    }
}

/**
 * 通过 trade_no 查询订单（用于去重检查）
 * @param db 数据库连接
 * @param tradeNo 第三方交易号
 * @returns 已存在的订单，或 null
 */
export async function getOrderByTradeNo(
    db: any,
    tradeNo: string
): Promise<PaymentOrder | null> {
    return queryFirst<PaymentOrder>(
        db,
        'SELECT * FROM payment_orders WHERE trade_no = ? AND status = ?',
        tradeNo,
        'paid'
    );
}


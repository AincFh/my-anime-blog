/**
 * 支付回调 API
 * 处理支付成功后的回调通知
 * 
 * 安全机制：
 * 1. 签名验证 - 防止伪造回调
 * 2. IP 白名单 - 限制回调来源
 * 3. 时间戳校验 - 防重放攻击
 * 4. 金额校验 - 防止篡改
 * 5. 状态机校验 - 防止重复处理
 */

// 订单状态机定义
const ORDER_STATE_MACHINE: Record<string, string[]> = {
    pending: ['paid', 'failed', 'cancelled', 'expired'],
    paid: ['refunded'],
    failed: ['pending'], // 允许重试
    cancelled: [],
    expired: [],
    refunded: [],
};

function canTransition(from: string, to: string): boolean {
    return ORDER_STATE_MACHINE[from]?.includes(to) ?? false;
}

export async function action({ request, context }: { request: Request; context: any }) {
    // 动态导入服务端模块
    const { getOrder, updateOrderStatus, acquirePaymentLock, releasePaymentLock, getOrderByTradeNo } = await import('~/services/payment/gateway.server');
    const { createSubscription } = await import('~/services/membership/subscription.server');
    const { addCoins } = await import('~/services/membership/coins.server');
    const { logAudit } = await import('~/services/security/audit-log.server');
    const { validateAmount, validateTimestamp } = await import('~/services/security/payment-sign.server');
    const { verifyCallbackSignature, isCallbackIPAllowed } = await import('~/services/payment/signature.server');
    const { PAYMENT_CONFIG } = await import('~/config');

    const env = context.cloudflare.env;
    const { anime_db, CACHE_KV, PAYMENT_SECRET, PAYMENT_CALLBACK_IPS, ENVIRONMENT } = env;
    const isDevelopment = ENVIRONMENT !== 'production';

    // 只接受 POST
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    // ==================== IP 白名单校验 ====================
    const clientIP = request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
        request.headers.get('X-Real-IP') ||
        'unknown';

    if (!isCallbackIPAllowed(clientIP, PAYMENT_CALLBACK_IPS, isDevelopment)) {
        console.error(`支付回调 IP 不在白名单: ${clientIP}`);
        await logAudit(anime_db, {
            action: 'payment_failed',
            metadata: { reason: 'IP 不在白名单', ip: clientIP },
            riskLevel: 'high',
        });
        return new Response('Forbidden', { status: 403 });
    }

    try {
        // ==================== 解析参数 ====================
        const contentType = request.headers.get('content-type') || '';
        let params: {
            order_no: string;
            trade_no: string;
            amount: string | number;
            status: 'success' | 'failed';
            timestamp: string | number;
            sign: string;
            nonce?: string;
        };

        if (contentType.includes('application/json')) {
            params = await request.json();
        } else {
            const formData = await request.formData();
            params = {
                order_no: formData.get('order_no') as string,
                trade_no: formData.get('trade_no') as string,
                amount: formData.get('amount') as string,
                status: formData.get('status') as 'success' | 'failed',
                timestamp: formData.get('timestamp') as string,
                sign: formData.get('sign') as string,
                nonce: formData.get('nonce') as string,
            };
        }

        // ==================== 参数验证 ====================
        if (!params.order_no || !params.trade_no || !params.amount || !params.status) {
            return Response.json({ success: false, error: '参数不完整' }, { status: 400 });
        }

        // ==================== 时间戳校验（防重放） ====================
        if (params.timestamp && !validateTimestamp(params.timestamp, PAYMENT_CONFIG.timestampValidity)) {
            return Response.json({ success: false, error: '请求已过期' }, { status: 400 });
        }

        // ==================== 签名验证（核心安全） ====================
        if (!params.sign) {
            console.error('支付回调缺少签名');
            await logAudit(anime_db, {
                action: 'payment_failed',
                targetId: params.order_no,
                metadata: { reason: '缺少签名' },
                riskLevel: 'high',
            });
            return Response.json({ success: false, error: '签名缺失' }, { status: 400 });
        }

        const signatureResult = await verifyCallbackSignature(
            {
                order_no: params.order_no,
                trade_no: params.trade_no,
                amount: String(params.amount),
                status: params.status,
                timestamp: String(params.timestamp || ''),
                nonce: params.nonce || '',
            },
            params.sign,
            PAYMENT_SECRET
        );

        if (!signatureResult.valid) {
            console.error(`签名验证失败: ${params.order_no}`);
            await logAudit(anime_db, {
                action: 'payment_failed',
                targetId: params.order_no,
                metadata: { reason: '签名验证失败', ip: clientIP },
                riskLevel: 'high',
            });
            return Response.json({ success: false, error: signatureResult.error }, { status: 403 });
        }

        // ==================== 分布式锁 - 防止并发处理 ====================
        const lockKey = `payment_lock:${params.order_no}`;
        const lockAcquired = await acquirePaymentLock(CACHE_KV, lockKey, PAYMENT_CONFIG.lockDuration);
        if (!lockAcquired) {
            console.warn(`支付回调锁获取失败，订单正在处理中: ${params.order_no}`);
            return Response.json({ success: false, error: '请求处理中，请勿重复提交' }, { status: 429 });
        }

        try {
            // ==================== trade_no 去重检查 ====================
            if (params.trade_no) {
                const existingOrder = await getOrderByTradeNo(anime_db, params.trade_no);
                if (existingOrder && existingOrder.order_no !== params.order_no) {
                    console.error(`交易号重复使用: trade_no=${params.trade_no}, existing_order=${existingOrder.order_no}`);
                    await logAudit(anime_db, {
                        action: 'payment_failed',
                        targetId: params.order_no,
                        metadata: { reason: '交易号已被使用', trade_no: params.trade_no, existing_order: existingOrder.order_no },
                        riskLevel: 'high',
                    });
                    return Response.json({ success: false, error: '交易号已被使用' }, { status: 400 });
                }
            }

            // ==================== 获取订单 ====================
            const order = await getOrder(anime_db, params.order_no);
            if (!order) {
                return Response.json({ success: false, error: '订单不存在' }, { status: 404 });
            }

            // ==================== 状态机校验 ====================
            const targetStatus = params.status === 'success' ? 'paid' : 'failed';
            if (!canTransition(order.status, targetStatus)) {
                console.warn(`订单状态转换非法: ${order.order_no} ${order.status} -> ${targetStatus}`);
                // 如果已经是目标状态，返回成功（幂等处理）
                if (order.status === targetStatus) {
                    return Response.json({ success: true, message: '订单已处理' });
                }
                return Response.json({ success: false, error: `订单状态不正确: ${order.status}` }, { status: 400 });
            }

            // ==================== 金额校验 ====================
            const paidAmount = typeof params.amount === 'string'
                ? Math.round(parseFloat(params.amount) * 100)
                : params.amount;

            if (!validateAmount(paidAmount, order.amount)) {
                console.error(`金额不匹配: paid=${paidAmount}, order=${order.amount}`);
                await logAudit(anime_db, {
                    userId: order.user_id,
                    action: 'payment_failed',
                    targetType: 'order',
                    targetId: order.order_no,
                    metadata: { paidAmount, orderAmount: order.amount, reason: '金额不匹配' },
                    riskLevel: 'high',
                });
                return Response.json({ success: false, error: '金额不匹配' }, { status: 400 });
            }

            // ==================== 处理支付结果 ====================
            if (params.status === 'success') {
                const paidAt = Math.floor(Date.now() / 1000);
                const { product_type, product_id, user_id } = order;

                try {
                    // 先处理业务逻辑（补偿机制：业务成功后再更新状态）
                    switch (product_type) {
                        case 'subscription':
                            const [tierId, period] = product_id.split(':');
                            await createSubscription(anime_db, {
                                userId: user_id,
                                tierId: parseInt(tierId),
                                period: period as 'monthly' | 'quarterly' | 'yearly',
                                orderId: order.order_no,
                            });
                            break;

                        case 'coins':
                            const coinsAmount = parseInt(product_id);
                            await addCoins(anime_db, user_id, coinsAmount, 'purchase', `购买积分 ${coinsAmount}`, 'order', order.order_no);
                            break;

                        case 'shop_item':
                            const itemId = parseInt(product_id);
                            // 检查物品是否存在
                            const itemExists = await anime_db.prepare('SELECT id FROM shop_items WHERE id = ?').bind(itemId).first();
                            if (!itemExists) {
                                throw new Error(`Shop item not found: ${itemId}`);
                            }

                            // 插入购买记录 (即发货)
                            await anime_db.prepare(`
                                INSERT INTO user_purchases (user_id, item_id, transaction_id, purchased_at)
                                VALUES (?, ?, ?, unixepoch())
                            `).bind(user_id, itemId, order.order_no).run();

                            console.log(`Shop item delivery successful: user=${user_id}, item=${itemId}`);

                            // 记录一条 "获得物品" 的审计日志
                            await logAudit(anime_db, {
                                userId: user_id,
                                action: 'item_acquired',
                                targetType: 'shop_item',
                                targetId: product_id,
                                metadata: {
                                    order_no: order.order_no,
                                    trade_no: params.trade_no,
                                    status: 'delivered'
                                }
                            });
                            break;

                        default:
                            console.warn('Unknown product type:', product_type);
                    }

                    // 业务成功后更新订单状态
                    await updateOrderStatus(anime_db, params.order_no, 'paid', params.trade_no, paidAt);

                    // 记录审计日志
                    await logAudit(anime_db, {
                        userId: order.user_id,
                        action: 'payment_success',
                        targetType: 'order',
                        targetId: order.order_no,
                        metadata: {
                            amount: order.amount,
                            productType: order.product_type,
                            productId: order.product_id,
                            tradeNo: params.trade_no,
                        },
                    });

                    return Response.json({ success: true, message: '支付成功' });

                } catch (deliveryError) {
                    // 业务处理失败，记录异常等待人工介入
                    console.error('支付业务处理失败:', deliveryError);
                    await logAudit(anime_db, {
                        userId: order.user_id,
                        action: 'payment_failed',
                        targetType: 'order',
                        targetId: order.order_no,
                        metadata: {
                            reason: '业务处理失败',
                            error: String(deliveryError),
                            tradeNo: params.trade_no,
                        },
                        riskLevel: 'high',
                    });
                    // 不更新订单状态，保持 pending 等待重试或人工处理
                    return Response.json({ success: false, error: '业务处理失败，请联系客服' }, { status: 500 });
                }

            } else {
                // 支付失败
                await updateOrderStatus(anime_db, params.order_no, 'failed');

                await logAudit(anime_db, {
                    userId: order.user_id,
                    action: 'payment_failed',
                    targetType: 'order',
                    targetId: order.order_no,
                    metadata: {
                        reason: '支付失败',
                        ip: clientIP
                    }
                });

                return Response.json({ success: true, message: '支付失败已记录' });
            }
        } finally {
            // ==================== 释放分布式锁 ====================
            await releasePaymentLock(CACHE_KV, lockKey);
        }
    } catch (error) {
        console.error('Payment callback error:', error);
        return Response.json({ success: false, error: '处理失败' }, { status: 500 });
    }
}

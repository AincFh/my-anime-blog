/**
 * 支付回调 API
 * 处理支付成功后的回调通知
 */

export async function action({ request, context }: { request: Request; context: any }) {
    // 动态导入服务端模块
    const { getOrder, updateOrderStatus } = await import('~/services/payment/gateway.server');
    const { createSubscription } = await import('~/services/membership/subscription.server');
    const { addCoins } = await import('~/services/membership/coins.server');
    const { logAudit } = await import('~/services/security/audit-log.server');
    const { validateAmount, validateTimestamp } = await import('~/services/security/payment-sign.server');

    const { anime_db } = context.cloudflare.env;

    // 只接受 POST
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        // 解析参数
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

        // 验证必要参数
        if (!params.order_no || !params.trade_no || !params.amount || !params.status) {
            return Response.json({ success: false, error: '参数不完整' }, { status: 400 });
        }

        // 验证时间戳（防重放）
        if (params.timestamp && !validateTimestamp(params.timestamp, 300)) {
            return Response.json({ success: false, error: '请求已过期' }, { status: 400 });
        }

        // 获取订单
        const order = await getOrder(anime_db, params.order_no);
        if (!order) {
            return Response.json({ success: false, error: '订单不存在' }, { status: 404 });
        }

        // 检查订单状态
        if (order.status !== 'pending') {
            return Response.json({ success: false, error: `订单状态不正确: ${order.status}` }, { status: 400 });
        }

        // 验证金额
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
                metadata: { paidAmount, orderAmount: order.amount },
                riskLevel: 'high',
            });
            return Response.json({ success: false, error: '金额不匹配' }, { status: 400 });
        }

        // 处理支付结果
        if (params.status === 'success') {
            // 更新订单状态
            const paidAt = Math.floor(Date.now() / 1000);
            await updateOrderStatus(anime_db, params.order_no, 'paid', params.trade_no, paidAt);

            // 根据产品类型处理
            const { product_type, product_id, user_id } = order;

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
                    await addCoins(anime_db, user_id, coinsAmount, 'purchase', order.order_no, `购买积分 ${coinsAmount}`);
                    break;

                case 'shop_item':
                    console.log('Shop item purchase via payment:', product_id);
                    break;

                default:
                    console.warn('Unknown product type:', product_type);
            }

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
                },
            });

            return Response.json({ success: true, message: '支付成功' });
        } else {
            // 支付失败
            await updateOrderStatus(anime_db, params.order_no, 'failed');

            await logAudit(anime_db, {
                userId: order.user_id,
                action: 'payment_failed',
                targetType: 'order',
                targetId: order.order_no,
            });

            return Response.json({ success: true, message: '支付失败已记录' });
        }
    } catch (error) {
        console.error('Payment callback error:', error);
        return Response.json({ success: false, error: '处理失败' }, { status: 500 });
    }
}

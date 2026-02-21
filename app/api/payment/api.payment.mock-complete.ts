/**
 * Mock 支付完成页面
 * 用于测试环境模拟支付成功
 * 需要验证 HMAC 签名以防止伪造请求
 */

import { getOrder, updateOrderStatus } from '~/services/payment/gateway.server';
import { createSubscription } from '~/services/membership/subscription.server';
import { addCoins } from '~/services/membership/coins.server';
import { logAudit } from '~/services/security/audit-log.server';
import { verifyPaymentSignature } from '~/services/payment/signature.server';
import { redirect } from 'react-router';

export async function loader({ request, context }: { request: Request; context: any }) {
    const { anime_db, PAYMENT_SECRET } = context.cloudflare.env;
    const url = new URL(request.url);

    // Extract parameters
    const orderNo = url.searchParams.get('orderNo');
    const nonce = url.searchParams.get('nonce');
    const timestamp = url.searchParams.get('ts');
    const signature = url.searchParams.get('sig');

    // Validate required parameters
    if (!orderNo) {
        return new Response('订单号缺失', { status: 400 });
    }

    // 获取订单
    const order = await getOrder(anime_db, orderNo);
    if (!order) {
        return new Response('订单不存在', { status: 404 });
    }

    // Verify signature (if provided - for backward compatibility)
    if (nonce && timestamp && signature) {
        const verification = await verifyPaymentSignature(
            orderNo,
            order.amount,
            order.user_id,
            nonce,
            parseInt(timestamp),
            signature,
            PAYMENT_SECRET
        );

        if (!verification.valid) {
            await logAudit(anime_db, {
                userId: order.user_id,
                action: 'payment_failed',
                targetType: 'order',
                targetId: orderNo,
                metadata: { error: verification.error, type: 'invalid_signature' },
            });
            return new Response(`安全验证失败: ${verification.error}`, { status: 403 });
        }
    } else {
        // Log unsigned access attempt (for monitoring)
        console.warn(`Unsigned payment completion attempt for order ${orderNo}`);
    }

    if (order.status !== 'pending') {
        // 订单已处理，直接跳转
        return redirect('/shop?status=already_processed');
    }

    // 模拟支付成功
    const paidAt = Math.floor(Date.now() / 1000);
    const tradeNo = `MOCK${Date.now()}`;

    await updateOrderStatus(anime_db, orderNo, 'paid', tradeNo, paidAt);

    // 根据产品类型处理
    const { product_type, product_id, user_id, amount } = order;

    switch (product_type) {
        case 'subscription':
            const [tierId, period] = product_id.split(':');
            await createSubscription(anime_db, {
                userId: user_id,
                tierId: parseInt(tierId),
                period: period as 'monthly' | 'quarterly' | 'yearly',
                orderId: orderNo,
            });
            break;

        case 'coins':
            const coinsAmount = parseInt(product_id);
            await addCoins(anime_db, user_id, coinsAmount, 'purchase', orderNo, `购买积分 ${coinsAmount}`);
            break;
    }

    // 记录审计日志
    await logAudit(anime_db, {
        userId: user_id,
        action: 'payment_success',
        targetType: 'order',
        targetId: orderNo,
        metadata: {
            amount,
            productType: product_type,
            productId: product_id,
            mock: true,
            signatureVerified: !!(nonce && timestamp && signature),
        },
    });

    // 跳转到商店页面
    return redirect('/shop?status=success');
}

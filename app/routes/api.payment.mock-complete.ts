/**
 * Mock 支付完成页面
 * 用于测试环境模拟支付成功
 */

import { getOrder, updateOrderStatus } from '~/services/payment/gateway.server';
import { createSubscription } from '~/services/membership/subscription.server';
import { addCoins } from '~/services/membership/coins.server';
import { logAudit } from '~/services/security/audit-log.server';
import { redirect } from 'react-router';

export async function loader({ request, context }: { request: Request; context: any }) {
    const { anime_db } = context.cloudflare.env;
    const url = new URL(request.url);
    const orderNo = url.searchParams.get('orderNo');

    if (!orderNo) {
        return new Response('订单号缺失', { status: 400 });
    }

    // 获取订单
    const order = await getOrder(anime_db, orderNo);
    if (!order) {
        return new Response('订单不存在', { status: 404 });
    }

    if (order.status !== 'pending') {
        // 订单已处理，直接跳转
        return redirect('/user/membership?status=already_processed');
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
        },
    });

    // 跳转到会员中心
    return redirect('/user/membership?status=success');
}

/**
 * 订阅管理 API
 * 处理订阅相关操作：购买、取消、续费等
 */

import { getSessionToken, verifySession } from '~/services/auth.server';
import { createPaymentOrder } from '~/services/payment/gateway.server';
import {
    getUserSubscription,
    cancelSubscription,
    resumeAutoRenew
} from '~/services/membership/subscription.server';
import { getTierById, getAllTiers } from '~/services/membership/tier.server';
import { logAudit } from '~/services/security/audit-log.server';

export async function loader({ request, context }: { request: Request; context: any }) {
    const { anime_db } = context.cloudflare.env;

    // 获取用户
    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return Response.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    // 获取所有等级和用户当前订阅
    const [tiers, subscription] = await Promise.all([
        getAllTiers(anime_db),
        getUserSubscription(anime_db, user.id),
    ]);

    return Response.json({
        success: true,
        tiers,
        subscription,
    });
}

export async function action({ request, context }: { request: Request; context: any }) {
    const { anime_db, PAYMENT_SECRET } = context.cloudflare.env;

    // 获取用户
    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return Response.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const formData = await request.formData();
    const actionType = formData.get('action') as string;

    switch (actionType) {
        case 'subscribe': {
            // 创建订阅订单
            const tierId = parseInt(formData.get('tierId') as string);
            const period = formData.get('period') as 'monthly' | 'quarterly' | 'yearly';

            // 获取等级信息
            const tier = await getTierById(anime_db, tierId);
            if (!tier) {
                return Response.json({ success: false, error: '等级不存在' }, { status: 400 });
            }

            // 计算价格
            const priceField = `price_${period}` as 'price_monthly' | 'price_quarterly' | 'price_yearly';
            const amount = tier[priceField];
            if (!amount) {
                return Response.json({ success: false, error: '价格信息错误' }, { status: 400 });
            }

            // 创建支付订单
            const clientIp = request.headers.get('CF-Connecting-IP') || undefined;
            const userAgent = request.headers.get('User-Agent') || undefined;

            const orderResult = await createPaymentOrder(anime_db, {
                userId: user.id,
                amount,
                productType: 'subscription',
                productId: `${tierId}:${period}`,
                productName: `${tier.display_name} (${period === 'monthly' ? '月付' : period === 'quarterly' ? '季付' : '年付'})`,
                paymentMethod: 'mock', // 使用 Mock 支付
                clientIp,
                userAgent,
            });

            if (!orderResult.success) {
                return Response.json({ success: false, error: orderResult.error }, { status: 500 });
            }

            // 记录审计
            await logAudit(anime_db, {
                userId: user.id,
                action: 'payment_create',
                targetType: 'order',
                targetId: orderResult.order!.order_no,
                metadata: { tierId, period, amount },
            });

            // Generate secure pay URL with HMAC signature
            const { generateSecurePayUrl } = await import('~/services/payment/signature.server');
            const payUrl = await generateSecurePayUrl(
                '/api/payment/mock-complete',
                orderResult.order!.order_no,
                amount,
                user.id,
                PAYMENT_SECRET
            );

            return Response.json({
                success: true,
                order: orderResult.order,
                payUrl,
            });
        }

        case 'cancel': {
            // 取消自动续费
            const reason = formData.get('reason') as string;
            const result = await cancelSubscription(anime_db, user.id, reason);

            if (result.success) {
                await logAudit(anime_db, {
                    userId: user.id,
                    action: 'subscription_cancel',
                    metadata: { reason },
                });
            }

            return Response.json(result);
        }

        case 'resume': {
            // 恢复自动续费
            const result = await resumeAutoRenew(anime_db, user.id);

            if (result.success) {
                await logAudit(anime_db, {
                    userId: user.id,
                    action: 'subscription_renew',
                });
            }

            return Response.json(result);
        }

        default:
            return Response.json({ success: false, error: '未知操作' }, { status: 400 });
    }
}

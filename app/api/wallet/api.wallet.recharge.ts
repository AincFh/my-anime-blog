/**
 * 钱包充值 API
 * 支持充值虚拟货币（星尘），不支持退款
 */

import { generateSecurePayUrl } from '~/services/payment/signature.server';
import { RECHARGE_PACKAGES } from '~/config/game';

// 获取充值档位和用户余额
export async function loader({ request, context }: { request: Request; context: any }) {
    const { getSessionToken, verifySession } = await import('~/services/auth.server');
    const { getUserCoins } = await import('~/services/membership/coins.server');

    const { anime_db } = context.cloudflare.env;

    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    let balance = 0;
    if (valid && user) {
        balance = await getUserCoins(anime_db, user.id);
    }

    return Response.json({
        success: true,
        packages: RECHARGE_PACKAGES,
        balance,
        isLoggedIn: valid,
    });
}

// 创建充值订单
export async function action({ request, context }: { request: Request; context: any }) {
    const { getSessionToken, verifySession } = await import('~/services/auth.server');
    const { createPaymentOrder } = await import('~/services/payment/gateway.server');
    const { logAudit } = await import('~/services/security/audit-log.server');

    const { anime_db } = context.cloudflare.env;

    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return Response.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const formData = await request.formData();
    const packageId = formData.get('packageId') as string;

    const pkg = RECHARGE_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
        return Response.json({ success: false, error: '无效的充值档位' }, { status: 400 });
    }

    const clientIp = request.headers.get('CF-Connecting-IP') || undefined;
    const userAgent = request.headers.get('User-Agent') || undefined;
    const totalCoins = pkg.coins + pkg.bonus;

    const orderResult = await createPaymentOrder(anime_db, {
        userId: user.id,
        amount: pkg.price,
        productType: 'coins',
        productId: String(totalCoins),
        productName: `星尘充值 ${totalCoins} (含赠送${pkg.bonus})`,
        paymentMethod: 'mock',
        clientIp,
        userAgent,
    });

    if (!orderResult.success) {
        return Response.json({ success: false, error: orderResult.error }, { status: 500 });
    }

    await logAudit(anime_db, {
        userId: user.id,
        action: 'payment_create',
        targetType: 'order',
        targetId: orderResult.order!.order_no,
        metadata: { packageId, coins: totalCoins, price: pkg.price },
    });

    const secretKey = (context.cloudflare.env as any).PAYMENT_SECRET_KEY || 'dev-secret-key';

    // Generate secure pay URL with HMAC signature
    const payUrl = await generateSecurePayUrl(
        '/api/payment/mock-complete',
        orderResult.order!.order_no,
        pkg.price,
        user.id,
        secretKey
    );

    return Response.json({
        success: true,
        order: orderResult.order,
        package: pkg,
        totalCoins,
        payUrl,
    });
}

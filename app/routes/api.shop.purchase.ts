/**
 * 积分商城购买 API
 */

import { getSessionToken, verifySession } from '~/services/auth.server';
import { getUserCoins, spendCoins } from '~/services/membership/coins.server';
import { logAudit } from '~/services/security/audit-log.server';

interface ShopItem {
    id: number;
    name: string;
    description: string;
    type: string;
    price_coins: number;
    stock: number;
    tier_required: string | null;
}

// 购买商品
export async function action({ request, context }: { request: Request; context: any }) {
    const { anime_db } = context.cloudflare.env;

    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return Response.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const formData = await request.formData();
    const itemId = parseInt(formData.get('itemId') as string);

    if (!itemId) {
        return Response.json({ success: false, error: '商品ID无效' }, { status: 400 });
    }

    // 获取商品信息
    const item = await anime_db
        .prepare('SELECT * FROM shop_items WHERE id = ? AND is_active = 1')
        .bind(itemId)
        .first() as ShopItem | null;

    if (!item) {
        return Response.json({ success: false, error: '商品不存在或已下架' }, { status: 404 });
    }

    // 检查库存
    if (item.stock !== -1 && item.stock <= 0) {
        return Response.json({ success: false, error: '商品已售罄' }, { status: 400 });
    }

    // 检查是否已购买（对于不可重复购买的商品）
    const existingPurchase = await anime_db
        .prepare('SELECT * FROM user_purchases WHERE user_id = ? AND item_id = ?')
        .bind(user.id, itemId)
        .first();

    if (existingPurchase && ['avatar_frame', 'badge', 'theme'].includes(item.type)) {
        return Response.json({ success: false, error: '您已拥有该商品' }, { status: 400 });
    }

    // 检查积分余额
    const userCoins = await getUserCoins(anime_db, user.id);
    if (userCoins < item.price_coins) {
        return Response.json({
            success: false,
            error: `积分不足，需要 ${item.price_coins}，当前余额 ${userCoins}`
        }, { status: 400 });
    }

    // 扣除积分
    const spendResult = await spendCoins(
        anime_db,
        user.id,
        item.price_coins,
        'shop',
        String(itemId),
        `购买商品: ${item.name}`
    );

    if (!spendResult.success) {
        return Response.json({ success: false, error: '扣除积分失败' }, { status: 500 });
    }

    // 记录购买
    await anime_db
        .prepare(`
            INSERT INTO user_purchases (user_id, item_id, transaction_id)
            VALUES (?, ?, ?)
        `)
        .bind(user.id, itemId, null)
        .run();

    // 更新库存
    if (item.stock !== -1) {
        await anime_db
            .prepare('UPDATE shop_items SET stock = stock - 1, sold_count = sold_count + 1 WHERE id = ?')
            .bind(itemId)
            .run();
    } else {
        await anime_db
            .prepare('UPDATE shop_items SET sold_count = sold_count + 1 WHERE id = ?')
            .bind(itemId)
            .run();
    }

    // 记录审计日志
    await logAudit(anime_db, {
        userId: user.id,
        action: 'shop_purchase',
        targetType: 'shop_item',
        targetId: String(itemId),
        metadata: { itemName: item.name, price: item.price_coins },
    });

    const newBalance = await getUserCoins(anime_db, user.id);

    return Response.json({
        success: true,
        message: `成功购买 ${item.name}`,
        item: {
            id: item.id,
            name: item.name,
            type: item.type,
        },
        balance: newBalance,
    });
}

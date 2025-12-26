/**
 * 用户已购商品 API
 */

export async function loader({ request, context }: { request: Request; context: any }) {
    const { getSessionToken, verifySession } = await import('~/services/auth.server');

    const { anime_db } = context.cloudflare.env;

    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return Response.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const purchases = await anime_db
        .prepare(`
            SELECT 
                up.id,
                up.item_id,
                up.purchased_at,
                si.name as item_name,
                si.type as item_type,
                si.image_url as item_image
            FROM user_purchases up
            JOIN shop_items si ON up.item_id = si.id
            WHERE up.user_id = ?
            ORDER BY up.purchased_at DESC
        `)
        .bind(user.id)
        .all();

    const items = (purchases.results || []) as any[];

    const grouped = {
        avatar_frame: items.filter(i => i.item_type === 'avatar_frame'),
        theme: items.filter(i => i.item_type === 'theme'),
        emoji: items.filter(i => i.item_type === 'emoji'),
        badge: items.filter(i => i.item_type === 'badge'),
        effect: items.filter(i => i.item_type === 'effect'),
        other: items.filter(i => !['avatar_frame', 'theme', 'emoji', 'badge', 'effect'].includes(i.item_type || '')),
    };

    return Response.json({
        success: true,
        purchases: items,
        grouped,
        count: items.length,
    });
}

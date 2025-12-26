/**
 * 钱包 API - 获取余额和交易记录
 */

function getSourceName(source: string): string {
    const names: Record<string, string> = {
        'daily_signin': '每日签到',
        'daily_login': '登录奖励',
        'purchase': '充值',
        'shop': '商城购买',
        'activity': '活动奖励',
        'referral': '邀请好友',
        'achievement': '成就奖励',
        'admin': '管理员操作',
        'refund': '退款',
    };
    return names[source] || source;
}

function getTypeName(type: string): string {
    const names: Record<string, string> = {
        'earn': '获得',
        'spend': '消费',
        'gift': '赠送',
        'refund': '退还',
        'expire': '过期',
    };
    return names[type] || type;
}

export async function loader({ request, context }: { request: Request; context: any }) {
    const { getSessionToken, verifySession } = await import('~/services/auth.server');
    const { getUserCoins, getCoinTransactionHistory } = await import('~/services/membership/coins.server');

    const { anime_db } = context.cloudflare.env;

    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return Response.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const balance = await getUserCoins(anime_db, user.id);
    const transactions = await getCoinTransactionHistory(anime_db, user.id, limit, offset);

    const formattedTransactions = transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        source: tx.source,
        description: tx.description,
        balanceAfter: tx.balance_after,
        createdAt: tx.created_at,
        sourceName: getSourceName(tx.source),
        typeName: getTypeName(tx.type),
    }));

    return Response.json({
        success: true,
        balance,
        transactions: formattedTransactions,
    });
}

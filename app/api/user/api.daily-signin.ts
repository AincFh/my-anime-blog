/**
 * 每日签到 API
 * 处理用户每日签到领取积分
 */

import { getSessionToken, verifySession } from '~/services/auth.server';
import { addCoins, getUserCoins } from '~/services/membership/coins.server';
import { getUserSubscription } from '~/services/membership/subscription.server';
import { getTierById } from '~/services/membership/tier.server';

interface SignInResult {
    success: boolean;
    coins?: number;
    bonus?: number;
    streak?: number;
    message?: string;
    error?: string;
}

// 获取签到状态
export async function loader({ request, context }: { request: Request; context: any }) {
    const { anime_db } = context.cloudflare.env;

    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return Response.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    // 获取用户今日是否已签到
    const today = new Date().toISOString().split('T')[0];
    const signInRecord = await anime_db
        .prepare(`
            SELECT * FROM coin_transactions 
            WHERE user_id = ? AND source = 'daily_signin' 
            AND date(created_at, 'unixepoch') = ?
        `)
        .bind(user.id, today)
        .first();

    // 获取连续签到天数
    const streakResult = await anime_db
        .prepare(`
            SELECT COUNT(DISTINCT date(created_at, 'unixepoch')) as streak
            FROM coin_transactions 
            WHERE user_id = ? AND source = 'daily_signin'
            AND created_at > unixepoch('now', '-30 days')
        `)
        .bind(user.id)
        .first();

    // 获取用户积分
    const coins = await getUserCoins(anime_db, user.id);

    return Response.json({
        success: true,
        signedIn: !!signInRecord,
        streak: (streakResult as any)?.streak || 0,
        coins,
    });
}

// 执行签到
export async function action({ request, context }: { request: Request; context: any }) {
    const { anime_db } = context.cloudflare.env;

    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return Response.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    // 检查今日是否已签到
    const today = new Date().toISOString().split('T')[0];
    const existingSignIn = await anime_db
        .prepare(`
            SELECT * FROM coin_transactions 
            WHERE user_id = ? AND source = 'daily_signin' 
            AND date(created_at, 'unixepoch') = ?
        `)
        .bind(user.id, today)
        .first();

    if (existingSignIn) {
        return Response.json({
            success: false,
            error: '今日已签到',
            signedIn: true,
        });
    }

    // 获取用户会员等级的签到奖励
    let baseCoins = 5; // 普通用户基础奖励
    const subscription = await getUserSubscription(anime_db, user.id);

    if (subscription && subscription.status === 'active') {
        const tier = await getTierById(anime_db, subscription.tier_id);
        if (tier) {
            try {
                const privileges = JSON.parse(tier.privileges || '{}');
                baseCoins = privileges.dailySignInBonus || baseCoins;
            } catch (e) { }
        }
    }

    // 连续签到奖励
    const yesterdaySignIn = await anime_db
        .prepare(`
            SELECT * FROM coin_transactions 
            WHERE user_id = ? AND source = 'daily_signin'
            AND date(created_at, 'unixepoch') = date('now', '-1 day')
        `)
        .bind(user.id)
        .first();

    let bonus = 0;
    let streak = 1;

    if (yesterdaySignIn) {
        // 获取当前连续签到天数
        const streakResult = await anime_db
            .prepare(`
                SELECT COUNT(*) as count FROM (
                    SELECT DISTINCT date(created_at, 'unixepoch') as sign_date
                    FROM coin_transactions 
                    WHERE user_id = ? AND source = 'daily_signin'
                    ORDER BY sign_date DESC
                    LIMIT 30
                )
            `)
            .bind(user.id)
            .first();

        streak = ((streakResult as any)?.count || 0) + 1;

        // 连续签到奖励：每7天额外奖励
        if (streak % 7 === 0) {
            bonus = Math.floor(baseCoins * 0.5); // 7天奖励50%
        }
    }

    const totalCoins = baseCoins + bonus;

    // 发放积分
    await addCoins(
        anime_db,
        user.id,
        totalCoins,
        'daily_signin',
        `每日签到${bonus > 0 ? ` (连续${streak}天奖励)` : ''}`
    );

    // 更新任务系统进度
    const { updateMissionProgress } = await import('~/services/membership/mission.server');
    await updateMissionProgress(anime_db, user.id, 'signin');

    const newBalance = await getUserCoins(anime_db, user.id);

    const result: SignInResult = {
        success: true,
        coins: totalCoins,
        bonus,
        streak,
        message: bonus > 0
            ? `签到成功！获得 ${totalCoins} 积分 (含连续签到奖励 ${bonus})`
            : `签到成功！获得 ${totalCoins} 积分`,
    };

    return Response.json({ ...result, balance: newBalance });
}

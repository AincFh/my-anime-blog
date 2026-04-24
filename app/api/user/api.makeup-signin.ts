/**
 * 补签 API
 * POST /api/makeup-signin
 * Body: { date: "2026-04-18" }
 */

import type { ActionFunctionArgs } from 'react-router';
import { getSessionToken, verifySession } from '~/services/auth.server';
import { processMakeupSignin, getMissedSigninDays, getMakeupEstimate } from '~/services/membership/makeup-signin.server';
import { getUserSubscription } from '~/services/membership/subscription.server';
import { getTierById } from '~/services/membership/tier.server';

export async function action({ request, context }: ActionFunctionArgs) {
    const { anime_db, CACHE_KV } = context.cloudflare.env as { anime_db: import('~/services/db.server').Database; CACHE_KV: KVNamespace };

    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return Response.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { date } = body;

    if (!date || typeof date !== 'string') {
        return Response.json({ success: false, error: '缺少补签日期' }, { status: 400 });
    }

    // 微秒排它锁
    let unlock = async () => {};
    if (CACHE_KV) {
        const { acquirePaymentLock, releasePaymentLock } = await import('~/services/payment/gateway.server');
        const lockKey = `action_lock:makeup:${user.id}`;
        const acquired = await acquirePaymentLock(CACHE_KV, lockKey, 5);
        if (!acquired) {
            return Response.json({ success: false, error: '操作太频繁，请稍后重试' }, { status: 429 });
        }
        unlock = async () => { await releasePaymentLock(CACHE_KV, lockKey); };
    }

    try {
        // 获取用户基础签到奖励
        let baseReward = 5;
        const subscription = await getUserSubscription(anime_db, user.id);
        if (subscription && subscription.status === 'active') {
            const tier = await getTierById(anime_db, subscription.tier_id);
            if (tier) {
                try {
                    const privileges = JSON.parse(tier.privileges || '{}');
                    baseReward = privileges.dailySignInBonus || baseReward;
                } catch {
                    // ignore
                }
            }
        }

        const result = await processMakeupSignin(anime_db, user.id, date, baseReward);

        if (!result.success) {
            return Response.json({ success: false, error: result.error }, { status: 400 });
        }

        // 更新任务进度
        try {
            const { updateMissionProgress } = await import('~/services/membership/mission.server');
            await updateMissionProgress(anime_db, user.id, 'signin');
        } catch {
            // 任务更新失败不影响补签结果
        }

        // 触发补签成就
        try {
            const { triggerAchievement } = await import('~/components/ui/system/AchievementSystem');
            triggerAchievement('makeup_signin');
        } catch {
            // ignore
        }

        return Response.json({
            success: true,
            cost: result.cost,
            consecutiveMakeupCount: result.consecutiveMakeupCount,
            rewardCoins: result.rewardCoins,
            newBalance: result.newBalance,
            message: `补签成功！消耗 ${result.cost} 星尘，获得 ${result.rewardCoins} 星尘奖励`,
        });
    } finally {
        await unlock();
    }
}

/**
 * GET /api/makeup-signin?date=2026-04-18
 * 获取补签预估费用
 */
export async function loader({ request, context }: { request: Request; context: any }) {
    const { anime_db } = context.cloudflare.env as { anime_db: import('~/services/db.server').Database };

    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return Response.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    if (date) {
        // 查询单个日期的预估
        const estimate = await getMakeupEstimate(anime_db, user.id, date);
        return Response.json({ success: true, ...estimate });
    }

    // 查询可补签状态
    const status = await getMissedSigninDays(anime_db, user.id);
    return Response.json({ success: true, ...status });
}

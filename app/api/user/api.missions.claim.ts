import { getSessionToken, verifySession } from '~/services/auth.server';
import { claimMissionReward } from '~/services/membership/mission.server';

export async function action({ request, context }: { request: Request; context: any }) {
    const { anime_db } = context.cloudflare.env;
    const formData = await request.formData();
    const missionId = formData.get("missionId") as string;

    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return Response.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    if (!missionId) {
        return Response.json({ success: false, error: '缺少使命ID' }, { status: 400 });
    }

    const result = await claimMissionReward(anime_db, user.id, missionId);

    if (result.success) {
        return Response.json({
            success: true,
            message: `领取成功！获得 ${result.coins || 0} 金币, ${result.exp || 0} 经验`,
            coins: result.coins,
            exp: result.exp
        });
    }

    return Response.json({ success: false, error: result.error || '领取失败' });
}

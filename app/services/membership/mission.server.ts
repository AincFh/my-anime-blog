import { execute, queryFirst, type Database } from '../db.server';
import { addCoins } from './coins.server';

export interface Mission {
    id: string;
    name: string;
    description: string;
    reward_coins: number;
    reward_exp: number;
    type: 'daily' | 'weekly' | 'monthly';
    target_action: string;
    target_count: number;
}

export interface UserMission {
    user_id: number;
    mission_id: string;
    current_count: number;
    status: 'in_progress' | 'completed' | 'claimed';
    last_updated_at: number;
    reset_at: number;
}

/**
 * 获取重置时间
 */
function getResetTime(type: 'daily' | 'weekly' | 'monthly'): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (type === 'daily') {
        now.setDate(now.getDate() + 1);
    } else if (type === 'weekly') {
        const day = now.getDay() || 7; // Sunday is 0, make it 7
        now.setDate(now.getDate() + (8 - day));
    } else {
        now.setMonth(now.getMonth() + 1);
        now.setDate(1);
    }
    return Math.floor(now.getTime() / 1000);
}

/**
 * 获取用户当前的全部任务状态
 */
export async function getUserMissions(db: Database, userId: number): Promise<any[]> {
    const now = Math.floor(Date.now() / 1000);

    // 1. 获取所有激活的任务定义
    const missions = await db.prepare('SELECT * FROM missions WHERE is_active = 1 ORDER BY sort_order').all<Mission>();
    const missionDefs = missions.results;

    const results = [];
    for (const mission of missionDefs) {
        // 2. 检查用户进度
        let userMission = await queryFirst<UserMission>(
            db,
            'SELECT * FROM user_missions WHERE user_id = ? AND mission_id = ?',
            userId,
            mission.id
        );

        // 3. 如果进度已过期，则重置
        if (userMission && userMission.reset_at <= now) {
            await execute(
                db,
                'UPDATE user_missions SET current_count = 0, status = "in_progress", reset_at = ?, last_updated_at = ? WHERE user_id = ? AND mission_id = ?',
                getResetTime(mission.type as any),
                now,
                userId,
                mission.id
            );
            userMission.current_count = 0;
            userMission.status = 'in_progress';
        }

        // 4. 如果没有进度，初始化一个
        if (!userMission) {
            const resetAt = getResetTime(mission.type as any);
            await execute(
                db,
                'INSERT INTO user_missions (user_id, mission_id, current_count, status, reset_at, last_updated_at) VALUES (?, ?, 0, "in_progress", ?, ?)',
                userId,
                mission.id,
                resetAt,
                now
            );
            userMission = {
                user_id: userId,
                mission_id: mission.id,
                current_count: 0,
                status: 'in_progress',
                reset_at: resetAt,
                last_updated_at: now
            };
        }

        results.push({
            ...mission,
            progress: userMission.current_count,
            status: userMission.status
        });
    }

    return results;
}

/**
 * 更新任务进度
 */
export async function updateMissionProgress(
    db: any,
    userId: number,
    action: string,
    amount: number = 1
): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    // 找出匹配此 action 的所有任务
    const missions = await db.prepare('SELECT * FROM missions WHERE target_action = ? AND is_active = 1').bind(action).all();
    const targetMissions = missions.results as Mission[];

    for (const mission of targetMissions) {
        // 获取或初始化用户进度
        let userMission = await queryFirst<UserMission>(
            db,
            'SELECT * FROM user_missions WHERE user_id = ? AND mission_id = ?',
            userId,
            mission.id
        );

        // 重置逻辑 (同上)
        if (userMission && userMission.reset_at <= now) {
            await execute(
                db,
                'UPDATE user_missions SET current_count = 0, status = "in_progress", reset_at = ? WHERE user_id = ? AND mission_id = ?',
                getResetTime(mission.type),
                userId,
                mission.id
            );
            userMission.current_count = 0;
            userMission.status = 'in_progress';
        }

        if (!userMission) {
            const resetAt = getResetTime(mission.type as any);
            await execute(
                db,
                'INSERT INTO user_missions (user_id, mission_id, current_count, status, reset_at) VALUES (?, ?, 0, "in_progress", ?)',
                userId,
                mission.id,
                resetAt
            );
            userMission = {
                user_id: userId,
                mission_id: mission.id,
                current_count: 0,
                status: 'in_progress',
                reset_at: resetAt,
                last_updated_at: now
            };
        }

        // 只有进行中的任务更新进度
        if (userMission.status === 'in_progress') {
            const newCount = userMission.current_count + amount;
            const newStatus = newCount >= mission.target_count ? 'completed' : 'in_progress';

            await execute(
                db,
                'UPDATE user_missions SET current_count = ?, status = ?, last_updated_at = ? WHERE user_id = ? AND mission_id = ?',
                newCount,
                newStatus,
                now,
                userId,
                mission.id
            );
        }
    }
}

/**
 * 领取任务奖励
 */
export async function claimMissionReward(
    db: Database,
    userId: number,
    missionId: string
): Promise<{ success: boolean; coins?: number; exp?: number; error?: string }> {
    const mission = await queryFirst<Mission>(db, 'SELECT * FROM missions WHERE id = ?', missionId);
    if (!mission) return { success: false, error: '任务不存在' };

    const userMission = await queryFirst<UserMission>(
        db,
        'SELECT * FROM user_missions WHERE user_id = ? AND mission_id = ?',
        userId,
        missionId
    );

    if (!userMission || userMission.status !== 'completed') {
        return { success: false, error: '任务未完成或已领取' };
    }

    // 0. 乐观原子锁 (P0 级别防并发超刷修复)
    // 利用 D1 事务原子性，将 UPDATE 提前，谁先把 completed 变成了 claimed，谁才具备发钱资格。若慢了一步被其他并发抢先则 changes 会变成 0
    const now = Math.floor(Date.now() / 1000);
    const updateResult = await db.prepare(
        'UPDATE user_missions SET status = "claimed", last_updated_at = ? WHERE user_id = ? AND mission_id = ? AND status = "completed"'
    ).bind(now, userId, missionId).run();

    if (!updateResult.meta.changes || updateResult.meta.changes === 0) {
        return { success: false, error: '领取失败，任务已在其他终端被受理，请勿重复刷取' };
    }

    // 1. 发放金币
    if (mission.reward_coins > 0) {
        await addCoins(db, userId, mission.reward_coins, 'activity', `任务奖励: ${mission.name}`);
    }

    // 2. 发放经验
    if (mission.reward_exp > 0) {
        await execute(db, 'UPDATE users SET exp = exp + ? WHERE id = ?', mission.reward_exp, userId);
        // 这里可以扩展等级检查逻辑
    }

    // (由于在首部已通过乐观锁先行完成状态的安全挂接，此处的收尾更新已被废弃，防止二次覆盖)
    return {
        success: true,
        coins: mission.reward_coins,
        exp: mission.reward_exp
    };
}

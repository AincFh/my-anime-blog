/**
 * 任务数据访问层
 * 封装 missions 和 user_missions 表的所有数据库操作
 */

import { queryFirst, execute, queryAll, type Database } from '~/services/db.server';

export interface MissionRow {
    id: string;
    name: string;
    description: string;
    reward_coins: number;
    reward_exp: number;
    type: 'daily' | 'weekly' | 'monthly' | 'achievement';
    target_action: string;
    target_count: number;
    is_active: number;
    sort_order: number;
    created_at: number;
}

export interface UserMissionRow {
    user_id: number;
    mission_id: string;
    current_count: number;
    status: 'in_progress' | 'completed' | 'claimed';
    last_updated_at: number;
    reset_at: number;
}

export interface UserMissionWithMission extends UserMissionRow {
    mission_name: string;
    mission_description: string;
    reward_coins: number;
    reward_exp: number;
    mission_type: string;
    target_action: string;
    target_count: number;
}

export const missionRepository = {
    async findAllActive(db: Database): Promise<MissionRow[]> {
        return queryAll<MissionRow>(
            db,
            'SELECT * FROM missions WHERE is_active = 1 ORDER BY sort_order'
        );
    },

    async findById(db: Database, id: string): Promise<MissionRow | null> {
        return queryFirst<MissionRow>(
            db,
            'SELECT * FROM missions WHERE id = ?',
            id
        );
    },

    async findUserMission(
        db: Database,
        userId: number,
        missionId: string
    ): Promise<UserMissionRow | null> {
        return queryFirst<UserMissionRow>(
            db,
            'SELECT * FROM user_missions WHERE user_id = ? AND mission_id = ?',
            userId,
            missionId
        );
    },

    async findUserMissionsBatch(
        db: Database,
        userId: number,
        missionIds: string[]
    ): Promise<UserMissionRow[]> {
        if (missionIds.length === 0) return [];

        const placeholders = missionIds.map(() => '?').join(',');
        return queryAll<UserMissionRow>(
            db,
            `SELECT * FROM user_missions WHERE user_id = ? AND mission_id IN (${placeholders})`,
            userId,
            ...missionIds
        );
    },

    async upsertUserMission(
        db: Database,
        userId: number,
        missionId: string,
        data: Partial<UserMissionRow>
    ): Promise<void> {
        const existing = await this.findUserMission(db, userId, missionId);
        if (existing) {
            const fields: string[] = [];
            const values: unknown[] = [];

            if (data.current_count !== undefined) {
                fields.push('current_count = ?');
                values.push(data.current_count);
            }
            if (data.status !== undefined) {
                fields.push('status = ?');
                values.push(data.status);
            }
            if (data.last_updated_at !== undefined) {
                fields.push('last_updated_at = ?');
                values.push(data.last_updated_at);
            }
            if (data.reset_at !== undefined) {
                fields.push('reset_at = ?');
                values.push(data.reset_at);
            }

            if (fields.length === 0) return;

            values.push(userId, missionId);
            await execute(
                db,
                `UPDATE user_missions SET ${fields.join(', ')} WHERE user_id = ? AND mission_id = ?`,
                ...values
            );
        } else {
            await execute(
                db,
                `INSERT INTO user_missions (user_id, mission_id, current_count, status, last_updated_at, reset_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                userId,
                missionId,
                data.current_count ?? 0,
                data.status ?? 'in_progress',
                data.last_updated_at ?? Math.floor(Date.now() / 1000),
                data.reset_at ?? Math.floor(Date.now() / 1000)
            );
        }
    },

    async claimMission(
        db: Database,
        userId: number,
        missionId: string
    ): Promise<boolean> {
        const result = await db.prepare(
            `UPDATE user_missions SET status = 'claimed' WHERE user_id = ? AND mission_id = ? AND status = 'completed'`
        ).bind(userId, missionId).run();

        return Boolean(result.meta.changes);
    },

    async deleteExpiredUserMissions(db: Database, cutoffTimestamp: number): Promise<number> {
        const result = await db.prepare(
            'DELETE FROM user_missions WHERE reset_at < ?'
        ).bind(cutoffTimestamp).run();

        return result.meta.changes || 0;
    },
};

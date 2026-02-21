import { type Database, queryFirst, execute } from '~/services/db.server';
import type { IRepository } from './index';
import type { Session } from '~/services/auth.server';

export class SessionRepository implements IRepository<Session> {
    constructor(private db: Database) { }

    async findById(token: string): Promise<Session | null> {
        return queryFirst<Session>(
            this.db,
            'SELECT token, user_id, expires_at, user_agent FROM sessions WHERE token = ?',
            token
        );
    }

    async findValidSession(token: string): Promise<Session | null> {
        return queryFirst<Session>(
            this.db,
            'SELECT token, user_id, expires_at, user_agent FROM sessions WHERE token = ? AND expires_at > ?',
            token,
            Math.floor(Date.now() / 1000)
        );
    }

    async create(data: Session): Promise<Session> {
        await execute(
            this.db,
            'INSERT INTO sessions (token, user_id, expires_at, user_agent) VALUES (?, ?, ?, ?)',
            data.token,
            data.user_id,
            data.expires_at,
            data.user_agent
        );
        return data;
    }

    async update(token: string, data: Partial<Session>): Promise<Session | null> {
        // Session 通常不更新，主要是创建和删除
        return this.findById(token);
    }

    async delete(token: string): Promise<boolean> {
        const result = await execute(this.db, 'DELETE FROM sessions WHERE token = ?', token);
        return result.success;
    }

    async deleteByUserId(userId: number): Promise<boolean> {
        const result = await execute(this.db, 'DELETE FROM sessions WHERE user_id = ?', userId);
        return result.success;
    }
}

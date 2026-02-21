import type { User } from '~/services/auth.server';
import { type Database, queryFirst, execute, queryAll } from '~/services/db.server';
import type { IRepository } from './index';

// 定义创建用户所需的数据类型
export type CreateUserDTO = Partial<User> & {
    email: string;
    password_hash: string;
};

export class UserRepository implements IRepository<User, CreateUserDTO> {
    constructor(private db: Database) { }

    async findById(id: number): Promise<User | null> {
        return queryFirst<User>(
            this.db,
            'SELECT id, email, username, avatar_url, role, level, exp, coins, preferences, achievements FROM users WHERE id = ?',
            id
        );
    }

    async findByEmail(email: string): Promise<User | null> {
        return queryFirst<User>(
            this.db,
            'SELECT id, email, username, avatar_url, role, level, exp, coins, preferences, achievements FROM users WHERE email = ?',
            email
        );
    }

    async findByEmailWithPassword(email: string): Promise<(User & { password_hash: string }) | null> {
        return queryFirst<User & { password_hash: string }>(
            this.db,
            'SELECT id, email, password_hash, username, avatar_url, role, level, exp, coins, preferences, achievements FROM users WHERE email = ?',
            email
        );
    }

    async create(data: CreateUserDTO): Promise<User> {
        const result = await execute(
            this.db,
            'INSERT INTO users (email, password_hash, username, role) VALUES (?, ?, ?, ?)',
            data.email,
            data.password_hash,
            data.username || '旅行者',
            data.role || 'user'
        );

        if (!result.success) {
            throw new Error('User creation failed');
        }

        const newUser = await this.findById(result.meta.last_row_id);
        if (!newUser) {
            throw new Error('User created but not found');
        }

        return newUser;
    }

    async update(id: number, data: Partial<User>): Promise<User | null> {
        const fields: string[] = [];
        const values: any[] = [];

        if (data.username !== undefined) {
            fields.push('username = ?');
            values.push(data.username);
        }
        if (data.avatar_url !== undefined) {
            fields.push('avatar_url = ?');
            values.push(data.avatar_url);
        }
        if (data.preferences !== undefined) {
            fields.push('preferences = ?');
            values.push(typeof data.preferences === 'string' ? data.preferences : JSON.stringify(data.preferences));
        }
        if (data.coins !== undefined) {
            fields.push('coins = ?');
            values.push(data.coins);
        }
        if (data.exp !== undefined) {
            fields.push('exp = ?');
            values.push(data.exp);
        }
        if (data.level !== undefined) {
            fields.push('level = ?');
            values.push(data.level);
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        values.push(id);

        await execute(
            this.db,
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            ...values
        );

        return this.findById(id);
    }

    async updatePassword(id: number, passwordHash: string): Promise<boolean> {
        const result = await execute(
            this.db,
            'UPDATE users SET password_hash = ? WHERE id = ?',
            passwordHash,
            id
        );
        return result.success;
    }

    async getPasswordHash(id: number): Promise<string | null> {
        const result = await queryFirst<{ password_hash: string }>(
            this.db,
            'SELECT password_hash FROM users WHERE id = ?',
            id
        );
        return result ? result.password_hash : null;
    }

    async delete(id: number): Promise<boolean> {
        const result = await execute(this.db, 'DELETE FROM users WHERE id = ?', id);
        return result.success;
    }
}

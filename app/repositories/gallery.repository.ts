/**
 * 图库数据访问层
 * 封装 gallery 表的所有数据库操作
 */

import { queryFirst, execute, queryAll, type Database } from '~/services/db.server';

export interface GalleryRow {
    id: number;
    url: string;
    title: string | null;
    note: string | null;
    category: string | null;
    created_at: number;
}

export interface CreateGalleryItemDTO {
    url: string;
    title?: string | null;
    note?: string | null;
    category?: string | null;
}

export interface UpdateGalleryItemDTO {
    title?: string | null;
    note?: string | null;
    category?: string | null;
}

export const galleryRepository = {
    async findById(db: Database, id: number): Promise<GalleryRow | null> {
        return queryFirst<GalleryRow>(
            db,
            'SELECT * FROM gallery WHERE id = ?',
            id
        );
    },

    async findAll(
        db: Database,
        limit: number = 100,
        offset: number = 0
    ): Promise<GalleryRow[]> {
        return queryAll<GalleryRow>(
            db,
            'SELECT * FROM gallery ORDER BY created_at DESC LIMIT ? OFFSET ?',
            limit,
            offset
        );
    },

    async findByCategory(
        db: Database,
        category: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<GalleryRow[]> {
        return queryAll<GalleryRow>(
            db,
            'SELECT * FROM gallery WHERE category = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            category,
            limit,
            offset
        );
    },

    async getCategories(db: Database): Promise<string[]> {
        const results = await queryAll<{ category: string }>(
            db,
            'SELECT DISTINCT category FROM gallery WHERE category IS NOT NULL ORDER BY category'
        );
        return results.map(r => r.category).filter(Boolean) as string[];
    },

    async getCount(db: Database): Promise<number> {
        const result = await queryFirst<{ count: number }>(
            db,
            'SELECT COUNT(*) as count FROM gallery'
        );
        return result?.count || 0;
    },

    async create(db: Database, dto: CreateGalleryItemDTO): Promise<number> {
        const result = await execute(
            db,
            'INSERT INTO gallery (url, title, note, category) VALUES (?, ?, ?, ?)',
            dto.url,
            dto.title || null,
            dto.note || null,
            dto.category || null
        );
        return result.meta.last_row_id || 0;
    },

    async update(db: Database, id: number, dto: UpdateGalleryItemDTO): Promise<boolean> {
        const fields: string[] = [];
        const values: (string | null)[] = [];

        if (dto.title !== undefined) {
            fields.push('title = ?');
            values.push(dto.title);
        }
        if (dto.note !== undefined) {
            fields.push('note = ?');
            values.push(dto.note);
        }
        if (dto.category !== undefined) {
            fields.push('category = ?');
            values.push(dto.category);
        }

        if (fields.length === 0) return false;

        values.push(String(id));
        const result = await execute(
            db,
            `UPDATE gallery SET ${fields.join(', ')} WHERE id = ?`,
            ...values
        );
        return result.success;
    },

    async delete(db: Database, id: number): Promise<boolean> {
        const result = await execute(
            db,
            'DELETE FROM gallery WHERE id = ?',
            id
        );
        return result.success;
    },
};

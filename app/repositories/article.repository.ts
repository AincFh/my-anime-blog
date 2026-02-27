import { type Database, queryFirst, execute, queryAll } from '~/services/db.server';
import type { IRepository } from './index';

export interface Article {
    id: number;
    slug: string;
    title: string;
    content: string;
    summary: string | null;
    category: string;
    cover_image: string | null;
    tags: string | null;
    mood_color: string | null;
    status: 'published' | 'draft' | 'hidden';
    allow_comment: number;
    views: number;
    likes: number;
    created_at: number;
    updated_at: number;
}

export type CreateArticleDTO = Omit<Article, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes'>;

export class ArticleRepository implements IRepository<Article, CreateArticleDTO> {
    constructor(private db: Database) { }

    async findById(id: number): Promise<Article | null> {
        return queryFirst<Article>(
            this.db,
            'SELECT * FROM articles WHERE id = ?',
            id
        );
    }

    async findBySlug(slug: string): Promise<Article | null> {
        return queryFirst<Article>(
            this.db,
            "SELECT * FROM articles WHERE slug = ? AND (status = 'published' OR status IS NULL)",
            slug
        );
    }

    async findAllPublished(): Promise<Article[]> {
        return queryAll<Article>(
            this.db,
            `SELECT id, slug, title, content, summary, category, cover_image, tags, views, likes, created_at, status 
             FROM articles 
             WHERE status = 'published' OR status IS NULL
             ORDER BY created_at DESC`
        );
    }

    async findRelated(category: string, excludeId: number, limit: number = 3): Promise<Article[]> {
        return queryAll<Article>(
            this.db,
            `SELECT id, slug, title, cover_image, category, created_at
             FROM articles 
             WHERE category = ? AND id != ? AND (status = 'published' OR status IS NULL)
             ORDER BY created_at DESC
             LIMIT ?`,
            category,
            excludeId,
            limit
        );
    }

    async create(data: CreateArticleDTO): Promise<Article> {
        const result = await execute(
            this.db,
            `INSERT INTO articles (
                slug, title, content, summary, category, cover_image, tags, mood_color, status, allow_comment
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            data.slug,
            data.title,
            data.content,
            data.summary,
            data.category,
            data.cover_image,
            data.tags,
            data.mood_color,
            data.status || 'draft',
            data.allow_comment ?? 1
        );

        if (!result.success) {
            throw new Error('Article creation failed');
        }

        const newArticle = await this.findById(result.meta.last_row_id);
        if (!newArticle) {
            throw new Error('Article created but not found');
        }
        return newArticle;
    }

    async update(id: number, data: Partial<Article>): Promise<Article | null> {
        const fields: string[] = [];
        const values: (string | number | null)[] = [];

        const allowedFields: (keyof Article)[] = [
            'slug', 'title', 'content', 'summary', 'category',
            'cover_image', 'tags', 'mood_color', 'status',
            'allow_comment', 'views', 'likes'
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(data[field] as any);
            }
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        values.push(id);

        const result = await execute(
            this.db,
            `UPDATE articles SET ${fields.join(', ')} WHERE id = ?`,
            ...values
        );

        if (!result.success) {
            throw new Error('Article update failed');
        }

        return this.findById(id);
    }

    async incrementViews(id: number): Promise<void> {
        await execute(
            this.db,
            'UPDATE articles SET views = views + 1 WHERE id = ?',
            id
        );
    }

    async delete(id: number): Promise<boolean> {
        const result = await execute(this.db, 'DELETE FROM articles WHERE id = ?', id);
        return result.success;
    }
}

---
name: service-repository
description: 生成 Service 层和 Repository 层代码模板。用于创建文章服务、用户服务、会员服务等业务逻辑层和数据访问层。
---

# Service 层和 Repository 层生成

## 目录结构

```
app/
├── services/                   # Service 层
│   ├── article/
│   │   ├── index.ts           # 导出
│   │   ├── create.server.ts    # 创建文章
│   │   ├── read.server.ts      # 读取文章
│   │   └── update.server.ts    # 更新文章
│   └── user/
│       └── index.ts
├── repositories/               # Repository 层
│   ├── article.repository.ts
│   ├── user.repository.ts
│   └── base.repository.ts
```

## Repository 层模板

### 基础 Repository

```typescript
// app/repositories/base.repository.ts

export interface RepositoryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
}

export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  protected abstract tableName: string;
  protected abstract primaryKey: string;
  
  constructor(protected db: D1Database) {}
  
  abstract mapRowToEntity(row: Record<string, unknown>): T;
  
  async findById(id: number): Promise<T | null> {
    const stmt = this.db
      .prepare(`SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`)
      .bind(id);
    
    const result = await stmt.first();
    return result ? this.mapRowToEntity(result) : null;
  }
  
  async findAll(options?: RepositoryOptions): Promise<T[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    
    if (options?.orderBy) {
      const dir = options.orderDir ?? 'ASC';
      query += ` ORDER BY ${options.orderBy} ${dir}`;
    }
    
    if (options?.limit) {
      query += ` LIMIT ${options.limit}`;
    }
    
    if (options?.offset) {
      query += ` OFFSET ${options.offset}`;
    }
    
    const result = await this.db.prepare(query).all();
    return result.results.map(row => this.mapRowToEntity(row as Record<string, unknown>));
  }
  
  async count(where?: string, params?: unknown[]): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    
    if (where) {
      query += ` WHERE ${where}`;
    }
    
    const stmt = this.db.prepare(query);
    const result = params ? stmt.bind(...params).first() : stmt.first();
    
    return result?.count as number ?? 0;
  }
  
  async create(input: CreateInput): Promise<number> {
    const keys = Object.keys(input as Record<string, unknown>);
    const values = Object.values(input as Record<string, unknown>);
    const placeholders = keys.map(() => '?').join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders})
    `;
    
    const result = await this.db.prepare(query).bind(...values).run();
    return result.meta.last_row_id as number;
  }
  
  async update(id: number, input: UpdateInput): Promise<boolean> {
    const entries = Object.entries(input as Record<string, unknown>);
    const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
    const values = [...entries.map(([, value]) => value), id];
    
    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = datetime('now')
      WHERE ${this.primaryKey} = ?
    `;
    
    const result = await this.db.prepare(query).bind(...values).run();
    return result.success;
  }
  
  async delete(id: number): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    const result = await this.db.prepare(query).bind(id).run();
    return result.success;
  }
}
```

### Article Repository

```typescript
// app/repositories/article.repository.ts

import { BaseRepository, RepositoryOptions } from './base.repository';
import type { Article, CreateArticleInput, UpdateArticleInput } from '~/types/article';

export interface ArticleRow {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  status: 'draft' | 'published' | 'archived';
  author_id: number;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ListArticlesOptions extends RepositoryOptions {
  status?: 'draft' | 'published' | 'archived';
  authorId?: number;
  categoryId?: number;
  search?: string;
}

export class ArticleRepository extends BaseRepository<Article, CreateArticleInput, UpdateArticleInput> {
  protected tableName = 'articles';
  protected primaryKey = 'id';
  
  mapRowToEntity(row: Record<string, unknown>): Article {
    const r = row as ArticleRow;
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      content: r.content,
      excerpt: r.excerpt ?? undefined,
      coverImage: r.cover_image ?? undefined,
      status: r.status,
      authorId: r.author_id,
      viewCount: r.view_count,
      likeCount: r.like_count,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      deletedAt: r.deleted_at ?? undefined,
    };
  }
  
  async findBySlug(slug: string): Promise<Article | null> {
    const stmt = this.db
      .prepare('SELECT * FROM articles WHERE slug = ? AND deleted_at IS NULL')
      .bind(slug);
    
    const result = await stmt.first();
    return result ? this.mapRowToEntity(result) : null;
  }
  
  async list(options: ListArticlesOptions = {}): Promise<{ articles: Article[]; total: number }> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const params: unknown[] = [];
    
    if (options.status) {
      conditions.push('status = ?');
      params.push(options.status);
    }
    
    if (options.authorId) {
      conditions.push('author_id = ?');
      params.push(options.authorId);
    }
    
    if (options.search) {
      conditions.push('(title LIKE ? OR content LIKE ?)');
      params.push(`%${options.search}%`, `%${options.search}%`);
    }
    
    const where = conditions.join(' AND ');
    
    // 获取总数
    const total = await this.count(where, params);
    
    // 获取列表
    let query = `SELECT * FROM articles WHERE ${where}`;
    
    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy} ${options.orderDir ?? 'DESC'}`;
    } else {
      query += ' ORDER BY created_at DESC';
    }
    
    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
    }
    
    if (options.offset) {
      query += ` OFFSET ${options.offset}`;
    }
    
    const stmt = this.db.prepare(query);
    const result = params.length > 0 ? stmt.bind(...params).all() : stmt.all();
    
    return {
      articles: result.results.map(row => this.mapRowToEntity(row as Record<string, unknown>)),
      total,
    };
  }
  
  async incrementViewCount(id: number): Promise<void> {
    await this.db
      .prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = ?')
      .bind(id)
      .run();
  }
  
  async incrementLikeCount(id: number): Promise<void> {
    await this.db
      .prepare('UPDATE articles SET like_count = like_count + 1 WHERE id = ?')
      .bind(id)
      .run();
  }
}

// 导出单例
export const articleRepository = new ArticleRepository(null as unknown as D1Database);
```

## Service 层模板

### Article Service

```typescript
// app/services/article/index.ts

import { articleRepository } from '~/repositories/article.repository';
import type { Article, CreateArticleInput, UpdateArticleInput, ArticleWithAuthor } from '~/types/article';
import { generateSlug } from '~/utils/slug';
import { NotFoundError, ForbiddenError, ValidationError } from '~/utils/errors';

export interface ListArticlesParams {
  page?: number;
  pageSize?: number;
  status?: 'draft' | 'published' | 'archived';
  authorId?: number;
  search?: string;
}

export interface ArticleService {
  getById(env: Env, id: number): Promise<Article>;
  getBySlug(env: Env, slug: string): Promise<Article>;
  list(env: Env, params: ListArticlesParams): Promise<{ articles: Article[]; total: number; page: number; pageSize: number }>;
  create(env: Env, input: CreateArticleInput, authorId: number): Promise<Article>;
  update(env: Env, id: number, input: UpdateArticleInput, userId: number): Promise<Article>;
  delete(env: Env, id: number, userId: number): Promise<void>;
  like(env: Env, id: number): Promise<void>;
}

export const articleService: ArticleService = {
  async getById(env: Env, id: number): Promise<Article> {
    const article = await articleRepository.findById(id);
    
    if (!article || article.deletedAt) {
      throw new NotFoundError('文章', id);
    }
    
    return article;
  },
  
  async getBySlug(env: Env, slug: string): Promise<Article> {
    const article = await articleRepository.findBySlug(slug);
    
    if (!article || article.deletedAt) {
      throw new NotFoundError('文章', slug);
    }
    
    // 增加浏览量
    await articleRepository.incrementViewCount(article.id);
    
    return article;
  },
  
  async list(env: Env, params: ListArticlesParams): Promise<{ articles: Article[]; total: number; page: number; pageSize: number }> {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const offset = (page - 1) * pageSize;
    
    const result = await articleRepository.list({
      ...params,
      limit: pageSize,
      offset,
    });
    
    return {
      ...result,
      page,
      pageSize,
    };
  },
  
  async create(env: Env, input: CreateArticleInput, authorId: number): Promise<Article> {
    // 验证输入
    if (!input.title || input.title.trim().length === 0) {
      throw new ValidationError('标题不能为空');
    }
    
    if (!input.content || input.content.trim().length === 0) {
      throw new ValidationError('内容不能为空');
    }
    
    // 生成 slug
    const baseSlug = generateSlug(input.title);
    let slug = baseSlug;
    let counter = 1;
    
    // 确保 slug 唯一
    while (await articleRepository.findBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    // 创建文章
    const createInput: CreateArticleInput = {
      title: input.title.trim(),
      slug,
      content: input.content,
      excerpt: input.excerpt?.trim(),
      coverImage: input.coverImage,
      status: input.status ?? 'draft',
      authorId,
    };
    
    const id = await articleRepository.create(createInput);
    
    return {
      id,
      ...createInput,
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
  
  async update(env: Env, id: number, input: UpdateArticleInput, userId: number): Promise<Article> {
    // 检查文章是否存在
    const existing = await articleRepository.findById(id);
    
    if (!existing || existing.deletedAt) {
      throw new NotFoundError('文章', id);
    }
    
    // 检查权限（只有作者可以编辑）
    if (existing.authorId !== userId) {
      throw new ForbiddenError('无权限编辑此文章');
    }
    
    // 如果更新了标题，重新生成 slug
    let slug = existing.slug;
    if (input.title && input.title !== existing.title) {
      slug = generateSlug(input.title);
    }
    
    // 更新文章
    await articleRepository.update(id, {
      ...input,
      slug,
    });
    
    return this.getById(env, id);
  },
  
  async delete(env: Env, id: number, userId: number): Promise<void> {
    const existing = await articleRepository.findById(id);
    
    if (!existing || existing.deletedAt) {
      throw new NotFoundError('文章', id);
    }
    
    // 检查权限
    if (existing.authorId !== userId) {
      throw new ForbiddenError('无权限删除此文章');
    }
    
    // 软删除
    await articleRepository.update(id, {
      deletedAt: new Date().toISOString(),
    } as unknown as UpdateArticleInput);
  },
  
  async like(env: Env, id: number): Promise<void> {
    const article = await articleRepository.findById(id);
    
    if (!article || article.deletedAt) {
      throw new NotFoundError('文章', id);
    }
    
    await articleRepository.incrementLikeCount(id);
  },
};
```

## 依赖注入模式

### 环境类型定义

```typescript
// app/types/env.ts

import type { ArticleRepository } from '~/repositories/article.repository';

interface Env {
  // 数据库
  DB: D1Database;
  
  // KV 存储
  SESSIONS: KVNamespace;
  CACHE: KVNamespace;
  
  // R2 存储
  ASSETS: R2Bucket;
  
  // 密钥
  JWT_SECRET: string;
  API_KEY: string;
}

// 在 Service 中使用
export async function getArticleService(env: Env): Promise<ArticleService> {
  const repository = new ArticleRepository(env.DB);
  return createArticleService(repository);
}
```

## 生成工作流

1. **定义类型** - 在 `app/types/` 中定义实体和输入类型
2. **创建 Repository** - 实现数据访问逻辑
3. **创建 Service** - 实现业务逻辑，调用 Repository
4. **注入依赖** - 在路由或 API 中使用 Service

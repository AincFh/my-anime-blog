/**
 * Notion 文章同步服务 (精简版)
 * 
 * 只同步必要的字段：
 * - 文章标题、摘要、分类、标签、发布日期、封面图
 * - 内容类型、系列
 * - slug (从标题自动生成或使用现有值)
 * 
 * 不需要同步的字段（前端运行时推导）：
 * - 文章链接（由 slug + 域名生成）
 * - SEO标题/描述（直接用标题/摘要）
 * - OG图（直接用封面图）
 * - 排序权重（直接用发布日期）
 * - 最后更新时间（不需要展示）
 */

import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { getLogger } from '~/utils/logger';

export interface NotionArticle {
    id: string;
    slug: string;
    title: string;
    summary: string;
    category: string;
    tags: string[];
    cover_image: string | null;
    status: string;
    content_type: string;  // 内容类型
    series: string;        // 系列
    created_at: number;    // 发布日期
}

export interface SyncResult {
    success: boolean;
    added: number;
    updated: number;
    deleted: number;
    errors: string[];
    lastSyncedAt: number;
}

/**
 * 从标题自动生成 slug
 */
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')  // 中文保留，其他非字母数字变横线
        .replace(/-+/g, '-')  // 多个横线合并
        .replace(/^-|-$/g, '')  // 去除首尾横线
        .substring(0, 100);  // 限制长度
}

/**
 * 从 Notion API 获取文章列表
 */
async function fetchNotionArticles(
    notionToken: string,
    databaseId: string,
    kv: KVNamespace | null
): Promise<NotionArticle[]> {
    const cacheKey = 'notion_sync_cache_v2';
    
    // 尝试从缓存读取（减少 API 调用）
    if (kv) {
        try {
            const cached = await kv.get(cacheKey);
            if (cached) {
                getLogger().debug('Notion sync cache hit');
                return JSON.parse(cached);
            }
        } catch { /* ignore */ }
    }

    getLogger().debug('Fetching from Notion for sync');
    
    let allResults: Record<string, unknown>[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
        const response = await fetch(
            `https://api.notion.com/v1/databases/${databaseId}/query`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${notionToken}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filter: {
                        property: "状态",
                        status: {
                            equals: "✅ 已发布"
                        }
                    },
                    sorts: [
                        {
                            property: "发布日期",
                            direction: "descending"
                        }
                    ],
                    page_size: 100,
                    start_cursor: startCursor
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Notion API error (${response.status}): ${errorText}`);
        }

        const data: any = await response.json();
        allResults = allResults.concat(data.results || []);
        hasMore = data.has_more;
        startCursor = data.next_cursor;
    }

    const articles = allResults.map((page: any) => mapNotionToArticle(page));
    
    // 写入缓存，10分钟内有效
    if (kv && articles.length > 0) {
        try {
            await kv.put(cacheKey, JSON.stringify(articles), { expirationTtl: 600 });
        } catch { /* ignore */ }
    }

    return articles;
}

/**
 * 将 Notion Page 映射为本地文章格式
 */
function mapNotionToArticle(page: any): NotionArticle {
    const props = page.properties;
    
    // 提取标题
    const title = props["文章标题"]?.title?.[0]?.plain_text || "无标题";

    // 提取分类
    const category = props["分类"]?.select?.name || "未分类";

    // 提取标签
    const tags = props["标签"]?.multi_select?.map((s: Record<string, unknown>) => s.name as string) || [];

    // 提取内容类型
    const content_type = props["内容类型"]?.select?.name || "随笔";

    // 提取系列
    const series = props["系列"]?.select?.name || "";

    // 提取发布日期
    const publishDate = props["发布日期"]?.date?.start;
    const createdTime = props["创建时间"]?.created_time;
    const dateStr = publishDate || createdTime;
    const created_at = dateStr ? Math.floor(new Date(dateStr).getTime() / 1000) : Math.floor(Date.now() / 1000);

    // 提取摘要
    const summary = props["摘要"]?.rich_text?.[0]?.plain_text || "";

    // 提取封面图
    let cover_image: string | null = null;
    if (page.cover) {
        cover_image = page.cover.external?.url || page.cover.file?.url;
    } else if (props["封面图"]?.files?.length > 0) {
        const file = props["封面图"].files[0];
        cover_image = file.external?.url || file.file?.url;
    }

    // 自动生成 slug
    const slug = generateSlug(title);

    return {
        id: page.id,
        slug,
        title,
        summary,
        category,
        tags,
        cover_image,
        status: 'draft', // 同步后默认草稿状态，需要后台审核
        content_type,
        series,
        created_at
    };
}

/**
 * 获取 Notion 文章详情（Markdown 格式）
 */
export async function getNotionArticleContent(
    notionToken: string,
    pageId: string
): Promise<string | null> {
    try {
        const { Client } = await import("@notionhq/client");
        const { NotionToMarkdown } = await import("notion-to-md");

        const notion = new Client({ auth: notionToken });
        const n2mManager = new NotionToMarkdown({ notionClient: notion });

        const mdblocks = await n2mManager.pageToMarkdown(pageId);
        const mdString = n2mManager.toMarkdownString(mdblocks);

        return mdString.parent;
    } catch (error) {
        getLogger().error('Notion sync get content failed', { error: error instanceof Error ? error.message : String(error) });
        return null;
    }
}

/**
 * 主同步函数：将 Notion 文章同步到本地数据库
 */
export async function syncNotionArticles(
    db: D1Database,
    notionToken: string,
    databaseId: string,
    kv: KVNamespace | null
): Promise<SyncResult> {
    const result: SyncResult = {
        success: false,
        added: 0,
        updated: 0,
        deleted: 0,
        errors: [],
        lastSyncedAt: Date.now()
    };

    try {
        // 1. 从 Notion 获取文章
        const notionArticles = await fetchNotionArticles(notionToken, databaseId, kv);
        getLogger().info('Notion sync found articles', { count: notionArticles.length });

        if (notionArticles.length === 0) {
            result.success = true;
            return result;
        }

        // 2. 获取本地已有的 notion_id 列表
        const existingArticles = await db
            .prepare("SELECT id, notion_id FROM articles WHERE source = 'notion'")
            .all();
        
        const existingNotionIds = new Set(
            (existingArticles.results || []).map((row: any) => row.notion_id)
        );

        // 3. 获取 Notion 文章的 notion_id 列表
        const notionNotionIds = new Set(notionArticles.map(a => a.id));

        // 4. 删除本地有但 Notion 没有的文章
        const toDelete = [...existingNotionIds].filter(id => !notionNotionIds.has(id));
        
        for (const notionId of toDelete) {
            try {
                await db
                    .prepare("DELETE FROM articles WHERE notion_id = ? AND source = 'notion'")
                    .bind(notionId)
                    .run();
                result.deleted++;
            } catch (e: unknown) {
                result.errors.push(`Delete failed: ${e instanceof Error ? e.message : String(e)}`);
            }
        }

        // 5. 遍历 Notion 文章，新增或更新
        for (const article of notionArticles) {
            try {
                if (existingNotionIds.has(article.id)) {
                    // 更新现有文章
                    await db
                        .prepare(`
                            UPDATE articles SET
                                title = ?,
                                summary = ?,
                                category = ?,
                                tags = ?,
                                cover_image = ?,
                                updated_at = unixepoch(),
                                last_synced_at = ?
                            WHERE notion_id = ? AND source = 'notion'
                        `)
                        .bind(
                            article.title,
                            article.summary,
                            article.category,
                            JSON.stringify(article.tags),
                            article.cover_image,
                            result.lastSyncedAt,
                            article.id
                        )
                        .run();
                    result.updated++;
                } else {
                    // 新增文章
                    await db
                        .prepare(`
                            INSERT INTO articles (
                                notion_id, slug, title, summary, category, tags,
                                cover_image, status, source, 
                                created_at, updated_at, last_synced_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'notion', ?, unixepoch(), ?)
                        `)
                        .bind(
                            article.id,
                            article.slug,
                            article.title,
                            article.summary,
                            article.category,
                            JSON.stringify(article.tags),
                            article.cover_image,
                            article.status,
                            article.created_at,
                            result.lastSyncedAt
                        )
                        .run();
                    result.added++;
                }
            } catch (e: unknown) {
                result.errors.push(`Sync failed: ${article.title}: ${e instanceof Error ? e.message : String(e)}`);
            }
        }

        // 6. 记录同步历史
        if (kv) {
            try {
                const historyKey = 'notion_sync_history';
                const history = await kv.get(historyKey);
                const historyList = history ? JSON.parse(history) : [];
                
                historyList.unshift({
                    timestamp: result.lastSyncedAt,
                    added: result.added,
                    updated: result.updated,
                    deleted: result.deleted,
                    success: true
                });
                
                await kv.put(historyKey, JSON.stringify(historyList.slice(0, 50)));
            } catch { /* ignore */ }
        }

        result.success = true;
        getLogger().info('Notion sync completed', { added: result.added, updated: result.updated, deleted: result.deleted });
        
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Sync error: ${errMsg}`);
        getLogger().error('Notion sync critical error', { error: error instanceof Error ? error.message : String(error) });
    }

    return result;
}

/**
 * 获取同步历史
 */
export async function getSyncHistory(
    kv: KVNamespace | null
): Promise<Array<{ timestamp: number; added: number; updated: number; deleted: number; success: boolean }>> {
    if (!kv) return [];
    
    try {
        const history = await kv.get('notion_sync_history');
        return history ? JSON.parse(history) : [];
    } catch {
        return [];
    }
}

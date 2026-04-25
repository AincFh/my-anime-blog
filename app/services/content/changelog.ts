/**
 * 更新日志服务
 * 从 Notion 更新日志数据库读取版本更新记录
 */

import type { KVNamespace } from '@cloudflare/workers-types';
import type { ChangelogItem, ChangelogResponse } from '~/types/changelog';
import { getLogger } from '~/utils/logger';

const CACHE_KEY = 'notion_changelog_cache';
const CACHE_TTL_SECONDS = 30 * 60; // 30 分钟

/**
 * 从标题生成 slug
 */
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100);
}

/**
 * 解析 Notion 页面为更新日志条目
 */
function mapNotionToChangelog(page: any): ChangelogItem {
    const props = page.properties;

    // 更新标题
    const title = props["更新标题"]?.title?.[0]?.plain_text || "无标题";

    // 状态
    const status = props["状态"]?.status?.name || props["状态"]?.select?.name || "草稿";

    // 版本号
    const version = props["版本号"]?.rich_text?.[0]?.plain_text || "";

    // 更新类型
    const type = props["更新类型"]?.select?.name || "常规更新";

    // 日期
    const date = props["日期"]?.date?.start || props["创建时间"]?.created_time || new Date().toISOString();

    // 摘要
    const summary = props["摘要"]?.rich_text?.[0]?.plain_text || "";

    // slug
    const slug = props["slug"]?.rich_text?.[0]?.plain_text || generateSlug(title);

    // 首页展示
    const featured = props["首页展示"]?.checkbox || false;

    // 重大更新
    const major = props["是否重大更新"]?.checkbox || false;

    return {
        id: page.id,
        title,
        status,
        version,
        type,
        date,
        summary,
        slug,
        featured,
        major
    };
}

/**
 * 从 Notion 获取更新日志
 */
async function fetchChangelogFromNotion(
    notionToken: string,
    databaseId: string,
    kv: KVNamespace | null
): Promise<ChangelogItem[]> {
    // 尝试从缓存读取
    if (kv) {
        try {
            const cached = await kv.get(CACHE_KEY);
            if (cached) {
                getLogger().debug('Changelog cache hit');
                return JSON.parse(cached);
            }
        } catch { /* ignore */ }
    }

    getLogger().debug('Fetching changelog from Notion');

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
                    'Content-Type': 'application/json'
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
                            property: "日期",
                            direction: "descending"
                        }
                    ],
                    page_size: 100,
                    start_cursor: startCursor
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Notion API error (${response.status})`);
        }

        const data: any = await response.json();
        allResults = allResults.concat(data.results || []);
        hasMore = data.has_more;
        startCursor = data.next_cursor;
    }

    const items = allResults.map(mapNotionToChangelog);

    // 写入缓存
    if (kv && items.length > 0) {
        try {
            await kv.put(CACHE_KEY, JSON.stringify(items), {
                expirationTtl: CACHE_TTL_SECONDS
            });
        } catch { /* ignore */ }
    }

    return items;
}

/**
 * 获取更新日志
 */
export async function getChangelog(
    notionToken: string | undefined,
    databaseId: string | undefined,
    kv: KVNamespace | null,
    options?: {
        featuredOnly?: boolean;
        majorOnly?: boolean;
        type?: string;
    }
): Promise<ChangelogResponse> {
    if (!notionToken || !databaseId) {
        return { success: false, data: [], error: 'Notion 配置缺失' };
    }

    try {
        let items = await fetchChangelogFromNotion(notionToken, databaseId, kv);

        // 首页展示过滤
        if (options?.featuredOnly) {
            items = items.filter(item => item.featured);
        }

        // 重大更新过滤
        if (options?.majorOnly) {
            items = items.filter(item => item.major);
        }

        // 按类型过滤
        if (options?.type) {
            items = items.filter(item => item.type === options.type);
        }

        return { success: true, data: items };
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        getLogger().error('Fetch changelog failed', { error: errMsg });
        return { success: false, data: [], error: "获取更新日志失败" };
    }
}

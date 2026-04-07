/**
 * 时光机同步服务
 * 
 * 从 Notion 时光机数据库读取记录
 * 不做本地同步，直接返回给前端
 */

import type { KVNamespace } from '@cloudflare/workers-types';
import type { TimelineItem, TimelineResponse } from '~/types/timeline';

// 时光机 Notion 数据库 ID（需要从环境变量获取）
const TIMELINE_DATABASE_ID_KEY = 'NOTION_TIMELINE_DATABASE_ID';

// 缓存时间（分钟）
const CACHE_TTL_MINUTES = 10;

/**
 * 从标题自动生成 slug
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
 * 解析 Notion 页面为时光机条目
 */
function mapNotionToTimeline(page: any): TimelineItem {
    const props = page.properties;

    // 标题
    const title = props["记录标题"]?.title?.[0]?.plain_text || "无标题";

    // 状态
    const status = props["状态"]?.status?.name || props["状态"]?.select?.name || "草稿";

    // 类型
    const type = props["类型"]?.select?.name || "开发随记";

    // 日期
    const date = props["日期"]?.date?.start || props["日期"]?.created_time || new Date().toISOString();

    // 摘要
    const summary = props["摘要"]?.rich_text?.[0]?.plain_text || "";

    // slug
    const slug = props["slug"]?.rich_text?.[0]?.plain_text || generateSlug(title);

    // 首页展示
    const featured = props["首页展示"]?.checkbox || false;

    // 配图
    let cover: string | null = null;
    if (page.cover) {
        cover = page.cover.external?.url || page.cover.file?.url;
    } else if (props["配图"]?.files?.length > 0) {
        const file = props["配图"].files[0];
        cover = file.external?.url || file.file?.url;
    }

    return {
        id: page.id,
        title,
        status,
        type,
        date,
        summary,
        slug,
        featured,
        cover
    };
}

/**
 * 从 Notion 获取时光机记录
 */
async function fetchTimelineFromNotion(
    notionToken: string,
    databaseId: string,
    kv: KVNamespace | null
): Promise<TimelineItem[]> {
    const cacheKey = 'notion_timeline_cache_v2';

    // 尝试从缓存读取
    if (kv) {
        try {
            const cached = await kv.get(cacheKey);
            if (cached) {
                console.log('[Timeline] Using cache');
                return JSON.parse(cached);
            }
        } catch { /* ignore */ }
    }

    console.log('[Timeline] Fetching from Notion...');

    let allResults: any[] = [];
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
            const errorText = await response.text();
            throw new Error(`Notion API error (${response.status}): ${errorText}`);
        }

        const data: any = await response.json();
        allResults = allResults.concat(data.results || []);
        hasMore = data.has_more;
        startCursor = data.next_cursor;
    }

    const items = allResults.map(mapNotionToTimeline);

    // 写入缓存
    if (kv && items.length > 0) {
        try {
            await kv.put(cacheKey, JSON.stringify(items), {
                expirationTtl: CACHE_TTL_MINUTES * 60
            });
        } catch { /* ignore */ }
    }

    return items;
}

/**
 * 获取时光机数据
 */
export async function getTimeline(
    notionToken: string | undefined,
    databaseId: string | undefined,
    kv: KVNamespace | null,
    options?: {
        featuredOnly?: boolean;
        type?: string;
    }
): Promise<TimelineResponse> {
    // 检查必要的配置
    if (!notionToken || !databaseId) {
        return {
            success: false,
            data: [],
            error: 'Notion 配置缺失'
        };
    }

    try {
        let items = await fetchTimelineFromNotion(notionToken, databaseId, kv);

        // 按类型过滤
        if (options?.type) {
            items = items.filter(item => item.type === options.type);
        }

        // 按首页展示过滤
        if (options?.featuredOnly) {
            items = items.filter(item => item.featured);
        }

        return {
            success: true,
            data: items
        };
    } catch (error: any) {
        console.error('[Timeline] Failed to fetch:', error);
        return {
            success: false,
            data: [],
            error: error.message || '获取时光机数据失败'
        };
    }
}

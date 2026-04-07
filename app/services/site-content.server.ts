/**
 * 网站设定服务
 * 从 Notion 网站设定数据库读取配置内容
 */

import type { KVNamespace } from '@cloudflare/workers-types';
import type { SiteContent, SiteContentResponse } from '~/types/site-content';

const CACHE_KEY = 'notion_site_content_cache';
const CACHE_TTL_SECONDS = 30 * 60; // 30 分钟

/**
 * 解析 Notion 页面为网站设定条目
 */
function mapNotionToSiteContent(page: any): SiteContent {
    const props = page.properties;

    // 条目名称
    const name = props["条目名称"]?.title?.[0]?.plain_text || "无名称";

    // 状态
    const status = props["状态"]?.status?.name || props["状态"]?.select?.name || "草稿";

    // 类型
    const type = props["类型"]?.select?.name || "通用";

    // 页面标识
    const pageKey = props["页面标识"]?.rich_text?.[0]?.plain_text || "";

    // 所属页面
    const pageName = props["所属页面"]?.select?.name || "全局";

    // 摘要
    const summary = props["摘要"]?.rich_text?.[0]?.plain_text || "";

    // 排序
    const sort = props["排序"]?.number || 0;

    // 导航显示
    const navDisplay = props["导航显示"]?.checkbox || false;

    return {
        id: page.id,
        name,
        status,
        type,
        pageKey,
        page: pageName,
        summary,
        sort,
        navDisplay
    };
}

/**
 * 从 Notion 获取网站设定数据
 */
async function fetchSiteContentFromNotion(
    notionToken: string,
    databaseId: string,
    kv: KVNamespace | null
): Promise<SiteContent[]> {
    // 尝试从缓存读取
    if (kv) {
        try {
            const cached = await kv.get(CACHE_KEY);
            if (cached) {
                console.log('[SiteContent] Using cache');
                return JSON.parse(cached);
            }
        } catch { /* ignore */ }
    }

    console.log('[SiteContent] Fetching from Notion...');

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
                            equals: "✅ 已启用"
                        }
                    },
                    sorts: [
                        {
                            property: "排序",
                            direction: "ascending"
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

    const items = allResults.map(mapNotionToSiteContent);

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
 * 获取网站设定数据
 */
export async function getSiteContent(
    notionToken: string | undefined,
    databaseId: string | undefined,
    kv: KVNamespace | null,
    options?: {
        page?: string;
        pageKey?: string;
        navOnly?: boolean;
    }
): Promise<SiteContentResponse> {
    if (!notionToken || !databaseId) {
        return { success: false, data: [], error: 'Notion 配置缺失' };
    }

    try {
        let items = await fetchSiteContentFromNotion(notionToken, databaseId, kv);

        // 按页面过滤
        if (options?.page) {
            items = items.filter(item => item.page === options.page);
        }

        // 按页面标识精确查询
        if (options?.pageKey) {
            const found = items.find(item => item.pageKey === options.pageKey);
            return { success: true, data: found ? [found] : [] };
        }

        // 仅导航显示项
        if (options?.navOnly) {
            items = items.filter(item => item.navDisplay);
        }

        return { success: true, data: items };
    } catch (error: any) {
        console.error('[SiteContent] Failed to fetch:', error);
        return { success: false, data: [], error: error.message };
    }
}

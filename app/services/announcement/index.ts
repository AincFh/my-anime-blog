/**
 * 网站公告服务
 * 从 Notion 公告数据库读取有效公告
 */

import type { KVNamespace } from '@cloudflare/workers-types';
import type { Announcement, AnnouncementResponse } from '~/types/announcement';
import { getLogger } from '~/utils/logger';

const CACHE_KEY = 'notion_announcement_cache';
const CACHE_TTL_SECONDS = 5 * 60; // 5 分钟（公告时效性强，缓存短一些）

/**
 * 解析 Notion 页面为公告条目
 */
function mapNotionToAnnouncement(page: any): Announcement {
    const props = page.properties;

    // 公告标题
    const title = props["公告标题"]?.title?.[0]?.plain_text || "无标题";

    // 状态
    const status = props["状态"]?.status?.name || props["状态"]?.select?.name || "草稿";

    // 类型
    const type = props["类型"]?.select?.name || "普通公告";

    // 展示方式
    const displayMode = props["展示方式"]?.select?.name || "全站提示";

    // 优先级
    const priority = props["优先级"]?.number || 0;

    // 摘要
    const summary = props["摘要"]?.rich_text?.[0]?.plain_text || "";

    // 开始日期
    const startDate = props["开始日期"]?.date?.start || new Date().toISOString();

    // 结束日期
    const endDate = props["结束日期"]?.date?.start || null;

    // 首页展示
    const featured = props["首页展示"]?.checkbox || false;

    // 按钮文案
    const ctaText = props["按钮文案"]?.rich_text?.[0]?.plain_text || null;

    // 按钮链接
    const ctaLink = props["按钮链接"]?.url || null;

    return {
        id: page.id,
        title,
        status,
        type,
        displayMode,
        priority,
        summary,
        startDate,
        endDate,
        featured,
        ctaText,
        ctaLink
    };
}

/**
 * 检查公告是否在有效期内
 */
function isActiveAnnouncement(announcement: Announcement): boolean {
    const now = new Date();
    const start = new Date(announcement.startDate);
    const end = announcement.endDate ? new Date(announcement.endDate) : null;

    // 检查是否已生效
    if (now < start) return false;

    // 检查是否已过期
    if (end && now > end) return false;

    return true;
}

/**
 * 从 Notion 获取公告数据
 */
async function fetchAnnouncementsFromNotion(
    notionToken: string,
    databaseId: string,
    kv: KVNamespace | null
): Promise<Announcement[]> {
    // 尝试从缓存读取
    if (kv) {
        try {
            const cached = await kv.get(CACHE_KEY);
            if (cached) {
                getLogger().debug('Announcement cache hit');
                return JSON.parse(cached);
            }
        } catch { /* ignore */ }
    }

    getLogger().debug('Fetching announcements from Notion');

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
                            property: "优先级",
                            direction: "descending"
                        },
                        {
                            property: "开始日期",
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

    const items = allResults.map(mapNotionToAnnouncement);

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
 * 获取有效公告
 * 规范要求：三重过滤
 *   1. 状态 = ✅ 已发布
 *   2. 首页展示 = true（横幅/弹窗场景）
 *   3. 开始日期 ≤ now ≤ 结束日期
 */
export async function getAnnouncements(
    notionToken: string | undefined,
    databaseId: string | undefined,
    kv: KVNamespace | null,
    options?: {
        activeOnly?: boolean;
        featuredOnly?: boolean;
        displayMode?: string;
    }
): Promise<AnnouncementResponse> {
    if (!notionToken || !databaseId) {
        return { success: false, data: [], error: 'Notion 配置缺失' };
    }

    try {
        // 规范：必须做三重过滤
        // 1. 从 Notion 只拉已发布
        // 2. 按展示方式 / 首页展示过滤（调用方控制）
        // 3. 时间窗过滤（强制执行，防止 Notion 过期但仍显示）
        let items = await fetchAnnouncementsFromNotion(notionToken, databaseId, kv);

        // 首页展示过滤（横幅/弹窗场景）
        if (options?.featuredOnly) {
            items = items.filter(item => item.featured);
        }

        // 按展示方式过滤
        if (options?.displayMode) {
            items = items.filter(item => item.displayMode === options.displayMode);
        }

        // 时间窗过滤（规范关键要求：Notion 不自动下线，前台必须做时间过滤）
        if (options?.activeOnly !== false) {
            items = items.filter(isActiveAnnouncement);
        }

        return { success: true, data: items };
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        getLogger().error('Fetch announcements failed', { error: errMsg });
        return { success: false, data: [], error: errMsg };
    }
}

import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { getLogger } from '~/utils/logger';

/**
 * Notion API 服务封装 (Server Only)
 * 
 * ⚠️ 架构要点：Cloudflare Workers 中 env 在每次请求都不同，
 * 不能缓存依赖 env 的实例到模块级变量。
 * 每次请求必须重新创建 Client。
 */

export interface NotionArticle {
    id: string;
    slug: string;
    title: string;
    summary: string;
    category: string;
    tags: string[];
    cover_image: string | null;
    status: string;
    created_at: number;
}

/**
 * 获取文章列表 (带 KV 缓存)
 */
/**
 * 获取文章列表 (基于原生 Fetch，最适合 Workers 环境)
 */
export async function fetchNotionArticles(context: any): Promise<NotionArticle[]> {
    const env = context.cloudflare.env;
    const kv = env.CACHE_KV;
    const cacheKey = "notion_articles_list_v5";

    // 1. 尝试从 KV 读取
    if (kv) {
        try {
            const cached = await kv.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch { /* ignore */ }
    }

    getLogger().debug('Fetching articles from Notion via native fetch');

    let allResults: Record<string, unknown>[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    try {
        while (hasMore) {
            const response = await fetch(
                `https://api.notion.com/v1/databases/${env.NOTION_DATABASE_ID}/query`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.NOTION_TOKEN}`,
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
                                property: "创建时间",
                                direction: "descending"
                            }
                        ],
                        start_cursor: startCursor,
                        page_size: 100
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

        const articles = allResults.map((page: any) => mapNotionProperties(page));
        getLogger().info('Fetched articles from Notion', { count: articles.length });

        // 写入缓存
        if (kv && articles.length > 0) {
            await kv.put(cacheKey, JSON.stringify(articles), { expirationTtl: 600 });
        }

        return articles;
    } catch (error) {
        getLogger().error('Notion sync critical failure', { error: error instanceof Error ? error.message : String(error) });
        return [];
    }
}

/**
 * 获取单篇文章详情内容
 */
export async function getNotionArticleContent(slug: string, context: any) {
    const env = context.cloudflare.env;
    const kv = env.CACHE_KV;
    const cacheKey = `notion_article_${slug}`;

    if (kv) {
        try {
            const cached = await kv.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch { /* ignore */ }
    }

    const notion = new Client({ auth: env.NOTION_TOKEN });
    const n2mManager = new NotionToMarkdown({ notionClient: notion });

    // 先根据 slug 找到 page_id（slug 可以是 page_id 本身，也可以是文章链接字段值）
    let pageId: string | null = null;
    let metadata: NotionArticle | null = null;

    // 1. 策略1: 尝试 slug 作为「文章链接」字段 (P1 安全加固: 避免通过 SDK 调用以防类型报错)
    try {
        const queryResponse = await fetch(
            `https://api.notion.com/v1/databases/${env.NOTION_DATABASE_ID}/query`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.NOTION_TOKEN}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filter: {
                        property: "文章链接",
                        url: { equals: slug }
                    }
                })
            }
        );

        if (queryResponse.ok) {
            const queryData: any = await queryResponse.json();
            if (queryData.results?.length > 0) {
                pageId = queryData.results[0].id;
                metadata = mapNotionProperties(queryData.results[0]);
            }
        }
    } catch (e) {
        getLogger().error('Notion detail query failed', { error: e instanceof Error ? e.message : String(e) });
    }

    // 策略2: slug 可能就是 page_id（经过格式化）
    if (!pageId) {
        // 尝试通过遍历匹配 id
        const allArticles = await fetchNotionArticles(context);
        const matched = allArticles.find(a =>
            a.slug === slug ||
            a.id === slug ||
            a.id.replace(/-/g, '') === slug.replace(/-/g, '')
        );
        if (matched) {
            pageId = matched.id;
            metadata = matched;
        }
    }

    if (!pageId || !metadata) return null;

    // 转换 blocks 为 markdown
    const mdblocks = await n2mManager.pageToMarkdown(pageId);
    const mdString = n2mManager.toMarkdownString(mdblocks);

    const result = {
        metadata,
        content: mdString.parent
    };

    if (kv) {
        try {
            await kv.put(cacheKey, JSON.stringify(result), { expirationTtl: 600 });
        } catch { /* ignore */ }
    }

    return result;
}

/**
 * 属性映射逻辑 (Notion -> Internal Article)
 */
function mapNotionProperties(page: any): NotionArticle {
    const props = page.properties;

    // 提取标题
    const title = props["文章标题"]?.title?.[0]?.plain_text || "无标题";

    // 提取分类
    const category = props["分类"]?.select?.name || "未分类";

    // 提取标签
    const tags = props["标签"]?.multi_select?.map((s: Record<string, unknown>) => s.name as string) || [];

    // 提取日期：优先「发布日期」，其次「创建时间」
    const publishDate = props["发布日期"]?.date?.start;
    const createdTime = props["创建时间"]?.created_time;
    const dateStr = publishDate || createdTime;
    const created_at = dateStr ? Math.floor(new Date(dateStr).getTime() / 1000) : Math.floor(Date.now() / 1000);

    // 提取 Slug：优先「文章链接」，没有则使用 page.id
    const slug = props["文章链接"]?.url || page.id;

    // 提取摘要
    const summary = props["摘要"]?.rich_text?.[0]?.plain_text || "";

    // 提取封面图
    let cover_image = null;
    if (page.cover) {
        cover_image = page.cover.external?.url || page.cover.file?.url;
    } else if (props["封面图"]?.files?.length > 0) {
        const file = props["封面图"].files[0];
        cover_image = file.external?.url || file.file?.url;
    }

    return {
        id: page.id,
        slug,
        title,
        summary,
        category,
        tags,
        cover_image,
        status: props["状态"]?.status?.name || "",
        created_at
    };
}

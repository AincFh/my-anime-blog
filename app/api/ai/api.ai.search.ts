/**
 * AI 智能搜索 API
 * 语义搜索，理解用户意图并匹配相关文章
 */

import type { Route } from "./+types/api.ai.search";
import {
    callDeepseek,
    trackAIUsage,
    checkDailyLimit,
    incrementDailyCount,
} from "~/services/ai.server";
import { AI_PROMPTS, buildMessages, safeParseJSON } from "~/utils/ai-shared";
import type { AIMessage } from "~/utils/ai-shared";
import {
    getAIConfig,
    getDeepseekAPIKey,
} from "~/services/ai-config.server";
import { queryAll } from "~/services/db.server";

interface SearchRequest {
    query: string;
}

interface SearchResult {
    slug: string;
    relevance: string;
}

interface SearchResponse {
    success: boolean;
    results?: SearchResult[];
    error?: string;
}

interface Article {
    slug: string;
    title: string;
    summary: string | null;
    category: string | null;
    tags: string | null;
}

export async function action({ request, context }: Route.ActionArgs): Promise<Response> {
    if (request.method !== "POST") {
        return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
    }

    const env = (context as any).cloudflare.env;
    const db = env.anime_db;
    const kv = env.CACHE_KV || null;

    // 鉴权：需要登录
    const { requireAuth } = await import("~/utils/auth");
    const session = await requireAuth(request, db);
    if (!session) {
        return Response.json({ success: false, error: "请先登录" }, { status: 401 });
    }

    try {
        // 检查 AI 功能是否启用
        const config = await getAIConfig(db);
        if (!config.enabled || !config.features.search) {
            return Response.json({
                success: false,
                error: "AI 智能搜索功能暂未开启",
            });
        }

        // 检查 API Key
        const apiKey = getDeepseekAPIKey(env);
        if (!apiKey) {
            return Response.json({
                success: false,
                error: "AI 服务未配置",
            });
        }

        // 检查每日限制
        const limitCheck = await checkDailyLimit(db, kv, "search");
        if (!limitCheck.allowed) {
            return Response.json({
                success: false,
                error: "今日 AI 搜索次数已达上限",
            });
        }

        // 解析请求
        const body: SearchRequest = await request.json();
        const { query } = body;

        if (!query || typeof query !== "string" || query.trim().length < 2) {
            return Response.json({
                success: false,
                error: "搜索词太短",
            });
        }

        // 获取所有已发布文章的摘要信息
        const articles = await queryAll<Article>(
            db,
            `SELECT slug, title, summary, category, tags
       FROM articles
       WHERE status = 'published'
       ORDER BY created_at DESC
       LIMIT 50`
        );

        if (articles.length === 0) {
            return Response.json({
                success: true,
                results: [],
            });
        }

        // 构建文章上下文
        const articlesContext = articles
            .map((a, i) => `${i + 1}. [${a.slug}] ${a.title} - ${a.summary || '无摘要'} (${a.category || '未分类'})`)
            .join('\n');

        // 构建 prompt
        const prompt = AI_PROMPTS.search(query, articlesContext);
        const messages = buildMessages(prompt);

        // 调用 AI
        const result = await callDeepseek(apiKey, {
            messages,
            temperature: 0.3,
            maxTokens: 500,
            aiBinding: env.AI,
            jsonMode: true,
        });

        if (!result.success || !result.content) {
            return Response.json({
                success: false,
                error: result.error || "AI 搜索失败",
            });
        }

        // 解析 AI 返回的结果
        const searchResults = safeParseJSON<SearchResult[]>(result.content, []);

        // 记录使用量
        await trackAIUsage(db, {
            feature: "search",
            tokensUsed: result.tokensUsed || 0,
        });

        // 增加计数
        await incrementDailyCount(kv, "search");

        return Response.json({
            success: true,
            results: searchResults.slice(0, 10), // 最多返回10个结果
        } as SearchResponse);
    } catch (error) {
        console.error("AI Search error:", error);
        return Response.json({
            success: false,
            error: "服务器错误，请稍后再试",
        }, { status: 500 });
    }
}

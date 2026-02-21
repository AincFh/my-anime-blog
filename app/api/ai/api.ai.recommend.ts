/**
 * AI 文章推荐 API
 * 根据当前阅读的文章推荐相关内容
 */

import type { Route } from "./+types/api.ai.recommend";
import {
    callDeepseekWithCache,
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
import { queryAll, queryFirst } from "~/services/db.server";

interface RecommendRequest {
    articleSlug: string;
}

interface RecommendResult {
    slug: string;
    reason: string;
}

interface RecommendResponse {
    success: boolean;
    recommendations?: RecommendResult[];
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
        if (!config.enabled || !config.features.recommend) {
            return Response.json({
                success: false,
                error: "AI 推荐功能暂未开启",
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
        const limitCheck = await checkDailyLimit(db, kv, "recommend");
        if (!limitCheck.allowed) {
            return Response.json({
                success: false,
                error: "今日 AI 推荐次数已达上限",
            });
        }

        // 解析请求
        const body: RecommendRequest = await request.json();
        const { articleSlug } = body;

        if (!articleSlug) {
            return Response.json({
                success: false,
                error: "缺少文章标识",
            });
        }

        // 获取当前文章
        const currentArticle = await queryFirst<Article>(
            db,
            `SELECT slug, title, summary, category, tags
       FROM articles
       WHERE slug = ? AND status = 'published'`,
            articleSlug
        );

        if (!currentArticle) {
            return Response.json({
                success: false,
                error: "文章不存在",
            });
        }

        // 获取其他文章作为候选
        const candidateArticles = await queryAll<Article>(
            db,
            `SELECT slug, title, summary, category, tags
       FROM articles
       WHERE status = 'published' AND slug != ?
       ORDER BY created_at DESC
       LIMIT 30`,
            articleSlug
        );

        if (candidateArticles.length === 0) {
            return Response.json({
                success: true,
                recommendations: [],
            });
        }

        // 构建上下文
        const currentContext = `${currentArticle.title} - ${currentArticle.summary || '无摘要'} (${currentArticle.category || '未分类'})`;
        const candidatesContext = candidateArticles
            .map((a) => `[${a.slug}] ${a.title} - ${a.summary || '无摘要'} (${a.category || '未分类'})`)
            .join('\n');

        // 构建 prompt
        const prompt = AI_PROMPTS.recommend(currentContext, candidatesContext);
        const messages = buildMessages(prompt);

        // 使用缓存（相同文章的推荐可以缓存）
        const cacheKey = `ai_recommend:${articleSlug}`;
        const result = await callDeepseekWithCache(
            apiKey,
            kv,
            cacheKey,
            {
                messages,
                temperature: 0.5,
                maxTokens: 500,
                aiBinding: env.AI,
                jsonMode: true,
            },
            3600 * 24 // 缓存 24 小时
        );

        if (!result.success || !result.content) {
            return Response.json({
                success: false,
                error: result.error || "AI 推荐失败",
            });
        }

        // 解析 AI 返回的结果
        const recommendations = safeParseJSON<RecommendResult[]>(result.content, []);

        // 只有非缓存结果才记录使用量
        if (!result.cached) {
            await trackAIUsage(db, {
                feature: "recommend",
                tokensUsed: result.tokensUsed || 0,
            });
            await incrementDailyCount(kv, "recommend");
        }

        return Response.json({
            success: true,
            recommendations: recommendations.slice(0, 5), // 最多5个推荐
        } as RecommendResponse);
    } catch (error) {
        console.error("AI Recommend error:", error);
        return Response.json({
            success: false,
            error: "服务器错误，请稍后再试",
        }, { status: 500 });
    }
}

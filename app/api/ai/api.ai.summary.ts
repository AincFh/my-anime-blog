/**
 * AI 文章摘要 API
 * 根据文章内容自动生成摘要
 */

import type { ActionFunctionArgs } from "react-router";
import {
    callDeepseek,
    trackAIUsage,
    checkDailyLimit,
    incrementDailyCount,
} from "~/services/ai.server";
import { AI_PROMPTS, buildMessages } from "~/utils/ai-shared";
import {
    getAIConfig,
    getDeepseekAPIKey,
} from "~/services/ai-config.server";

interface SummaryRequest {
    content: string;
    title?: string;
}

interface SummaryResponse {
    success: boolean;
    summary?: string;
    error?: string;
}

export async function action({ request, context }: ActionFunctionArgs): Promise<Response> {
    if (request.method !== "POST") {
        return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
    }

    const env = context.cloudflare.env as { anime_db?: import('~/services/db.server').Database; CACHE_KV?: import('@cloudflare/workers-types').KVNamespace; AI?: import('@cloudflare/workers-types').Ai; DEEPSEEK_API_KEY?: string; ANTHROPIC_API_KEY?: string };
    const db = env.anime_db;
    const kv = env.CACHE_KV || null;

    // 鉴权：需要登录
    const { requireAuth } = await import("~/utils/auth");
    const authSession = await requireAuth(request, db);
    if (!authSession) {
        return Response.json({ success: false, error: "请先登录以使用 AI 功能" }, { status: 401 });
    }

    try {
        // 检查 AI 功能是否启用
        const config = await getAIConfig(db);
        if (!config.enabled || !config.features.summary) {
            return Response.json({
                success: false,
                error: "AI 摘要功能暂未开启",
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

        // 检查每日限制 (P1 安全加固: 增加 userId 维度)
        const limitCheck = await checkDailyLimit(db, kv, "summary", authSession.userId);
        if (!limitCheck.allowed) {
            return Response.json({
                success: false,
                error: "今日 AI 摘要生成次数已达上限",
            });
        }

        // 解析请求
        const body: SummaryRequest = await request.json();
        const { content } = body;

        if (!content || typeof content !== "string" || content.trim().length < 50) {
            return Response.json({
                success: false,
                error: "文章内容太短，无法生成摘要（至少50字）",
            });
        }

        // 限制内容长度以控制 token
        const truncatedContent = content.slice(0, 5000);

        // 构建 prompt
        const prompt = AI_PROMPTS.summary(truncatedContent);
        const messages = buildMessages(prompt);

        // 调用 AI
        const result = await callDeepseek(apiKey, {
            messages,
            temperature: 0.7,
            maxTokens: 500,
            aiBinding: env.AI,
        });

        if (!result.success) {
            return Response.json({
                success: false,
                error: result.error || "AI 生成摘要失败",
            });
        }

        // 记录使用量 (使用 authSession 中的用户信息)
        await trackAIUsage(db, {
            userId: authSession.userId,
            feature: "summary",
            tokensUsed: result.tokensUsed || 0,
        });

        // 增加计数 (P1 安全加固: 增加 userId 维度)
        await incrementDailyCount(kv, "summary", authSession.userId);

        return Response.json({
            success: true,
            summary: result.content?.trim(),
        } as SummaryResponse);
    } catch (error) {
        console.error("AI Summary error:", error);
        return Response.json({
            success: false,
            error: "服务器错误，请稍后再试",
        }, { status: 500 });
    }
}

/**
 * AI 内容审核 API
 * 自动审核评论和用户生成内容
 */

import type { Route } from "./+types/api.ai.moderate";
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

interface ModerateRequest {
    content: string;
    type?: "comment" | "article" | "nickname";
}

interface ModerationResult {
    safe: boolean;
    reason?: string;
    category: "spam" | "hate" | "political" | "nsfw" | "safe";
}

interface ModerateResponse {
    success: boolean;
    result?: ModerationResult;
    error?: string;
}

export async function action({ request, context }: Route.ActionArgs): Promise<Response> {
    if (request.method !== "POST") {
        return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
    }

    const env = (context as any).cloudflare.env;
    const db = env.anime_db;
    const kv = env.CACHE_KV || null;

    try {
        // 检查 AI 功能是否启用
        const config = await getAIConfig(db);
        if (!config.enabled || !config.features.moderate) {
            // 如果审核功能未启用，默认放行
            return Response.json({
                success: true,
                result: { safe: true, category: "safe" },
            });
        }

        // 检查 API Key
        const apiKey = getDeepseekAPIKey(env);
        if (!apiKey) {
            // 无 API Key 时默认放行
            return Response.json({
                success: true,
                result: { safe: true, category: "safe" },
            });
        }

        // 检查每日限制
        const limitCheck = await checkDailyLimit(db, kv, "moderate");
        if (!limitCheck.allowed) {
            // 超过限制时默认放行
            return Response.json({
                success: true,
                result: { safe: true, category: "safe" },
            });
        }

        // 解析请求
        const body: ModerateRequest = await request.json();
        const { content, type = "comment" } = body;

        if (!content || typeof content !== "string" || content.trim().length === 0) {
            return Response.json({
                success: false,
                error: "内容不能为空",
            });
        }

        // 短内容快速放行（少于5字符难以判断）
        if (content.trim().length < 5) {
            return Response.json({
                success: true,
                result: { safe: true, category: "safe" },
            });
        }

        // 构建 prompt
        const prompt = AI_PROMPTS.moderate(content);
        const messages = buildMessages(prompt);

        // 调用 AI
        const result = await callDeepseek(apiKey, {
            messages,
            temperature: 0.1, // 低温度确保一致性
            maxTokens: 200,
        });

        if (!result.success || !result.content) {
            // AI 调用失败时默认放行
            return Response.json({
                success: true,
                result: { safe: true, category: "safe" },
            });
        }

        // 解析 AI 返回的 JSON
        const moderationResult = safeParseJSON<ModerationResult>(
            result.content,
            { safe: true, category: "safe" }
        );

        // 记录使用量
        await trackAIUsage(db, {
            feature: "moderate",
            tokensUsed: result.tokensUsed || 0,
        });

        // 增加计数
        await incrementDailyCount(kv, "moderate");

        return Response.json({
            success: true,
            result: moderationResult,
        } as ModerateResponse);
    } catch (error) {
        console.error("AI Moderate error:", error);
        // 出错时默认放行
        return Response.json({
            success: true,
            result: { safe: true, category: "safe" },
        });
    }
}

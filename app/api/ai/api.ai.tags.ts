/**
 * AI 标签生成 API
 * 根据文章内容自动生成合适的标签
 */

import type { Route } from "./+types/api.ai.tags";
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

interface TagsRequest {
    title: string;
    content: string;
}

interface TagsResponse {
    success: boolean;
    tags?: string[];
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
        if (!config.enabled || !config.features.tags) {
            return Response.json({
                success: false,
                error: "AI 标签生成功能暂未开启",
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
        const limitCheck = await checkDailyLimit(db, kv, "tags");
        if (!limitCheck.allowed) {
            return Response.json({
                success: false,
                error: "今日 AI 标签生成次数已达上限",
            });
        }

        // 解析请求
        const body: TagsRequest = await request.json();
        const { title, content } = body;

        if (!title || !content) {
            return Response.json({
                success: false,
                error: "标题和内容不能为空",
            });
        }

        // 构建 prompt
        const prompt = AI_PROMPTS.tags(title, content);
        const messages = buildMessages(prompt);

        // 调用 AI
        const result = await callDeepseek(apiKey, {
            messages,
            temperature: 0.6,
            maxTokens: 200,
            aiBinding: env.AI,
            jsonMode: true,
        });

        if (!result.success || !result.content) {
            return Response.json({
                success: false,
                error: result.error || "AI 生成失败",
            });
        }

        // 解析 AI 返回的 JSON 数组
        const tags = safeParseJSON<string[]>(result.content, []);

        // 记录使用量
        await trackAIUsage(db, {
            feature: "tags",
            tokensUsed: result.tokensUsed || 0,
        });

        // 增加计数
        await incrementDailyCount(kv, "tags");

        return Response.json({
            success: true,
            tags: tags.slice(0, 6), // 最多6个标签
        } as TagsResponse);
    } catch (error) {
        console.error("AI Tags error:", error);
        return Response.json({
            success: false,
            error: "服务器错误，请稍后再试",
        }, { status: 500 });
    }
}

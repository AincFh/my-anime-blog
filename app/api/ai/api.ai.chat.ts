/**
 * AI 聊天 API 路由
 * 处理与 AI 聊天机器人的对话
 */

import type { Route } from "./+types/api.ai.chat";
import {
    callDeepseek,
    trackAIUsage,
    checkDailyLimit,
    incrementDailyCount,
} from "~/services/ai.server";
import { AI_PROMPTS, buildMessages } from "~/utils/ai-shared";
import type { AIMessage } from "~/utils/ai-shared";
import {
    getAIConfig,
    getDeepseekAPIKey,
    buildBlogContext,
} from "~/services/ai-config.server";

interface ChatRequest {
    message: string;
    history?: AIMessage[];
}

interface ChatResponse {
    success: boolean;
    reply?: string;
    error?: string;
    remaining?: number;
}

export async function action({ request, context }: Route.ActionArgs): Promise<Response> {
    // 只接受 POST 请求
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
        if (!config.enabled || !config.features.chat) {
            return Response.json({
                success: false,
                error: "AI 聊天功能暂未开启",
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
        const limitCheck = await checkDailyLimit(db, kv, "chat");
        if (!limitCheck.allowed) {
            return Response.json({
                success: false,
                error: "今日 AI 对话次数已达上限，明天再来吧～",
                remaining: 0,
            });
        }

        // 解析请求
        const body: ChatRequest = await request.json();
        const { message, history = [] } = body;

        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return Response.json({
                success: false,
                error: "消息不能为空",
            });
        }

        // 限制消息长度
        if (message.length > 500) {
            return Response.json({
                success: false,
                error: "消息太长了，请精简一下（最多500字）",
            });
        }

        // 构建博客上下文
        const blogContext = await buildBlogContext(db);

        // 构建系统提示
        const systemPrompt = AI_PROMPTS.chat(blogContext);

        // 构建消息历史（限制历史长度以控制 token）
        const recentHistory = history.slice(-6); // 保留最近 3 轮对话
        const messages: AIMessage[] = [
            { role: "system", content: systemPrompt.system },
            ...recentHistory,
            { role: "user", content: message },
        ];

        // 调用 AI
        const result = await callDeepseek(apiKey, {
            messages,
            temperature: 0.8,
            maxTokens: 500,
        });

        if (!result.success) {
            return Response.json({
                success: false,
                error: result.error || "AI 暂时无法回复，请稍后再试",
            });
        }

        // 记录使用量
        await trackAIUsage(db, {
            feature: "chat",
            tokensUsed: result.tokensUsed || 0,
        });

        // 增加计数
        await incrementDailyCount(kv, "chat");

        return Response.json({
            success: true,
            reply: result.content,
            remaining: limitCheck.remaining - 1,
        } as ChatResponse);
    } catch (error) {
        console.error("AI Chat error:", error);
        return Response.json({
            success: false,
            error: "服务器错误，请稍后再试",
        }, { status: 500 });
    }
}

// GET 请求返回聊天机器人配置
export async function loader({ context }: Route.LoaderArgs) {
    const env = (context as any).cloudflare.env;
    const db = env.anime_db;
    const kv = env.CACHE_KV || null;

    try {
        const config = await getAIConfig(db);
        const limitCheck = await checkDailyLimit(db, kv, "chat");

        return Response.json({
            enabled: config.enabled && config.features.chat,
            chatbot: config.chatbot,
            remaining: limitCheck.remaining,
            limit: limitCheck.limit,
        });
    } catch (error) {
        console.error("AI Chat config error:", error);
        return Response.json({
            enabled: false,
            error: "获取配置失败",
        });
    }
}

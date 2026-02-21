/**
 * AI 写作助手 API
 * 提供续写、润色、翻译等功能
 */

import type { Route } from "./+types/api.ai.writing";
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
} from "~/services/ai-config.server";

type WritingAction = "continue" | "polish" | "translate" | "correct";

interface WritingRequest {
    content: string;
    action: WritingAction;
    targetLang?: string; // 用于翻译
}

interface WritingResponse {
    success: boolean;
    result?: string;
    error?: string;
}

// 写作助手 Prompt 模板
const WRITING_PROMPTS: Record<WritingAction, (content: string, targetLang?: string) => { system: string; user: string }> = {
    continue: AI_PROMPTS.writingContinue,
    polish: AI_PROMPTS.writingPolish,
    translate: (content: string, targetLang: string = "英文") => ({
        system: `你是一个专业翻译。请将内容翻译成${targetLang}。
要求：
1. 保持原文的风格和语气
2. 翻译自然流畅
3. 专业术语准确`,
        user: `请翻译：\n\n${content}`,
    }),
    correct: (content: string) => ({
        system: `你是一个文字校对专家。请检查并修正以下内容中的错别字、语法错误和标点符号问题。
要求：
1. 只修正错误，不改变原意
2. 保持原文风格
3. 如有修改，在末尾简要说明改了什么`,
        user: `请校对：\n\n${content}`,
    }),
};

export async function action({ request, context }: Route.ActionArgs): Promise<Response> {
    if (request.method !== "POST") {
        return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
    }

    const env = (context as any).cloudflare.env;
    const db = env.anime_db;

    // 鉴权：仅管理员可用
    const { requireAdmin } = await import("~/utils/auth");
    const session = await requireAdmin(request, db);
    if (!session) {
        return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const kv = env.CACHE_KV || null;

    try {
        // 检查 AI 功能是否启用
        const config = await getAIConfig(db);
        if (!config.enabled || !config.features.writing) {
            return Response.json({
                success: false,
                error: "AI 写作助手暂未开启",
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
        const limitCheck = await checkDailyLimit(db, kv, "writing");
        if (!limitCheck.allowed) {
            return Response.json({
                success: false,
                error: "今日 AI 写作助手使用次数已达上限",
            });
        }

        // 解析请求
        const body: WritingRequest = await request.json();
        const { content, action, targetLang } = body;

        if (!content || typeof content !== "string" || content.trim().length === 0) {
            return Response.json({
                success: false,
                error: "内容不能为空",
            });
        }

        if (!action || !WRITING_PROMPTS[action]) {
            return Response.json({
                success: false,
                error: "无效的操作类型",
            });
        }

        // 限制内容长度
        if (content.length > 3000) {
            return Response.json({
                success: false,
                error: "内容过长，请限制在3000字以内",
            });
        }

        // 构建 prompt
        const promptFn = WRITING_PROMPTS[action];
        const prompt = promptFn(content, targetLang);
        const messages = buildMessages(prompt);

        // 调用 AI
        const result = await callDeepseek(apiKey, {
            messages,
            temperature: action === "correct" ? 0.3 : 0.7,
            maxTokens: 2000,
        });

        if (!result.success) {
            return Response.json({
                success: false,
                error: result.error || "AI 处理失败",
            });
        }

        // 记录使用量
        await trackAIUsage(db, {
            feature: "writing",
            tokensUsed: result.tokensUsed || 0,
        });

        // 增加计数
        await incrementDailyCount(kv, "writing");

        return Response.json({
            success: true,
            result: result.content?.trim(),
        } as WritingResponse);
    } catch (error) {
        console.error("AI Writing error:", error);
        return Response.json({
            success: false,
            error: "服务器错误，请稍后再试",
        }, { status: 500 });
    }
}

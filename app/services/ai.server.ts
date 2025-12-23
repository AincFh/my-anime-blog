/**
 * AI 服务层 - Deepseek API 封装
 * 提供统一的 AI 调用入口，包含错误处理、重试机制和使用量追踪
 */

import { execute, queryFirst } from './db.server';
import type { AIMessage, AICompletionOptions, AICompletionResult } from '~/utils/ai-shared';
import { AI_PROMPTS, buildMessages, safeParseJSON } from '~/utils/ai-shared';

export type { AIMessage, AICompletionOptions, AICompletionResult };
export { AI_PROMPTS, buildMessages, safeParseJSON };

export interface AIUsageRecord {
    userId?: number;
    feature: AIFeature;
    tokensUsed: number;
}

export type AIFeature =
    | 'summary'      // 文章摘要
    | 'search'       // 智能搜索
    | 'writing'      // 写作助手
    | 'chat'         // 聊天机器人
    | 'recommend'    // 推荐系统
    | 'moderate'     // 内容审核
    | 'seo'          // SEO 生成
    | 'image_suggest' // 配图建议
    | 'tags'         // 标签生成
    | 'translate';   // 翻译

// ============ 常量配置 ============

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek-chat';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// 每日调用限制（可在 system_settings 中配置）
export const DEFAULT_DAILY_LIMITS: Record<AIFeature, number> = {
    summary: 100,
    search: 200,
    writing: 50,
    chat: 500,
    recommend: 300,
    moderate: 1000,
    seo: 100,
    image_suggest: 50,
    tags: 100,
    translate: 100,
};

// ============ 核心函数 ============

/**
 * 调用 Deepseek API
 */
export async function callDeepseek(
    apiKey: string,
    options: AICompletionOptions
): Promise<AICompletionResult> {
    const {
        model = DEFAULT_MODEL,
        messages,
        temperature = 0.7,
        maxTokens = 2000,
        stream = false,
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(DEEPSEEK_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature,
                    max_tokens: maxTokens,
                    stream,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
                throw new Error(
                    `Deepseek API error: ${response.status} - ${errorData.error?.message || response.statusText}`
                );
            }

            const data = await response.json() as {
                choices?: { message?: { content?: string } }[];
                usage?: { total_tokens?: number };
            };
            const content = data.choices?.[0]?.message?.content || '';
            const tokensUsed = data.usage?.total_tokens || 0;

            return {
                success: true,
                content,
                tokensUsed,
                cached: false,
            };
        } catch (error) {
            lastError = error as Error;
            console.error(`Deepseek API attempt ${attempt} failed:`, error);

            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY_MS * attempt);
            }
        }
    }

    return {
        success: false,
        error: lastError?.message || '调用 AI 服务失败',
    };
}

/**
 * 带缓存的 AI 调用
 */
export async function callDeepseekWithCache(
    apiKey: string,
    kv: KVNamespace | null,
    cacheKey: string,
    options: AICompletionOptions,
    cacheTTL: number = 3600 // 默认缓存 1 小时
): Promise<AICompletionResult> {
    // 尝试从缓存获取
    if (kv) {
        try {
            const cached = await kv.get(cacheKey);
            if (cached) {
                return {
                    success: true,
                    content: cached,
                    tokensUsed: 0,
                    cached: true,
                };
            }
        } catch (error) {
            console.error('KV cache read error:', error);
        }
    }

    // 调用 API
    const result = await callDeepseek(apiKey, options);

    // 成功则缓存结果
    if (result.success && result.content && kv) {
        try {
            await kv.put(cacheKey, result.content, { expirationTtl: cacheTTL });
        } catch (error) {
            console.error('KV cache write error:', error);
        }
    }

    return result;
}

// ============ 使用量追踪 ============

/**
 * 记录 AI 使用量
 */
export async function trackAIUsage(
    db: any,
    record: AIUsageRecord
): Promise<void> {
    try {
        await execute(
            db,
            `INSERT INTO ai_usage (user_id, feature, tokens_used, created_at)
       VALUES (?, ?, ?, unixepoch())`,
            record.userId || null,
            record.feature,
            record.tokensUsed
        );
    } catch (error) {
        console.error('Failed to track AI usage:', error);
    }
}

/**
 * 检查是否超过每日限制
 */
export async function checkDailyLimit(
    db: any,
    kv: KVNamespace | null,
    feature: AIFeature,
    customLimits?: Record<AIFeature, number>
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const limits = customLimits || DEFAULT_DAILY_LIMITS;
    const limit = limits[feature] || 100;

    // 使用 KV 快速检查（避免频繁查询数据库）
    const today = new Date().toISOString().split('T')[0];
    const counterKey = `ai_limit:${feature}:${today}`;

    let currentCount = 0;

    if (kv) {
        try {
            const cached = await kv.get(counterKey);
            currentCount = cached ? parseInt(cached, 10) : 0;
        } catch (error) {
            console.error('KV counter read error:', error);
        }
    }

    return {
        allowed: currentCount < limit,
        remaining: Math.max(0, limit - currentCount),
        limit,
    };
}

/**
 * 增加每日计数
 */
export async function incrementDailyCount(
    kv: KVNamespace | null,
    feature: AIFeature
): Promise<void> {
    if (!kv) return;

    const today = new Date().toISOString().split('T')[0];
    const counterKey = `ai_limit:${feature}:${today}`;

    try {
        const cached = await kv.get(counterKey);
        const currentCount = cached ? parseInt(cached, 10) : 0;
        // 设置过期时间为次日 0 点后 1 小时（确保覆盖时区差异）
        await kv.put(counterKey, String(currentCount + 1), { expirationTtl: 90000 });
    } catch (error) {
        console.error('KV counter increment error:', error);
    }
}

// ============ 工具函数 ============

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}




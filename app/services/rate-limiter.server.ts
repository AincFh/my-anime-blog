/**
 * 速率限制器服务
 * 使用 KV 实现简单的 API 速率限制
 */

export interface RateLimitConfig {
    /** 时间窗口（秒） */
    windowSeconds: number;
    /** 最大请求数 */
    maxRequests: number;
}

export interface RateLimitResult {
    /** 是否允许请求 */
    allowed: boolean;
    /** 剩余请求数 */
    remaining: number;
    /** 重置时间（Unix 时间戳） */
    resetAt: number;
    /** 需要等待的秒数（如果被限制） */
    retryAfter?: number;
}

// 预定义的限制配置
export const RATE_LIMITS = {
    // 登录：每分钟最多 5 次
    login: { windowSeconds: 60, maxRequests: 5 },
    // 注册：每小时最多 3 次
    register: { windowSeconds: 3600, maxRequests: 3 },
    // AI 聊天：每分钟最多 10 次
    aiChat: { windowSeconds: 60, maxRequests: 10 },
    // AI 推荐：每分钟最多 20 次
    aiRecommend: { windowSeconds: 60, maxRequests: 20 },
    // API 通用：每分钟最多 60 次
    apiGeneral: { windowSeconds: 60, maxRequests: 60 },
    // 评论发布：每分钟最多 3 次
    comment: { windowSeconds: 60, maxRequests: 3 },
} as const;

/**
 * 检查速率限制
 */
export async function checkRateLimit(
    kv: KVNamespace,
    key: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % config.windowSeconds);
    const resetAt = windowStart + config.windowSeconds;

    const kvKey = `ratelimit:${key}:${windowStart}`;

    try {
        // 获取当前计数
        const currentStr = await kv.get(kvKey);
        const current = currentStr ? parseInt(currentStr, 10) : 0;

        if (current >= config.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetAt,
                retryAfter: resetAt - now,
            };
        }

        // 增加计数
        await kv.put(kvKey, String(current + 1), {
            expirationTtl: config.windowSeconds,
        });

        return {
            allowed: true,
            remaining: config.maxRequests - current - 1,
            resetAt,
        };
    } catch (error) {
        console.error('Rate limit error:', error);
        // 出错时允许请求，避免影响正常使用
        return {
            allowed: true,
            remaining: config.maxRequests,
            resetAt,
        };
    }
}

/**
 * 创建速率限制响应头
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
    const headers = new Headers();
    headers.set('X-RateLimit-Remaining', String(result.remaining));
    headers.set('X-RateLimit-Reset', String(result.resetAt));

    if (!result.allowed && result.retryAfter) {
        headers.set('Retry-After', String(result.retryAfter));
    }

    return headers;
}

/**
 * 创建速率限制错误响应
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
    return Response.json(
        {
            success: false,
            error: '请求过于频繁，请稍后再试',
            retryAfter: result.retryAfter,
        },
        {
            status: 429,
            headers: createRateLimitHeaders(result),
        }
    );
}

/**
 * 速率限制中间件
 * 用于 API 路由
 */
export async function withRateLimit(
    kv: KVNamespace | null,
    key: string,
    config: RateLimitConfig,
    handler: () => Promise<Response>
): Promise<Response> {
    if (!kv) {
        // 没有 KV 时直接放行
        return handler();
    }

    const result = await checkRateLimit(kv, key, config);

    if (!result.allowed) {
        return createRateLimitResponse(result);
    }

    const response = await handler();

    // 添加速率限制头
    const headers = createRateLimitHeaders(result);
    headers.forEach((value, key) => {
        response.headers.set(key, value);
    });

    return response;
}

/**
 * 根据请求获取限制 Key
 */
export function getRateLimitKey(request: Request, prefix: string): string {
    // 优先使用 CF-Connecting-IP，其次使用 X-Forwarded-For
    const ip =
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        'unknown';

    return `${prefix}:${ip}`;
}

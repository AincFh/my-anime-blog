/**
 * 速率限制工具
 * 基于 Cloudflare KV 实现
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  keyPrefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * 检查速率限制
 * @param kv Cloudflare KV 命名空间
 * @param identifier 标识符（IP地址、用户ID等）
 * @param config 限制配置
 */
export async function checkRateLimit(
  kv: KVNamespace | null,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // 如果没有 KV，跳过限制（开发环境）
  if (!kv) {
    return { allowed: true, remaining: config.maxRequests, resetAt: Date.now() + config.windowSeconds * 1000 };
  }

  const key = `${config.keyPrefix}:${identifier}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % config.windowSeconds);

  try {
    // 尝试获取当前计数
    const countStr = await kv.get(key);
    let count = countStr ? parseInt(countStr, 10) : 0;

    // 检查是否超过限制
    if (count >= config.maxRequests) {
      const resetAt = (windowStart + config.windowSeconds) * 1000;
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // 增加计数
    count++;
    await kv.put(key, count.toString(), {
      expirationTtl: config.windowSeconds,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - count,
      resetAt: (windowStart + config.windowSeconds) * 1000,
    };
  } catch (error) {
    // KV 错误时允许请求（降级策略）
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: config.maxRequests, resetAt: Date.now() + config.windowSeconds * 1000 };
  }
}

/**
 * 获取客户端 IP 地址
 */
export function getClientIP(request: Request): string {
  // Cloudflare Workers 会在请求头中提供真实 IP
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIP) return cfConnectingIP;

  // 回退到 X-Forwarded-For
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  // 最后回退
  return 'unknown';
}

/**
 * 预定义的速率限制配置
 */
export const RATE_LIMITS = {
  // 发送验证码：1次/60秒, 5次/小时
  SEND_CODE: {
    maxRequests: 1,
    windowSeconds: 60,
    keyPrefix: 'ratelimit:send_code',
  },
  SEND_CODE_HOUR: {
    maxRequests: 5,
    windowSeconds: 3600,
    keyPrefix: 'ratelimit:send_code_hour',
  },
  // 评论：1次/10秒
  COMMENT: {
    maxRequests: 1,
    windowSeconds: 10,
    keyPrefix: 'ratelimit:comment',
  },
  // 登录：5次错误/10分钟
  LOGIN_FAIL: {
    maxRequests: 5,
    windowSeconds: 600,
    keyPrefix: 'ratelimit:login_fail',
  },
} as const;


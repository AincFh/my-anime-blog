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
// 速率限制配置已迁移至 app/config/index.ts
export { RATE_LIMITS } from '~/config';


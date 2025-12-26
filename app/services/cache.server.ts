/**
 * 缓存服务
 * 使用 Cloudflare KV 缓存常用数据减少数据库查询
 */

import type { KVNamespace } from '@cloudflare/workers-types';

interface CacheOptions {
    ttl?: number; // 秒
    staleWhileRevalidate?: number; // 秒
}

const DEFAULT_TTL = 300; // 5 分钟

/**
 * 获取缓存数据，如果不存在则执行 fetcher 并缓存
 */
export async function getWithCache<T>(
    kv: KVNamespace | undefined,
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
): Promise<T> {
    const { ttl = DEFAULT_TTL } = options;

    // 如果 KV 不可用，直接执行 fetcher
    if (!kv) {
        return fetcher();
    }

    try {
        // 尝试从缓存读取
        const cached = await kv.get(key, 'json');
        if (cached) {
            return cached as T;
        }
    } catch (e) {
        console.error('Cache read error:', e);
    }

    // 缓存未命中，执行 fetcher
    const data = await fetcher();

    // 异步写入缓存，不阻塞响应
    if (kv && data) {
        kv.put(key, JSON.stringify(data), { expirationTtl: ttl }).catch(e => {
            console.error('Cache write error:', e);
        });
    }

    return data;
}

/**
 * 使缓存失效
 */
export async function invalidateCache(
    kv: KVNamespace | undefined,
    key: string
): Promise<void> {
    if (!kv) return;

    try {
        await kv.delete(key);
    } catch (e) {
        console.error('Cache invalidation error:', e);
    }
}

/**
 * 批量使缓存失效（按前缀）
 */
export async function invalidateCacheByPrefix(
    kv: KVNamespace | undefined,
    prefix: string
): Promise<void> {
    if (!kv) return;

    try {
        const list = await kv.list({ prefix });
        await Promise.all(list.keys.map(k => kv.delete(k.name)));
    } catch (e) {
        console.error('Cache prefix invalidation error:', e);
    }
}

// 常用缓存 key
export const CacheKeys = {
    MEMBERSHIP_TIERS: 'membership:tiers',
    RECHARGE_PACKAGES: 'recharge:packages',
    SHOP_ITEMS: 'shop:items',
    SYSTEM_CONFIG: 'system:config',
    USER_PROFILE: (userId: number) => `user:${userId}:profile`,
} as const;

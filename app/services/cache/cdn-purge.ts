/**
 * Cloudflare 缓存管理服务
 * 用于清除 CDN 缓存
 */

export interface PurgeCacheResult {
  success: boolean;
  message: string;
  timestamp: string;
  purgedUrls?: number;
}

import { getLogger } from '~/utils/logger';

/**
 * 清除指定 URL 的缓存
 */
export async function purgeCacheForUrls(
  apiToken: string,
  zoneId: string,
  urls: string[]
): Promise<PurgeCacheResult> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: urls
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        message: data.errors?.[0]?.message || "清除缓存失败",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      message: `成功清除 ${urls.length} 个 URL 的缓存`,
      timestamp: new Date().toISOString(),
      purgedUrls: urls.length,
    };
  } catch (error) {
    getLogger().error('Cache purge failed', { error: error instanceof Error ? error.message : String(error) });
    return {
      success: false,
      message: `清除缓存失败: ${String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 清除全站缓存（purge_everything）
 * 谨慎使用，会清除所有静态资源的缓存
 */
export async function purgeAllCache(
  apiToken: string,
  zoneId: string
): Promise<PurgeCacheResult> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purge_everything: true
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        message: data.errors?.[0]?.message || "清除全站缓存失败",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      message: "全站缓存已清除（所有静态资源缓存已失效）",
      timestamp: new Date().toISOString(),
      purgedUrls: -1, // 表示全部清除
    };
  } catch (error) {
    getLogger().error('Full cache purge failed', { error: error instanceof Error ? error.message : String(error) });
    return {
      success: false,
      message: `清除全站缓存失败: ${String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 清除指定主机名的缓存
 */
export async function purgeCacheForHosts(
  apiToken: string,
  zoneId: string,
  hosts: string[]
): Promise<PurgeCacheResult> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hosts: hosts
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        message: data.errors?.[0]?.message || "清除主机缓存失败",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      message: `成功清除 ${hosts.length} 个主机名的缓存`,
      timestamp: new Date().toISOString(),
      purgedUrls: hosts.length,
    };
  } catch (error) {
    getLogger().error('Host cache purge failed', { error: error instanceof Error ? error.message : String(error) });
    return {
      success: false,
      message: `清除主机缓存失败: ${String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 获取缓存分析数据（可选）
 */
export async function getCacheAnalytics(
  apiToken: string,
  zoneId: string
): Promise<{ cached: number; uncached: number } | null> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard?since=-60&until=0`,
      {
        headers: {
          "Authorization": `Bearer ${apiToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      return null;
    }

    const totals = data.result.totals;
    return {
      cached: totals.cachedHits || 0,
      uncached: totals.uncachedHits || 0,
    };
  } catch (error) {
    getLogger().error('Cache analytics failed', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

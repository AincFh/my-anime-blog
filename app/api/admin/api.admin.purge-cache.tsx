import type { ActionFunctionArgs } from "react-router";
import { getSessionId, verifySession } from '~/utils/auth';
import { purgeAllCache, purgeCacheForUrls } from '~/services/cache/cdn-purge';

/**
 * 清除CDN缓存API
 * 功能：调用Cloudflare API清除全站缓存
 * 安全：需要管理员权限
 */
export async function action({ request, context }: ActionFunctionArgs) {
  // 从正确的 cookie 名获取 session
  const sessionId = getSessionId(request);

  // 验证 session（使用 utils/auth 中的统一函数，cookie 名 = "session"）
  const env = context.cloudflare.env as { anime_db?: import('~/services/db.server').Database; CF_API_TOKEN?: string; CF_ZONE_ID?: string };
  const session = sessionId
    ? await verifySession(sessionId, env?.anime_db)
    : null;

  // requireAdmin 等效检查：必须有 session 且是 admin 角色
  if (!session || session.role !== 'admin') {
    return Response.json({ success: false, error: "未授权" }, { status: 401 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const urlsJson = formData.get("urls") as string;

  try {
    // 获取 Cloudflare API 配置
    const apiToken = env.CF_API_TOKEN;
    const zoneId = env.CF_ZONE_ID;

    // 如果没有配置 API Token，返回错误提示
    if (!apiToken || !zoneId) {
      return Response.json({
        success: false,
        error: "Cloudflare API 未配置，请设置 CF_API_TOKEN 和 CF_ZONE_ID 环境变量",
        message: "在生产环境中，需要配置 Cloudflare API Token 才能清除缓存",
      }, { status: 503 });
    }

    if (intent === "purge_all") {
      // 清除全站缓存
      const result = await purgeAllCache(apiToken, zoneId);
      return Response.json({
        success: result.success,
        message: result.message,
        timestamp: result.timestamp,
      });
    }

    if (intent === "purge_urls" && urlsJson) {
      // 清除指定 URL 的缓存
      const urls = JSON.parse(urlsJson) as string[];
      if (!Array.isArray(urls) || urls.length === 0) {
        return Response.json({
          success: false,
          error: "未提供要清除的 URL 列表",
        }, { status: 400 });
      }
      
      const result = await purgeCacheForUrls(apiToken, zoneId, urls);
      return Response.json({
        success: result.success,
        message: result.message,
        timestamp: result.timestamp,
        purgedUrls: result.purgedUrls,
      });
    }

    return Response.json({
      success: false,
      error: "未知操作",
    }, { status: 400 });
  } catch (error) {
    console.error("Failed to purge cache:", error);
    return Response.json({ 
      success: false, 
      error: "清除缓存失败: " + String(error),
      message: "请检查 Cloudflare API 配置是否正确" 
    }, { status: 500 });
  }
}

// GET 请求返回配置状态（不含敏感信息）
export async function loader({ request, context }: LoaderFunctionArgs) {
  const sessionId = getSessionId(request);
  const env = context.cloudflare.env as { anime_db?: import('~/services/db.server').Database; CF_API_TOKEN?: string; CF_ZONE_ID?: string };
  const session = sessionId
    ? await verifySession(sessionId, env?.anime_db)
    : null;

  if (!session || session.role !== 'admin') {
    return Response.json({ configured: false, error: "未授权" }, { status: 401 });
  }

  const apiToken = env.CF_API_TOKEN;
  const zoneId = env.CF_ZONE_ID;

  return Response.json({
    configured: !!(apiToken && zoneId),
    message: apiToken && zoneId 
      ? "Cloudflare API 已配置" 
      : "Cloudflare API 未配置，请设置环境变量",
  });
}

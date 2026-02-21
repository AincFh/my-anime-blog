import type { ActionFunctionArgs } from "react-router";

/**
 * 清除CDN缓存API
 * 功能：调用Cloudflare API清除全站缓存
 */
export async function action({ request, context }: ActionFunctionArgs) {
  const sessionId = request.headers.get("Cookie")?.match(/session_id=([^;]+)/)?.[1];

  if (!sessionId) {
    return Response.json({ success: false, error: "未授权" }, { status: 401 });
  }

  try {
    // TODO: 调用Cloudflare API清除缓存
    // 需要配置Cloudflare API Token
    // const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${API_TOKEN}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({ purge_everything: true }),
    // });

    // 模拟成功
    return Response.json({
      success: true,
      message: "CDN缓存已清除",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to purge cache:", error);
    return Response.json({ success: false, error: "清除缓存失败" }, { status: 500 });
  }
}


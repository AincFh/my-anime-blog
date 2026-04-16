import type { ActionFunctionArgs } from "react-router";

/**
 * 成就解锁API
 * 功能：检查并解锁用户成就
 */
export async function action({ request, context }: ActionFunctionArgs) {
  const { anime_db } = (context as any).cloudflare.env;
  
  // 验证用户会话
  const { getSessionId, verifySession } = await import("~/utils/auth");
  const sessionId = getSessionId(request);
  
  if (!sessionId) {
    return Response.json({ success: false, error: "请先登录" }, { status: 401 });
  }
  
  const session = await verifySession(sessionId, anime_db);
  if (!session.valid || !session.user) {
    return Response.json({ success: false, error: "会话已过期" }, { status: 401 });
  }
  
  const formData = await request.formData();
  const achievementId = formData.get("achievement_id") as string;
  
  // 使用会话中的用户ID，不接受前端传入的user_id
  // 防止越权：用户只能解锁自己的成就
  const userId = session.user.id;

  if (!achievementId) {
    return Response.json({ success: false, error: "参数缺失" }, { status: 400 });
  }

  try {
    // 获取用户当前成就
    const user = await anime_db
      .prepare("SELECT achievements FROM users WHERE id = ?")
      .bind(userId)
      .first();

    if (!user) {
      return Response.json({ success: false, error: "用户不存在" }, { status: 404 });
    }

    // 解析成就数组
    let achievements: string[] = [];
    if (user.achievements) {
      try {
        achievements = JSON.parse(user.achievements);
      } catch (e) {
        console.error("Failed to parse user achievements:", e);
      }
    }

    // 检查是否已拥有
    if (achievements.includes(achievementId)) {
      return Response.json({ success: false, message: "成就已拥有" });
    }

    // 添加新成就
    achievements.push(achievementId);

    // 更新数据库
    await anime_db
      .prepare("UPDATE users SET achievements = ? WHERE id = ?")
      .bind(JSON.stringify(achievements), userId)
      .run();

    return Response.json({ success: true, achievement: achievementId });
  } catch (error) {
    console.error("Achievement unlock error:", error);
    return Response.json({ success: false, error: "解锁失败" }, { status: 500 });
  }
}


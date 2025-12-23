import type { Route } from "./+types/api.achievement";

/**
 * 成就解锁API
 * 功能：检查并解锁用户成就
 */
export async function action({ request, context }: Route.ActionArgs) {
  const { anime_db } = (context as any).cloudflare.env;
  const formData = await request.formData();

  const userId = formData.get("user_id") as string;
  const achievementId = formData.get("achievement_id") as string;

  if (!userId || !achievementId) {
    return Response.json({ success: false, error: "参数缺失" }, { status: 400 });
  }

  try {
    // 获取用户当前成就
    const user = await anime_db
      .prepare("SELECT achievements FROM users WHERE id = ?")
      .bind(parseInt(userId))
      .first<{ achievements: string | null }>();

    if (!user) {
      return Response.json({ success: false, error: "用户不存在" }, { status: 404 });
    }

    // 解析成就数组
    const achievements: string[] = user.achievements ? JSON.parse(user.achievements) : [];

    // 检查是否已拥有
    if (achievements.includes(achievementId)) {
      return Response.json({ success: false, message: "成就已拥有" });
    }

    // 添加新成就
    achievements.push(achievementId);

    // 更新数据库
    await anime_db
      .prepare("UPDATE users SET achievements = ? WHERE id = ?")
      .bind(JSON.stringify(achievements), parseInt(userId))
      .run();

    return Response.json({ success: true, achievement: achievementId });
  } catch (error) {
    console.error("Achievement unlock error:", error);
    return Response.json({ success: false, error: "解锁失败" }, { status: 500 });
  }
}


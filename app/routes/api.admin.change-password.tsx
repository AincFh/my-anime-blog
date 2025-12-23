import type { Route } from "./+types/api.admin.change-password";
import { getSessionId } from "~/utils/auth";

/**
 * 修改后台密码API
 * 功能：验证当前密码并更新为新密码
 */
export async function action({ request, context }: Route.ActionArgs) {
  const sessionId = getSessionId(request);

  if (!sessionId) {
    return Response.json({ success: false, error: "未授权" }, { status: 401 });
  }

  const { anime_db } = (context as any).cloudflare.env;
  const formData = await request.formData();

  const currentPassword = formData.get("current_password") as string;
  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  // 验证输入
  if (!currentPassword || !newPassword || !confirmPassword) {
    return Response.json({ success: false, error: "请填写所有字段" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return Response.json({ success: false, error: "新密码至少需要8位" }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return Response.json({ success: false, error: "两次输入的密码不一致" }, { status: 400 });
  }

  try {
    // 获取当前用户
    const session = await anime_db
      .prepare("SELECT user_id FROM sessions WHERE id = ?")
      .bind(sessionId)
      .first<{ user_id: number }>();

    if (!session) {
      return Response.json({ success: false, error: "会话无效" }, { status: 401 });
    }

    // 验证当前密码
    const user = await anime_db
      .prepare("SELECT password FROM users WHERE id = ?")
      .bind(session.user_id)
      .first<{ password: string }>();

    if (!user || user.password !== currentPassword) {
      // TODO: 实际应该使用bcrypt等哈希算法验证
      return Response.json({ success: false, error: "当前密码错误" }, { status: 400 });
    }

    // 更新密码
    // TODO: 实际应该使用bcrypt等哈希算法加密
    await anime_db
      .prepare("UPDATE users SET password = ? WHERE id = ?")
      .bind(newPassword, session.user_id)
      .run();

    return Response.json({
      success: true,
      message: "密码修改成功，请重新登录"
    });
  } catch (error) {
    console.error("Failed to change password:", error);
    return Response.json({ success: false, error: "修改密码失败" }, { status: 500 });
  }
}


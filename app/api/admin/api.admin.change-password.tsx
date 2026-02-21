import type { ActionFunctionArgs } from "react-router";
import { getSessionId } from "~/utils/auth";

/**
 * 修改后台密码API
 * 功能：验证当前密码并更新为新密码
 */
export async function action({ request, context }: ActionFunctionArgs) {
  const { anime_db } = (context as any).cloudflare.env;

  // 1. 鉴权：仅管理员可用
  const { requireAdmin } = await import("~/utils/auth");
  const session = await requireAdmin(request, anime_db);

  if (!session) {
    return Response.json({ success: false, error: "未授权或权限不足" }, { status: 403 });
  }
  const formData = await request.formData();

  // 2. CSRF 校验
  const env = (context as any).cloudflare.env;
  const { validateCSRFToken } = await import("~/services/security/csrf.server");
  const csrfToken = formData.get("_csrf") as string;
  const secret = env.CSRF_SECRET || env.PAYMENT_SECRET || "default-secret";

  const csrfResult = await validateCSRFToken(csrfToken, session.sessionId, env.CACHE_KV, secret);
  if (!csrfResult.valid) {
    return Response.json({ success: false, error: "CSRF 验证失败" }, { status: 403 });
  }

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
    // 验证当前密码
    const user = await anime_db
      .prepare("SELECT password_hash FROM users WHERE id = ?")
      .bind(session.userId) // requireAdmin 返回的 session 包含 userId
      .first();

    const { verifyPassword, hashPassword } = await import("~/services/crypto.server");

    // 数据库可能存储的是明文(早期数据)或哈希，建议在此处过渡
    // 但为安全起见，这里假设已经是哈希，或者我们强制验证
    // 注意：原代码查的是 password 字段，这里改为 password_hash 以匹配 schema (假设 schema 标准化)
    // 如果数据库字段名确实是 password，请改回。根据 auth.server.ts，字段名是 password_hash

    if (!user || !(await verifyPassword(currentPassword, user.password_hash))) {
      return Response.json({ success: false, error: "当前密码错误" }, { status: 400 });
    }

    // 更新密码为哈希值
    const newPasswordHash = await hashPassword(newPassword);

    await anime_db
      .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
      .bind(newPasswordHash, session.userId)
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


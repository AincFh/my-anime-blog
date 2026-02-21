/**
 * API: 用户注册
 * POST /api/auth/register
 */

import type { Route } from "./+types/api.auth.register";
import { registerUser, loginUser } from "~/services/auth.server";

export async function action({ request, context }: Route.ActionArgs) {
  const env = (context as any).cloudflare.env;
  const anime_db = env?.anime_db;
  const CACHE_KV = env?.CACHE_KV;

  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  // 本地开发模式
  if (!anime_db) {
    return Response.json({ success: false, error: "数据库未配置" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = (formData.get("username") as string) || undefined;

    // 验证输入
    if (!email || !password) {
      return Response.json(
        { success: false, error: "请填写完整信息" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { success: false, error: "密码长度至少6位" },
        { status: 400 }
      );
    }

    // 注册用户（简化版：无需验证码）
    const result = await registerUser(
      email,
      password,
      "", // 占位：后续可添加验证码
      username || "",
      anime_db,
      CACHE_KV
    );

    if (!result.success) {
      return Response.json(result, { status: 400 });
    }

    // 注册成功后自动登录
    const loginResult = await loginUser(email, password, request, anime_db, CACHE_KV);

    if (!loginResult.success || !loginResult.session) {
      return Response.json(
        { success: true, user: result.user, message: "注册成功" },
        { status: 200 }
      );
    }

    // 设置 Cookie（生产环境添加 Secure 标志）
    const isProduction = !request.url.includes('localhost');
    const cookieOptions = `session=${loginResult.session.token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict${isProduction ? '; Secure' : ''}`;

    return Response.json(
      { success: true, user: loginResult.user },
      {
        headers: {
          "Set-Cookie": cookieOptions,
        },
      }
    );
  } catch (error) {
    console.error("Register error:", error);
    return Response.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}

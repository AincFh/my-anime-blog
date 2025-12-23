/**
 * API: 用户登录
 * POST /api/auth/login
 */

import type { Route } from "./+types/api.auth.login";
import { loginUser } from "../services/auth.server";

export async function action({ request, context }: Route.ActionArgs) {
  const env = (context as any).cloudflare.env;
  const anime_db = env?.anime_db;
  const CACHE_KV = env?.CACHE_KV;

  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return Response.json(
        { success: false, error: "请填写邮箱和密码" },
        { status: 400 }
      );
    }

    // 本地开发模式
    if (!anime_db) {
      return Response.json({ success: false, error: "数据库未配置" }, { status: 500 });
    }

    // 登录
    const result = await loginUser(
      email,
      password,
      request,
      anime_db,
      CACHE_KV
    );

    if (!result.success) {
      return Response.json(result, { status: 401 });
    }

    if (!result.session) {
      return Response.json(
        { success: false, error: "登录失败" },
        { status: 500 }
      );
    }

    // 设置 Cookie（生产环境添加 Secure 标志）
    const isProduction = !request.url.includes('localhost');
    const cookieOptions = `session=${result.session.token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict${isProduction ? '; Secure' : ''}`;

    return Response.json(
      { success: true, user: result.user },
      {
        headers: {
          "Set-Cookie": cookieOptions,
        },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}

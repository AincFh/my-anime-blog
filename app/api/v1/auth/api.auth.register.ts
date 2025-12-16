/**
 * API: 用户注册
 * POST /api/auth/register
 */

import type { Route } from "./+types/api.auth.register";
import { json } from "react-router";
import { registerUser } from "../services/auth.server";
import { getSessionToken } from "../services/auth.server";

export async function action({ request, context }: Route.ActionArgs) {
  const { anime_db, CACHE_KV } = context.cloudflare.env;

  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const code = formData.get("code") as string;
    const username = (formData.get("username") as string) || undefined;

    // 验证输入
    if (!email || !password || !code) {
      return json(
        { success: false, error: "请填写完整信息" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return json(
        { success: false, error: "密码长度至少6位" },
        { status: 400 }
      );
    }

    // 注册用户
    const result = await registerUser(
      email,
      password,
      code,
      username,
      anime_db,
      CACHE_KV as KVNamespace | null
    );

    if (!result.success) {
      return json(result, { status: 400 });
    }

    // 注册成功后自动登录
    const loginResult = await import("../services/auth.server").then((m) =>
      m.loginUser(email, password, request, anime_db, CACHE_KV as KVNamespace | null)
    );

    if (!loginResult.success || !loginResult.session) {
      return json(
        { success: true, user: result.user, message: "注册成功，但自动登录失败" },
        { status: 200 }
      );
    }

    // 设置 Cookie
    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `session=${loginResult.session.token}; HttpOnly; Path=/; Max-Age=${
        7 * 24 * 60 * 60
      }; SameSite=Lax`
    );

    return json(
      { success: true, user: loginResult.user },
      { headers }
    );
  } catch (error) {
    console.error("Register error:", error);
    return json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}


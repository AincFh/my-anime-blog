/**
 * API: 用户登录
 * POST /api/auth/login
 */

import type { Route } from "./+types/api.auth.login";
import { json } from "react-router";
import { loginUser } from "../services/auth.server";

export async function action({ request, context }: Route.ActionArgs) {
  const { anime_db, CACHE_KV } = context.cloudflare.env;

  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return json(
        { success: false, error: "请填写邮箱和密码" },
        { status: 400 }
      );
    }

    // 登录
    const result = await loginUser(
      email,
      password,
      request,
      anime_db,
      CACHE_KV as KVNamespace | null
    );

    if (!result.success) {
      return json(result, { status: 401 });
    }

    if (!result.session) {
      return json(
        { success: false, error: "登录失败" },
        { status: 500 }
      );
    }

    // 设置 Cookie
    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `session=${result.session.token}; HttpOnly; Path=/; Max-Age=${
        7 * 24 * 60 * 60
      }; SameSite=Lax`
    );

    return json(
      { success: true, user: result.user },
      { headers }
    );
  } catch (error) {
    console.error("Login error:", error);
    return json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}


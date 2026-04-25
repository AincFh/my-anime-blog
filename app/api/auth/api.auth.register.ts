/**
 * API: 用户注册
 * POST /api/auth/register
 */

import type { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { registerUser, loginUser } from "~/services/auth.server";
import { getLogger } from "~/utils/logger";

const RegisterSchema = z.object({
    email: z.string().email("无效的邮箱地址"),
    password: z.string()
        .min(8, "密码至少8个字符")
        .max(128, "密码最多128个字符"),
    code: z.string().length(6, "验证码必须为6位"),
    username: z.string().max(50, "用户名最多50个字符").optional(),
});

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env as { CACHE_KV?: import('@cloudflare/workers-types').KVNamespace; anime_db?: import('~/services/db.server').Database };
  const anime_db = env?.anime_db;
  const CACHE_KV = env?.CACHE_KV ?? null;

  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  if (!anime_db) {
    return Response.json({ success: false, error: "数据库未配置" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const raw = {
      email: (formData.get("email") as string)?.trim(),
      password: (formData.get("password") as string)?.trim(),
      code: (formData.get("code") as string)?.trim(),
      username: (formData.get("username") as string)?.trim() || undefined,
    };

    const parsed = RegisterSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      return Response.json(
        { success: false, error: firstError || "输入格式错误" },
        { status: 400 }
      );
    }

    const { email, password, code, username } = parsed.data;

    const result = await registerUser(
      email,
      password,
      code,
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
    getLogger().error('Register failed', { error: error instanceof Error ? error.message : String(error) });
    return Response.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}

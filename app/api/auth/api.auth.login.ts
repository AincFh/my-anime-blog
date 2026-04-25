/**
 * API: 用户登录
 * POST /api/auth/login
 */

import type { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { loginUser } from "~/services/auth.server";
import { getLogger } from "~/utils/logger";

const LoginSchema = z.object({
    email: z.string().email("无效的邮箱地址"),
    password: z.string().min(1, "密码不能为空"),
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
        };

        const parsed = LoginSchema.safeParse(raw);
        if (!parsed.success) {
            const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
            return Response.json(
                { success: false, error: firstError || "输入格式错误" },
                { status: 400 }
            );
        }

        const { email, password } = parsed.data;

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
    getLogger().error('Login failed', { error: error instanceof Error ? error.message : String(error) });
    return Response.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}

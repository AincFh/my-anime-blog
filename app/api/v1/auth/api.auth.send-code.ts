/**
 * API: 发送验证码
 * POST /api/auth/send-code
 */

import type { Route } from "./+types/api.auth.send-code";
import { json } from "react-router";
import { sendVerificationCode } from "../services/auth.server";
import { getClientIP } from "../services/ratelimit";

export async function action({ request, context }: Route.ActionArgs) {
  const { anime_db, CACHE_KV } = context.cloudflare.env;

  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;

    if (!email || !email.includes("@")) {
      return json({ success: false, error: "无效的邮箱地址" }, { status: 400 });
    }

    // 发送验证码
    const result = await sendVerificationCode(
      email,
      request,
      CACHE_KV as KVNamespace | null,
      true // 使用 MailChannels
    );

    if (!result.success) {
      return json(result, { status: 400 });
    }

    return json({ success: true, message: "验证码已发送" });
  } catch (error) {
    console.error("Send code error:", error);
    return json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}


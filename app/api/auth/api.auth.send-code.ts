/**
 * API: 发送验证码
 * POST /api/auth/send-code
 */

import type { Route } from "./+types/api.auth.send-code";
import { sendVerificationCode } from "~/services/auth.server";

export async function action({ request, context }: Route.ActionArgs) {
  const env = (context as any).cloudflare.env;
  const CACHE_KV = env?.CACHE_KV;

  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;

    if (!email || !email.includes("@")) {
      return Response.json({ success: false, error: "无效的邮箱地址" }, { status: 400 });
    }

    // 发送验证码
    const result = await sendVerificationCode(
      email,
      request,
      CACHE_KV,
      true // 使用 MailChannels
    );

    if (!result.success) {
      return Response.json(result, { status: 400 });
    }

    return Response.json({ success: true, message: "验证码已发送" });
  } catch (error) {
    console.error("Send code error:", error);
    return Response.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}

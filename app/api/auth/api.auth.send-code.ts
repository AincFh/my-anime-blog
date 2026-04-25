/**
 * API: 发送验证码
 * POST /api/auth/send-code
 */

import type { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { sendVerificationCode } from "~/services/auth.server";
import { getLogger } from "~/utils/logger";

const SendCodeSchema = z.object({
    email: z.string().email("无效的邮箱地址"),
});

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env as { CACHE_KV?: import('@cloudflare/workers-types').KVNamespace; anime_db?: import('~/services/db.server').Database };
  const CACHE_KV = env?.CACHE_KV ?? null;

  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const raw = { email: (formData.get("email") as string)?.trim() };

    const parsed = SendCodeSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ success: false, error: "无效的邮箱地址" }, { status: 400 });
    }

    const { email } = parsed.data;

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
    getLogger().error('Send code failed', { error: error instanceof Error ? error.message : String(error) });
    return Response.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}

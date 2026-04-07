/**
 * API: 重置密码
 * POST /api/auth/reset-password
 */

import type { Route } from "./+types/api.auth.reset-password";
import { z } from "zod";
import { hashPassword } from "~/services/auth.server";

const ResetPasswordSchema = z.object({
    email: z.string().email("无效的邮箱地址"),
    code: z.string().min(6, "验证码至少6位").max(6, "验证码最多6位"),
    password: z.string()
        .min(8, "密码至少8个字符")
        .max(128, "密码最多128个字符")
        .regex(/[A-Z]/, "密码必须包含大写字母")
        .regex(/[a-z]/, "密码必须包含小写字母")
        .regex(/[0-9]/, "密码必须包含数字"),
});

export async function action({ request, context }: Route.ActionArgs) {
    const env = (context as any).cloudflare.env;
    const { anime_db, CACHE_KV } = env;

    if (request.method !== "POST") {
        return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
    }

    // 解析请求体
    let body: { email?: string; code?: string; password?: string };
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        body = await request.json();
    } else {
        const formData = await request.formData();
        body = {
            email: formData.get("email") as string,
            code: formData.get("code") as string,
            password: formData.get("password") as string,
        };
    }

    // 验证输入
    const parsed = ResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
        return Response.json(
            { success: false, error: parsed.error.errors[0].message },
            { status: 400 }
        );
    }

    const { email, code, password } = parsed.data;

    // 验证验证码
    if (!CACHE_KV) {
        return Response.json(
            { success: false, error: "服务暂时不可用" },
            { status: 503 }
        );
    }

    const codeKey = `verify_code:${email}`;
    const storedCode = await CACHE_KV.get(codeKey);
    const codeData = storedCode ? JSON.parse(storedCode) : null;

    // 检查验证码是否正确
    if (!codeData || codeData.code !== code) {
        return Response.json(
            { success: false, error: "验证码错误或已过期" },
            { status: 400 }
        );
    }

    // 检查验证码类型是否为密码重置
    if (codeData.type !== "reset_password") {
        return Response.json(
            { success: false, error: "验证码类型不匹配，请重新获取" },
            { status: 400 }
        );
    }

    // 检查验证码是否过期（15分钟）
    const now = Date.now();
    if (now - codeData.createdAt > 15 * 60 * 1000) {
        await CACHE_KV.delete(codeKey);
        return Response.json(
            { success: false, error: "验证码已过期，请重新获取" },
            { status: 400 }
        );
    }

    // 查找用户
    const user = await anime_db
        .prepare("SELECT id FROM users WHERE email = ?")
        .bind(email)
        .first();

    if (!user) {
        // 为防止邮箱枚举攻击，不明确提示用户不存在
        return Response.json(
            { success: false, error: "验证码错误或已过期" },
            { status: 400 }
        );
    }

    // 更新密码
    const hashedPassword = await hashPassword(password);
    await anime_db
        .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
        .bind(hashedPassword, (user as any).id)
        .run();

    // 删除已使用的验证码
    await CACHE_KV.delete(codeKey);

    // 记录审计日志
    try {
        const { logAudit } = await import("~/services/security/audit-log.server");
        await logAudit(anime_db, {
            userId: (user as any).id,
            action: "password_reset",
            metadata: { email },
            riskLevel: "medium",
        });
    } catch (e) {
        console.error("审计日志记录失败:", e);
    }

    return Response.json({
        success: true,
        message: "密码重置成功",
    });
}

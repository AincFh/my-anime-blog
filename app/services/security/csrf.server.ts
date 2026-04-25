import { generateCSRFToken as generateSignedToken, verifyCSRFToken as verifySignedToken } from "~/utils/security";
import type { KVNamespace } from "@cloudflare/workers-types";

/**
 * CSRF 安全服务 - 为 Admin 后台提供强化的安全校验
 * 桥接了底层的签名逻辑，并对齐了 Admin 页面的函数签名
 */

/**
 * 生成 CSRF Token
 * @param sessionId 会话ID
 * @param _kv KV命名空间 (保留接口，目前使用无状态签名)
 * @param secret 签名密钥
 */
export async function generateCSRFToken(
    sessionId: string,
    _kv: KVNamespace | null | undefined,
    secret: string
): Promise<string> {
    return await generateSignedToken(sessionId, secret);
}

/**
 * 验证 CSRF Token
 * @param token 待验证的Token
 * @param sessionId 会话ID
 * @param _kv KV命名空间 (保留接口)
 * @param secret 签名密钥
 */
export async function validateCSRFToken(
    token: string,
    sessionId: string,
    _kv: KVNamespace | null | undefined,
    secret: string
): Promise<{ valid: boolean; error?: string }> {
    if (!token) {
        return { valid: false, error: "CSRF Token 缺失" };
    }

    const isValid = await verifySignedToken(token, sessionId, secret);

    if (!isValid) {
        return { valid: false, error: "CSRF 校验失败或 Token 已过期" };
    }

    return { valid: true };
}

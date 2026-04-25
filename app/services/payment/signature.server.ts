/**
 * 支付签名服务
 * 生成安全的支付回调 URL 和验证支付回调签名
 */

import { generatePaymentSign } from "~/services/security/payment-sign.server";

/**
 * 生成安全的支付 URL（含 HMAC 签名）
 * 用于客户端跳转支付或模拟支付完成
 */
export async function generateSecurePayUrl(
    path: string,
    orderNo: string,
    amount: number,
    userId: number,
    secret: string
): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomUUID().replace(/-/g, "");

    const params: Record<string, string | number> = {
        order_no: orderNo,
        amount,
        user_id: userId,
        timestamp,
        nonce,
    };

    const sign = await generatePaymentSign(params, secret);

    const url = new URL(path, "https://anime.dog");
    url.searchParams.set("order_no", orderNo);
    url.searchParams.set("amount", String(amount));
    url.searchParams.set("user_id", String(userId));
    url.searchParams.set("timestamp", String(timestamp));
    url.searchParams.set("nonce", nonce);
    url.searchParams.set("sign", sign);

    return url.toString();
}

/**
 * 验证支付回调签名
 */
export async function verifyCallbackSignature(
    params: Record<string, string | number>,
    signature: string,
    secret: string
): Promise<boolean> {
    const expectedSign = (await generatePaymentSign(params, secret)).toLowerCase();
    const actualSign = signature.toLowerCase();

    if (expectedSign.length !== actualSign.length) return false;

    let mismatch = 0;
    for (let i = 0; i < expectedSign.length; i++) {
        mismatch |= expectedSign.charCodeAt(i) ^ actualSign.charCodeAt(i);
    }
    return mismatch === 0;
}

/**
 * 验证回调来源 IP 是否在白名单中
 * 生产环境严格校验，开发环境允许任意 IP
 */
export function isCallbackIPAllowed(
    clientIP: string | null,
    allowedIPs: string[] | undefined,
    isDevelopment: boolean
): boolean {
    if (isDevelopment) return true;

    if (!allowedIPs || allowedIPs.length === 0) {
        return false;
    }

    if (!clientIP) return false;

    return allowedIPs.includes(clientIP);
}

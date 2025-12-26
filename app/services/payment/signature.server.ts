/**
 * 支付签名工具
 * 用于生成和验证支付请求的 HMAC-SHA256 签名
 */

const PAYMENT_SECRET = "AINCFH_PAYMENT_SECRET_2024"; // 生产环境应使用环境变量
const SIGNATURE_EXPIRY_MS = 10 * 60 * 1000; // 10 分钟

/**
 * 生成支付签名
 */
export async function generatePaymentSignature(
    orderNo: string,
    amount: number,
    userId: number
): Promise<{ nonce: string; timestamp: number; signature: string }> {
    const nonce = crypto.randomUUID();
    const timestamp = Date.now();
    const message = `${orderNo}:${amount}:${userId}:${nonce}:${timestamp}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(PAYMENT_SECRET);
    const messageData = encoder.encode(message);

    const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageData);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return { nonce, timestamp, signature };
}

/**
 * 验证支付签名
 */
export async function verifyPaymentSignature(
    orderNo: string,
    amount: number,
    userId: number,
    nonce: string,
    timestamp: number,
    signature: string
): Promise<{ valid: boolean; error?: string }> {
    // 检查时间戳是否过期
    const now = Date.now();
    if (now - timestamp > SIGNATURE_EXPIRY_MS) {
        return { valid: false, error: "签名已过期" };
    }

    // 重新生成签名并比对
    const message = `${orderNo}:${amount}:${userId}:${nonce}:${timestamp}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(PAYMENT_SECRET);
    const messageData = encoder.encode(message);

    const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const expectedBuffer = await crypto.subtle.sign("HMAC", key, messageData);
    const expectedArray = Array.from(new Uint8Array(expectedBuffer));
    const expectedSignature = expectedArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (signature !== expectedSignature) {
        return { valid: false, error: "签名验证失败" };
    }

    return { valid: true };
}

/**
 * 生成带签名的支付 URL
 */
export async function generateSecurePayUrl(
    baseUrl: string,
    orderNo: string,
    amount: number,
    userId: number
): Promise<string> {
    const { nonce, timestamp, signature } = await generatePaymentSignature(orderNo, amount, userId);
    const url = new URL(baseUrl, "https://placeholder.com");
    url.searchParams.set("orderNo", orderNo);
    url.searchParams.set("nonce", nonce);
    url.searchParams.set("ts", timestamp.toString());
    url.searchParams.set("sig", signature);
    return url.pathname + url.search;
}

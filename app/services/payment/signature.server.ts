/**
 * 支付签名工具
 * 用于生成和验证支付请求的 HMAC-SHA256 签名
 * 
 * ⚠️ 安全提醒：密钥必须从环境变量传入，禁止硬编码
 */

const SIGNATURE_EXPIRY_MS = 10 * 60 * 1000; // 10 分钟

/**
 * 生成 HMAC-SHA256 签名
 */
async function hmacSign(message: string, secretKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
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
    return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 生成支付签名
 * @param secretKey - 从环境变量传入的密钥
 */
export async function generatePaymentSignature(
    orderNo: string,
    amount: number,
    userId: number,
    secretKey: string
): Promise<{ nonce: string; timestamp: number; signature: string }> {
    if (!secretKey || secretKey.includes('REPLACE_WITH')) {
        throw new Error('支付密钥未正确配置');
    }

    const nonce = crypto.randomUUID();
    const timestamp = Date.now();
    const message = `${orderNo}:${amount}:${userId}:${nonce}:${timestamp}`;
    const signature = await hmacSign(message, secretKey);

    return { nonce, timestamp, signature };
}

/**
 * 验证支付签名
 * @param secretKey - 从环境变量传入的密钥
 */
export async function verifyPaymentSignature(
    orderNo: string,
    amount: number,
    userId: number,
    nonce: string,
    timestamp: number,
    signature: string,
    secretKey: string
): Promise<{ valid: boolean; error?: string }> {
    // 检查时间戳是否过期
    const now = Date.now();
    if (now - timestamp > SIGNATURE_EXPIRY_MS) {
        return { valid: false, error: "签名已过期" };
    }

    // 重新生成签名并比对
    const message = `${orderNo}:${amount}:${userId}:${nonce}:${timestamp}`;
    const expectedSignature = await hmacSign(message, secretKey);

    // 使用时间恒定比较防止时序攻击
    if (signature.length !== expectedSignature.length) {
        return { valid: false, error: "签名验证失败" };
    }

    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
        mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    if (mismatch !== 0) {
        return { valid: false, error: "签名验证失败" };
    }

    return { valid: true };
}

/**
 * 验证回调签名（用于支付回调接口）
 * @param params - 回调参数对象
 * @param sign - 传入的签名
 * @param secretKey - 从环境变量传入的密钥
 */
export async function verifyCallbackSignature(
    params: Record<string, string | number>,
    sign: string,
    secretKey: string
): Promise<{ valid: boolean; error?: string }> {
    if (!secretKey || secretKey.includes('REPLACE_WITH')) {
        console.error('支付密钥未正确配置');
        return { valid: false, error: '服务配置错误' };
    }

    // 按字母顺序排序参数，排除 sign 字段
    const sortedKeys = Object.keys(params).filter(k => k !== 'sign').sort();
    const signString = sortedKeys
        .filter(key => params[key] !== '' && params[key] !== undefined)
        .map(key => `${key}=${params[key]}`)
        .join('&');

    const expectedSignature = await hmacSign(signString, secretKey);

    // 时间恒定比较
    if (sign.length !== expectedSignature.length) {
        return { valid: false, error: "签名验证失败" };
    }

    let mismatch = 0;
    for (let i = 0; i < sign.length; i++) {
        mismatch |= sign.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    if (mismatch !== 0) {
        return { valid: false, error: "签名验证失败" };
    }

    return { valid: true };
}

/**
 * 验证回调 IP 是否在白名单内
 */
export function isCallbackIPAllowed(
    ip: string,
    allowedIPs: string,
    isDevelopment: boolean
): boolean {
    // 开发环境跳过 IP 验证
    if (isDevelopment) {
        return true;
    }

    // 未配置白名单则放行（但会记录警告）
    if (!allowedIPs || allowedIPs.trim() === '') {
        console.warn('支付回调 IP 白名单未配置，建议生产环境配置');
        return true;
    }

    const ipList = allowedIPs.split(',').map(s => s.trim()).filter(Boolean);
    return ipList.includes(ip);
}

/**
 * 生成带签名的支付 URL
 * @param secretKey - 从环境变量传入的密钥
 */
export async function generateSecurePayUrl(
    baseUrl: string,
    orderNo: string,
    amount: number,
    userId: number,
    secretKey: string
): Promise<string> {
    const { nonce, timestamp, signature } = await generatePaymentSignature(orderNo, amount, userId, secretKey);
    const url = new URL(baseUrl, "https://placeholder.com");
    url.searchParams.set("orderNo", orderNo);
    url.searchParams.set("nonce", nonce);
    url.searchParams.set("ts", timestamp.toString());
    url.searchParams.set("sig", signature);
    return url.pathname + url.search;
}

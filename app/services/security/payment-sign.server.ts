/**
 * 支付签名服务
 * 用于生成和验证支付请求/回调签名
 */

/**
 * 生成签名
 * 使用 HMAC-SHA256
 */
export async function generatePaymentSign(
    params: Record<string, string | number>,
    secretKey: string
): Promise<string> {
    // 按字母顺序排序参数
    const sortedKeys = Object.keys(params).sort();
    const signString = sortedKeys
        .filter(key => params[key] !== '' && params[key] !== undefined && key !== 'sign')
        .map(key => `${key}=${params[key]}`)
        .join('&');

    // HMAC-SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secretKey),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(signString)
    );

    // 转换为十六进制
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * 验证签名 (P1 安全加固: 防御时序攻击)
 */
export async function verifyPaymentSign(
    params: Record<string, string | number>,
    sign: string,
    secretKey: string
): Promise<boolean> {
    const expectedSign = (await generatePaymentSign(params, secretKey)).toLowerCase();
    const actualSign = sign.toLowerCase();

    if (expectedSign.length !== actualSign.length) return false;

    // 使用恒定时间比较，防止通过响应时间差异探测签名位数
    let mismatch = 0;
    for (let i = 0; i < expectedSign.length; i++) {
        mismatch |= expectedSign.charCodeAt(i) ^ actualSign.charCodeAt(i);
    }
    return mismatch === 0;
}

/**
 * 生成订单号
 * 格式: ORD + 年月日时分秒 + 6位高强度随机数 (CSPRNG)
 */
export function generateOrderNo(): string {
    const now = new Date();
    const datePart = now.toISOString().replace(/[-T:Z.]/g, '').slice(0, 14);
    
    const randomBytes = new Uint8Array(4);
    crypto.getRandomValues(randomBytes);
    const randomPart = Array.from(randomBytes)
        .map(b => b.toString(36))
        .join('')
        .substring(0, 6)
        .toUpperCase();
        
    return `ORD${datePart}${randomPart}`;
}

/**
 * 生成 Nonce（防重放）
 */
export function generateNonce(): string {
    return crypto.randomUUID().replace(/-/g, '');
}

/**
 * 验证时间戳（防重放，5分钟有效）
 */
export function validateTimestamp(
    timestamp: number | string,
    maxAgeSeconds: number = 300
): boolean {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    const now = Math.floor(Date.now() / 1000);
    return Math.abs(now - ts) <= maxAgeSeconds;
}

/**
 * 验证 Nonce（防重放）
 */
export async function validateNonce(
    nonce: string,
    kv: KVNamespace | null,
    expirationSeconds: number = 300
): Promise<boolean> {
    if (!kv) return true; // 开发环境跳过

    const key = `nonce:${nonce}`;
    const existing = await kv.get(key);

    if (existing) {
        // Nonce 已使用
        return false;
    }

    // 标记 Nonce 已使用
    await kv.put(key, '1', { expirationTtl: expirationSeconds });
    return true;
}

/**
 * 验证金额（必须与订单金额一致）
 */
export function validateAmount(
    paidAmount: number,
    orderAmount: number,
    tolerance: number = 0
): boolean {
    return Math.abs(paidAmount - orderAmount) <= tolerance;
}

/**
 * 安全的金额格式化（分转元）
 */
export function formatAmount(amountInCents: number): string {
    return (amountInCents / 100).toFixed(2);
}

/**
 * 安全的金额解析（元转分）
 */
export function parseAmount(amountInYuan: string | number): number {
    const yuan = typeof amountInYuan === 'string'
        ? parseFloat(amountInYuan)
        : amountInYuan;
    return Math.round(yuan * 100);
}

/**
 * 验证模拟支付完成签名（返回 { valid: boolean; reason?: string }）
 */
export async function verifyPaymentSignature(
    orderNo: string,
    amount: number,
    userId: number,
    nonce: string,
    timestamp: number,
    signature: string,
    secret: string
): Promise<{ valid: boolean; reason?: string }> {
    if (Math.abs(Date.now() / 1000 - timestamp) > 300) {
        return { valid: false, reason: "签名已过期" };
    }

    const params: Record<string, string | number> = {
        order_no: orderNo,
        amount,
        user_id: userId,
        nonce,
        timestamp,
    };

    const expectedSign = (await generatePaymentSign(params, secret)).toLowerCase();
    const actualSign = signature.toLowerCase();

    if (expectedSign.length !== actualSign.length) return { valid: false, reason: "签名长度不匹配" };

    let mismatch = 0;
    for (let i = 0; i < expectedSign.length; i++) {
        mismatch |= expectedSign.charCodeAt(i) ^ actualSign.charCodeAt(i);
    }

    if (mismatch !== 0) return { valid: false, reason: "签名验证失败" };

    return { valid: true };
}

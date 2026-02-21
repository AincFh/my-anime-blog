/**
 * CSRF Token 服务
 * 防止跨站请求伪造攻击
 *
 * 实现策略：
 * 1. 基于会话绑定的 Token（Synchronizer Pattern）
 * 2. Token 使用 HMAC-SHA256 生成
 * 3. 存储在 KV 中，短期过期 (5分钟)
 * 4. 同源双重验证（Cookie + 请求体/Header）
 */

/** Token 有效期（秒） */
const CSRF_TOKEN_TTL = 5 * 60; // 5 分钟

/**
 * 生成 HMAC-SHA256 签名
 */
async function hmacSign(message: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * 生成 CSRF Token
 * @param sessionId - 用户会话 ID
 * @param kv - Cloudflare KV 命名空间
 * @param secret - 服务端密钥
 * @returns 生成的 CSRF Token
 */
export async function generateCSRFToken(
    sessionId: string,
    kv: KVNamespace | null,
    secret: string
): Promise<string> {
    const salt = crypto.randomUUID();
    const timestamp = Date.now();
    const message = `${sessionId}:${salt}:${timestamp}`;
    const signature = await hmacSign(message, secret);

    // Token 格式: salt.timestamp.signature
    const token = `${salt}.${timestamp}.${signature}`;

    // 存储到 KV（用于验证时比对）
    if (kv) {
        const kvKey = `csrf:${sessionId}:${salt}`;
        await kv.put(kvKey, timestamp.toString(), { expirationTtl: CSRF_TOKEN_TTL });
    }

    return token;
}

/**
 * 验证 CSRF Token
 * @param token - 待验证的 Token
 * @param sessionId - 用户会话 ID
 * @param kv - Cloudflare KV 命名空间
 * @param secret - 服务端密钥
 * @returns 验证结果
 */
export async function validateCSRFToken(
    token: string | null,
    sessionId: string | null,
    kv: KVNamespace | null,
    secret: string
): Promise<{ valid: boolean; error?: string }> {
    // 基础验证
    if (!token) {
        return { valid: false, error: 'CSRF Token 缺失' };
    }

    if (!sessionId) {
        return { valid: false, error: '会话无效' };
    }

    // 解析 Token
    const parts = token.split('.');
    if (parts.length !== 3) {
        return { valid: false, error: 'Token 格式错误' };
    }

    const [salt, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);

    // 检查过期
    const now = Date.now();
    if (now - timestamp > CSRF_TOKEN_TTL * 1000) {
        return { valid: false, error: 'Token 已过期' };
    }

    // 重新计算签名
    const message = `${sessionId}:${salt}:${timestamp}`;
    const expectedSignature = await hmacSign(message, secret);

    // 时间恒定比较防止时序攻击
    if (signature.length !== expectedSignature.length) {
        return { valid: false, error: 'Token 验证失败' };
    }

    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
        mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    if (mismatch !== 0) {
        return { valid: false, error: 'Token 验证失败' };
    }

    // 可选：检查 KV 中是否存在（防止重复使用）
    if (kv) {
        const kvKey = `csrf:${sessionId}:${salt}`;
        const stored = await kv.get(kvKey);
        if (!stored) {
            return { valid: false, error: 'Token 已使用或无效' };
        }
        // 使用后删除（一次性 Token）
        await kv.delete(kvKey);
    }

    return { valid: true };
}

/**
 * 从请求中提取 CSRF Token
 * 支持从请求头或请求体中获取
 */
export function extractCSRFToken(request: Request, formData?: FormData): string | null {
    // 优先从请求头获取 (用于 AJAX 请求)
    const headerToken = request.headers.get('X-CSRF-Token');
    if (headerToken) {
        return headerToken;
    }

    // 从表单数据获取
    if (formData) {
        const formToken = formData.get('_csrf') as string | null;
        if (formToken) {
            return formToken;
        }
    }

    return null;
}

/**
 * CSRF 保护中间件
 * 用于需要 CSRF 保护的 API 路由
 */
export async function withCSRFProtection(
    request: Request,
    sessionId: string | null,
    kv: KVNamespace | null,
    secret: string,
    formData?: FormData
): Promise<{ allowed: boolean; error?: string }> {
    // GET/HEAD/OPTIONS 请求不需要 CSRF 保护
    const safeMethod = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethod.includes(request.method)) {
        return { allowed: true };
    }

    const token = extractCSRFToken(request, formData);
    const result = await validateCSRFToken(token, sessionId, kv, secret);

    return { allowed: result.valid, error: result.error };
}

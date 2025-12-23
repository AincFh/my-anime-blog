/**
 * TOTP 双因素认证服务
 * 使用 Web Crypto API 实现，兼容 Cloudflare Workers
 */

// Base32 字符集
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * 生成 TOTP 密钥
 */
export function generateTOTPSecret(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    let secret = '';
    for (let i = 0; i < bytes.length; i++) {
        secret += BASE32_CHARS[bytes[i] % 32];
    }
    return secret;
}

/**
 * 生成恢复码（8个8位码）
 */
export function generateRecoveryCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
        const bytes = crypto.getRandomValues(new Uint8Array(4));
        const code = Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
        codes.push(code);
    }
    return codes;
}

/**
 * Base32 解码
 */
function base32Decode(encoded: string): Uint8Array {
    const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
    const bytes: number[] = [];
    let bits = 0;
    let value = 0;

    for (const char of cleaned) {
        const index = BASE32_CHARS.indexOf(char);
        if (index === -1) continue;

        value = (value << 5) | index;
        bits += 5;

        if (bits >= 8) {
            bits -= 8;
            bytes.push((value >> bits) & 0xff);
        }
    }

    return new Uint8Array(bytes);
}

/**
 * HMAC-SHA1 计算
 */
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
    return new Uint8Array(signature);
}

/**
 * 生成 TOTP 码
 */
export async function generateTOTP(
    secret: string,
    timeStep: number = 30,
    digits: number = 6
): Promise<string> {
    const key = base32Decode(secret);
    const time = Math.floor(Date.now() / 1000 / timeStep);

    // 将时间转换为 8 字节大端序
    const timeBytes = new Uint8Array(8);
    let remaining = time;
    for (let i = 7; i >= 0; i--) {
        timeBytes[i] = remaining & 0xff;
        remaining = Math.floor(remaining / 256);
    }

    const hmac = await hmacSha1(key, timeBytes);

    // 动态截断
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);

    const otp = code % Math.pow(10, digits);
    return otp.toString().padStart(digits, '0');
}

/**
 * 验证 TOTP 码（允许前后一个时间窗口）
 */
export async function verifyTOTP(
    secret: string,
    token: string,
    timeStep: number = 30,
    window: number = 1
): Promise<boolean> {
    if (!token || !/^\d{6}$/.test(token)) {
        return false;
    }

    for (let i = -window; i <= window; i++) {
        const time = Math.floor(Date.now() / 1000 / timeStep) + i;

        // 将时间转换为 8 字节大端序
        const timeBytes = new Uint8Array(8);
        let remaining = time;
        for (let j = 7; j >= 0; j--) {
            timeBytes[j] = remaining & 0xff;
            remaining = Math.floor(remaining / 256);
        }

        const key = base32Decode(secret);
        const hmac = await hmacSha1(key, timeBytes);

        const offset = hmac[hmac.length - 1] & 0x0f;
        const code =
            ((hmac[offset] & 0x7f) << 24) |
            ((hmac[offset + 1] & 0xff) << 16) |
            ((hmac[offset + 2] & 0xff) << 8) |
            (hmac[offset + 3] & 0xff);

        const otp = (code % 1000000).toString().padStart(6, '0');

        if (otp === token) {
            return true;
        }
    }

    return false;
}

/**
 * 生成 TOTP URI（用于二维码）
 */
export function generateTOTPUri(
    secret: string,
    email: string,
    issuer: string = 'MyAnimeBlog'
): string {
    const encodedEmail = encodeURIComponent(email);
    const encodedIssuer = encodeURIComponent(issuer);
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * 验证恢复码
 */
export function verifyRecoveryCode(
    code: string,
    storedCodes: string[]
): { valid: boolean; remainingCodes: string[] } {
    const normalizedCode = code.toUpperCase().replace(/[^A-F0-9]/g, '');
    const index = storedCodes.findIndex(c => c === normalizedCode);

    if (index === -1) {
        return { valid: false, remainingCodes: storedCodes };
    }

    // 移除已使用的恢复码
    const remainingCodes = [...storedCodes];
    remainingCodes.splice(index, 1);

    return { valid: true, remainingCodes };
}

/**
 * 加密敏感数据（用于存储 TOTP 密钥）
 */
export async function encryptSensitiveData(
    data: string,
    encryptionKey: string
): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const keyBytes = encoder.encode(encryptionKey.padEnd(32, '0').slice(0, 32));

    const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBytes
    );

    // 拼接 IV 和密文
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...result));
}

/**
 * 解密敏感数据
 */
export async function decryptSensitiveData(
    encryptedData: string,
    encryptionKey: string
): Promise<string | null> {
    try {
        const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
        const iv = data.slice(0, 12);
        const ciphertext = data.slice(12);

        const keyBytes = new TextEncoder().encode(encryptionKey.padEnd(32, '0').slice(0, 32));
        const key = await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    } catch {
        return null;
    }
}

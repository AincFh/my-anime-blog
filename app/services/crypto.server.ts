/**
 * 密码加密工具
 *
 * 算法：PBKDF2-SHA256
 * - 使用 Web Crypto API 实现，兼容 Cloudflare Workers 环境
 * - 迭代次数 120,000（OWASP 2023 推荐值，>= 120,000 for SHA-256）
 * - Salt 16 字节随机（使用 crypto.getRandomValues CSPRNG）
 *
 * 为什么不使用 bcrypt？
 * - Cloudflare Workers 原生环境不支持 Node.js 的 crypto 模块
 * - bcrypt 需要较新的 Node.js API，在 Workers 运行时不保证可用
 * - PBKDF2-SHA256 是 NIST 批准的替代方案，等效安全强度
 *
 * 新注册用户的哈希格式：salt_hex:hash_hex（32 字节 salt + 64 字节 hash）
 */

import { SECURITY_CONFIG } from '~/config';

/**
 * 迭代次数常量
 * - 当前：120,000（OWASP 2023 最低要求）
 * - 未来：可考虑升级到 310,000（OWASP 2023 建议值 for SHA-256）
 */
const PBKDF2_ITERATIONS = 120_000;

/**
 * 使用 Web Crypto API 生成密码哈希
 * 注意：这不是 bcrypt，但可以在 Workers 环境中使用
 * 生产环境建议使用 bcryptjs（需要 polyfill）或 Cloudflare Workers 兼容的库
 */
export async function hashPassword(password: string): Promise<string> {
  // 使用 Web Crypto API 的 PBKDF2
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const key = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // 返回 salt:hash 格式
  return `${saltHex}:${hashHex}`;
}

/**
 * 验证密码
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const [saltHex, storedHash] = hash.split(':');
    if (!saltHex || !storedHash) return false;
    
    const salt = Uint8Array.from(
      saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    const key = await crypto.subtle.importKey(
      'raw',
      data,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      key,
      256
    );
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex === storedHash;
  } catch {
    return false;
  }
}

/**
 * 生成随机令牌（用于会话）
 */
export function generateToken(): string {
  return crypto.randomUUID();
}

/**
 * 生成6位数字验证码
 * 使用 CSPRNG (Web Crypto API) 替代 Math.random()
 */
export function generateVerificationCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // 取模确保 6 位
  const code = (array[0] % 900000) + 100000;
  return code.toString();
}

/**
 * 生成设备指纹
 * 核心哲学：不可逆性。
 */
export function generateDeviceFingerprint(userAgent: string, ip: string): string {
  const combined = `${userAgent}:${ip}:${SECURITY_CONFIG?.fingerprintSalt || 'aincrad'}`;
  
  // 使用简单的 DJB2 算法并结合 36 进制转换
  let hash = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 33) ^ combined.charCodeAt(i);
  }
  
  return Math.abs(hash >>> 0).toString(36);
}

/**
 * 生成CSRF令牌
 */
export function generateCSRFToken(): string {
  return crypto.randomUUID();
}

/**
 * 验证CSRF令牌
 */
export async function verifyCSRFToken(
  token: string,
  sessionId: string | null,
  kv: KVNamespace | null
): Promise<boolean> {
  if (!token || !sessionId || !kv) {
    return false;
  }
  
  const storedToken = await kv.get(`csrf:${sessionId}`);
  if (!storedToken) {
    return false;
  }
  
  // 验证后删除（一次性使用）
  await kv.delete(`csrf:${sessionId}`);
  return storedToken === token;
}

/**
 * 存储CSRF令牌
 */
export async function storeCSRFToken(
  token: string,
  sessionId: string | null,
  kv: KVNamespace | null
): Promise<void> {
  if (!sessionId || !kv) {
    return;
  }
  
  // 存储15分钟有效期
  await kv.put(`csrf:${sessionId}`, token, { expirationTtl: 900 });
}


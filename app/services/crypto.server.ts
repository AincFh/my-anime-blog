/**
 * 密码加密工具
 * 使用 bcryptjs 进行密码哈希（兼容 Cloudflare Workers）
 */

// 注意：在 Cloudflare Workers 环境中，需要使用兼容的加密库
// 这里使用 Web Crypto API 实现简单的哈希，生产环境建议使用 bcryptjs 或 argon2

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
      iterations: 100000,
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
        iterations: 100000,
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
 */
export function generateVerificationCode(): string {
  // 生成6位数字验证码
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 生成设备指纹
 */
export function generateDeviceFingerprint(userAgent: string, ip: string): string {
  // 结合用户代理和IP地址生成设备指纹
  const combined = `${userAgent}:${ip}`;
  
  // 简单的哈希函数
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  return Math.abs(hash).toString(36);
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


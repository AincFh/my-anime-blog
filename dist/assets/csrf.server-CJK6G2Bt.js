const CSRF_TOKEN_TTL = 5 * 60;
async function hmacSign(message, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function generateCSRFToken(sessionId, kv, secret) {
  const salt = crypto.randomUUID();
  const timestamp = Date.now();
  const message = `${sessionId}:${salt}:${timestamp}`;
  const signature = await hmacSign(message, secret);
  const token = `${salt}.${timestamp}.${signature}`;
  if (kv) {
    const kvKey = `csrf:${sessionId}:${salt}`;
    await kv.put(kvKey, timestamp.toString(), { expirationTtl: CSRF_TOKEN_TTL });
  }
  return token;
}
async function validateCSRFToken(token, sessionId, kv, secret) {
  if (!token) {
    return { valid: false, error: "CSRF Token 缺失" };
  }
  if (!sessionId) {
    return { valid: false, error: "会话无效" };
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "Token 格式错误" };
  }
  const [salt, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  const now = Date.now();
  if (now - timestamp > CSRF_TOKEN_TTL * 1e3) {
    return { valid: false, error: "Token 已过期" };
  }
  const message = `${sessionId}:${salt}:${timestamp}`;
  const expectedSignature = await hmacSign(message, secret);
  if (signature.length !== expectedSignature.length) {
    return { valid: false, error: "Token 验证失败" };
  }
  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  if (mismatch !== 0) {
    return { valid: false, error: "Token 验证失败" };
  }
  if (kv) {
    const kvKey = `csrf:${sessionId}:${salt}`;
    const stored = await kv.get(kvKey);
    if (!stored) {
      return { valid: false, error: "Token 已使用或无效" };
    }
    await kv.delete(kvKey);
  }
  return { valid: true };
}
export {
  generateCSRFToken,
  validateCSRFToken
};

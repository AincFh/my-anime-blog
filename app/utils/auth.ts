import type { Database } from "~/services/db.server";

export interface Session {
  sessionId: string;
  userId: number;
  username: string;
  expiresAt: number;
  role: 'admin' | 'user';
}

/**
 * 从请求中获取会话ID
 */
export function getSessionId(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie");
  return cookieHeader?.match(/session=([^;]+)/)?.[1] || null;
}

/**
 * 验证会话是否有效
 * 查询数据库验证会话有效性
 */
export async function verifySession(
  sessionId: string | null,
  db: Database
): Promise<Session | null> {
  if (!sessionId) return null;

  try {
    // 查询会话是否有效且未过期
    const sessionResult = await db.prepare(
      `SELECT s.token, s.user_id, s.expires_at, u.username, u.role 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.token = ? AND s.expires_at > ?`
    ).bind(sessionId, Math.floor(Date.now() / 1000)).first<{
      token: string;
      user_id: number;
      expires_at: number;
      username: string;
      role: string;
    }>();

    if (!sessionResult) {
      return null;
    }

    return {
      sessionId: sessionResult.token,
      userId: sessionResult.user_id,
      username: sessionResult.username,
      expiresAt: sessionResult.expires_at,
      role: sessionResult.role as 'admin' | 'user',
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

/**
 * 验证管理员权限
 */
export async function requireAdmin(
  request: Request,
  db: Database
): Promise<Session | null> {
  const session = await verifySession(getSessionId(request), db);

  if (!session || session.role !== 'admin') {
    return null;
  }

  return session;
}

/**
 * 检查用户是否已登录
 */
export async function requireAuth(
  request: Request,
  db: Database
): Promise<Session | null> {
  const sessionId = getSessionId(request);
  return await verifySession(sessionId, db);
}


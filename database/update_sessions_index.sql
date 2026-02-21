-- 优化会话查询性能
-- 主要用于 verifySession 查询: SELECT ... FROM sessions WHERE token = ? AND expires_at > ?
-- token 已经是 PRIMARY KEY，所以不需要额外索引
-- 但是我们需要根据 user_id 快速查找所有会话 (revokeAllUserSessions)
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- 优化过期会话清理
-- 用于定时任务清理过期会话: DELETE FROM sessions WHERE expires_at < ?
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

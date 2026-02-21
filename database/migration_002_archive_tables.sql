-- ================================================
-- 迁移 002: 日志表归档策略
-- 执行时间: 2026-01-16
-- 目的: 创建归档表以存储历史日志，优化主表性能并控制存储成本
-- ================================================

-- ==================== 审计日志归档表 ====================

-- 结构应与 audit_logs 保持一致，但移除外键约束以提高写入性能
-- 并添加 archived_at 字段记录归档时间
CREATE TABLE IF NOT EXISTS audit_logs_archive (
    id INTEGER PRIMARY KEY,           -- 保留原始 ID
    user_id INTEGER,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    user_agent TEXT,
    risk_level TEXT,
    metadata TEXT,
    created_at INTEGER,               -- 原始创建时间
    archived_at INTEGER DEFAULT (unixepoch())
);

-- 添加查询索引 (归档表主要用于按时间或用户追溯)
CREATE INDEX IF NOT EXISTS idx_audit_archive_created 
ON audit_logs_archive(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_archive_user 
ON audit_logs_archive(user_id);

-- ==================== 登录历史归档表 ====================

CREATE TABLE IF NOT EXISTS login_history_archive (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    location TEXT,
    status TEXT,
    fail_reason TEXT,
    session_token TEXT,
    created_at INTEGER,
    archived_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_login_archive_created 
ON login_history_archive(created_at);

CREATE INDEX IF NOT EXISTS idx_login_archive_user 
ON login_history_archive(user_id);

-- ==================== 积分交易归档表 ====================

CREATE TABLE IF NOT EXISTS coin_transactions_archive (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    amount INTEGER,
    type TEXT,
    source TEXT,
    reference_type TEXT,
    reference_id TEXT,
    balance_before INTEGER,
    balance_after INTEGER,
    description TEXT,
    operator_id INTEGER,
    created_at INTEGER,
    archived_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_coin_archive_created 
ON coin_transactions_archive(created_at);

CREATE INDEX IF NOT EXISTS idx_coin_archive_user 
ON coin_transactions_archive(user_id);

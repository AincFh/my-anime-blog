-- ================================================
-- 用户签到记录表 (User Sign-In Records)
-- 用于精确追踪每日签到状态，支持补签功能
-- ================================================

DROP TABLE IF EXISTS user_signin_records;

CREATE TABLE user_signin_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    signin_date TEXT NOT NULL,           -- YYYY-MM-DD 格式，与 D1 date() 函数兼容
    is_makeup INTEGER DEFAULT 0,          -- 是否为补签
    reward_coins INTEGER DEFAULT 0,      -- 发放的星辰数量
    bonus_coins INTEGER DEFAULT 0,       -- 连续签到额外奖励
    streak_days INTEGER DEFAULT 0,       -- 当天连续签到天数
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, signin_date)
);

CREATE INDEX IF NOT EXISTS idx_signin_user_date ON user_signin_records(user_id, signin_date DESC);
CREATE INDEX IF NOT EXISTS idx_signin_date ON user_signin_records(signin_date);
CREATE INDEX IF NOT EXISTS idx_signin_makeup ON user_signin_records(user_id, is_makeup);

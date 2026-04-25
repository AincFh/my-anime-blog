-- ================================================
-- 用户通知表 (Notifications)
-- ================================================

CREATE TABLE IF NOT EXISTS user_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN (
        'achievement',      -- 成就解锁
        'signin',           -- 签到
        'mission',         -- 任务完成
        'mission_reward',   -- 任务奖励
        'membership',       -- 会员到期
        'comment_reply',    -- 评论回复
        'system',          -- 系统通知
        'purchase',        -- 购买成功
        'gacha'            -- 扭蛋结果
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    is_important INTEGER DEFAULT 0,
    action_url TEXT,
    metadata TEXT,                        -- JSON: 额外数据
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON user_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON user_notifications(created_at DESC);

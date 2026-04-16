-- ================================================
-- 用户任务进度表 (User Missions Progress)
-- 用于记录每个用户每个任务的完成进度
-- ================================================

DROP TABLE IF EXISTS user_missions;
CREATE TABLE user_missions (
    user_id INTEGER NOT NULL,
    mission_id TEXT NOT NULL,
    current_count INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('in_progress', 'completed', 'claimed')) DEFAULT 'in_progress',
    last_updated_at INTEGER DEFAULT (unixepoch()),
    reset_at INTEGER,
    created_at INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (user_id, mission_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_missions_user ON user_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_status ON user_missions(status);
CREATE INDEX IF NOT EXISTS idx_user_missions_reset ON user_missions(reset_at);

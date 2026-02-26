-- ================================================
-- 使命/任务系统表 (Missions System)
-- ================================================

DROP TABLE IF EXISTS missions;
CREATE TABLE missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    reward_coins INTEGER DEFAULT 0,
    reward_exp INTEGER DEFAULT 0,
    type TEXT CHECK(type IN ('daily', 'weekly', 'monthly', 'achievement')) DEFAULT 'daily',
    target_action TEXT NOT NULL,
    target_count INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_missions_type ON missions(type);
CREATE INDEX IF NOT EXISTS idx_missions_active ON missions(is_active);

-- 初始任务数据
INSERT INTO missions (name, description, reward_coins, reward_exp, type, target_action, target_count, is_active) VALUES
('每日签到', '每天登录网站即可获得奖励', 10, 5, 'daily', 'signin', 1, 1),
('文章阅读者', '阅读3篇文章', 5, 3, 'daily', 'read_article', 3, 1),
('评论达人', '发表2条评论', 8, 5, 'daily', 'comment', 2, 1),
('周常签到', '连续签到7天', 50, 30, 'weekly', 'signin', 7, 1),
('内容创作者', '发布1篇文章', 100, 80, 'weekly', 'publish_article', 1, 1),
('月度活跃', '累计签到30天', 200, 150, 'monthly', 'signin', 30, 1),
('初次探索', '首次完成个人资料设置', 50, 30, 'achievement', 'setup_profile', 1, 1);

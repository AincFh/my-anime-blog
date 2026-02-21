-- Mission System Migration

-- 任务定义表
CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    reward_coins INTEGER DEFAULT 0,
    reward_exp INTEGER DEFAULT 0,
    type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    target_action TEXT NOT NULL, -- 'signin', 'comment', 'article_read', 'shop_visit'
    target_count INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 用户任务进度表
CREATE TABLE IF NOT EXISTS user_missions (
    user_id INTEGER NOT NULL,
    mission_id TEXT NOT NULL,
    current_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'claimed'
    last_updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    reset_at INTEGER NOT NULL, -- 重置时间戳
    PRIMARY KEY (user_id, mission_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (mission_id) REFERENCES missions(id)
);

-- 预置每日任务
INSERT OR IGNORE INTO missions (id, name, description, reward_coins, reward_exp, type, target_action, target_count, sort_order) VALUES
('daily_signin', '每日签到', '每日回到星尘世界报到', 50, 20, 'daily', 'signin', 1, 1),
('daily_comment', '文明互动', '在文章下发表 1 条有意义的评论', 30, 50, 'daily', 'comment', 1, 2),
('daily_read', '博览群书', '阅读 3 篇不同的文章', 20, 30, 'daily', 'article_read', 3, 3),
('daily_shop', '看看新品', '访问一次道具商城', 10, 10, 'daily', 'shop_visit', 1, 4);

-- 预置周常任务
INSERT OR IGNORE INTO missions (id, name, description, reward_coins, reward_exp, type, target_action, target_count, sort_order) VALUES
('weekly_active', '狂热爱好者', '连续 5 天进行签到', 200, 500, 'weekly', 'signin', 5, 10);

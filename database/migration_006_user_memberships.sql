-- ================================================
-- 会员系统表层 (Membership Tables)
-- 将 subscriptions 表映射为 membership.server.ts 期望的结构
-- ================================================

-- 1. 用户会员记录表（从 subscriptions 同步，保留 tier_level 等期望字段）
DROP TABLE IF EXISTS user_memberships;
CREATE TABLE user_memberships (
    user_id INTEGER PRIMARY KEY,
    tier_level INTEGER NOT NULL DEFAULT 0,
    started_at TEXT NOT NULL,
    expires_at TEXT,
    payment_method TEXT,
    payment_id TEXT,
    status TEXT CHECK(status IN ('active', 'expired', 'cancelled', 'pending')) DEFAULT 'pending',
    updated_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_memberships_tier ON user_memberships(tier_level);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON user_memberships(status);

-- 2. 会员权限定义表（静态权限目录）
DROP TABLE IF EXISTS membership_permissions;
CREATE TABLE membership_permissions (
    permission_key TEXT PRIMARY KEY,
    permission_name TEXT NOT NULL,
    permission_category TEXT NOT NULL,
    is_active INTEGER DEFAULT 1
);

-- 3. 等级权限表（每行 = 一个等级 × 一个权限）
DROP TABLE IF EXISTS tier_permissions;
CREATE TABLE tier_permissions (
    tier_level INTEGER NOT NULL,
    permission_key TEXT NOT NULL,
    value INTEGER DEFAULT 0,
    extra_data TEXT,
    PRIMARY KEY (tier_level, permission_key)
);

CREATE INDEX IF NOT EXISTS idx_tier_permissions_level ON tier_permissions(tier_level);

-- ================================================
-- 初始化权限目录数据
-- ================================================
INSERT INTO membership_permissions (permission_key, permission_name, permission_category, is_active) VALUES
-- 内容权限
('feature.articles.read', '阅读文章', 'content', 1),
('feature.articles.write', '创作文章', 'content', 1),
-- 功能权限
('feature.ai.chat', 'AI聊天', 'feature', 1),
('feature.ad.free', '去广告', 'feature', 1),
('feature.download', '下载权限', 'feature', 1),
('feature.custom.theme', '自定义主题', 'feature', 1),
('feature.exclusive.emoji', '专属表情', 'feature', 1),
('feature.exclusive.effect', '专属特效', 'feature', 1),
('feature.early.access', '抢先体验', 'feature', 1),
('feature.priority.support', '优先客服', 'feature', 1),
('feature.collection.cloud', '云端收藏夹', 'feature', 1),
-- 游戏权限
('game.task.reward_multiplier', '任务奖励倍率', 'game', 1),
('game.gacha.pity', 'Gacha保底加成', 'game', 1),
-- 数量限制
('limit.max_animes', '番剧收藏上限', 'limit', 1),
('limit.gallery_per_day', '每日图库上限', 'limit', 1),
('limit.ai_chat_per_day', '每日AI对话上限', 'limit', 1);

-- ================================================
-- 初始化等级权限数据（从 membership_tiers.privileges JSON 展开）
-- ================================================

-- Lv0 旅行者（sort_order=0）
INSERT INTO tier_permissions (tier_level, permission_key, value, extra_data) VALUES
(0, 'feature.articles.read', 1, NULL),
(0, 'feature.articles.write', 1, NULL),
(0, 'feature.ai.chat', 3, '{"daily_limit":3}'),
(0, 'feature.ad.free', 0, NULL),
(0, 'feature.download', 0, NULL),
(0, 'feature.custom.theme', 0, NULL),
(0, 'feature.exclusive.emoji', 0, NULL),
(0, 'feature.exclusive.effect', 0, NULL),
(0, 'feature.early.access', 0, NULL),
(0, 'feature.priority.support', 0, NULL),
(0, 'feature.collection.cloud', 0, NULL),
(0, 'game.task.reward_multiplier', 1, NULL),
(0, 'game.gacha.pity', 0, NULL),
(0, 'limit.max_animes', 20, NULL),
(0, 'limit.gallery_per_day', 50, NULL),
(0, 'limit.ai_chat_per_day', 3, NULL);

-- Lv1 月之子（sort_order=1）
INSERT INTO tier_permissions (tier_level, permission_key, value, extra_data) VALUES
(1, 'feature.articles.read', 1, NULL),
(1, 'feature.articles.write', 1, NULL),
(1, 'feature.ai.chat', 20, '{"daily_limit":20}'),
(1, 'feature.ad.free', 1, NULL),
(1, 'feature.download', 1, NULL),
(1, 'feature.custom.theme', 0, NULL),
(1, 'feature.exclusive.emoji', 0, NULL),
(1, 'feature.exclusive.effect', 0, NULL),
(1, 'feature.early.access', 0, NULL),
(1, 'feature.priority.support', 0, NULL),
(1, 'feature.collection.cloud', 1, NULL),
(1, 'game.task.reward_multiplier', 2, NULL),
(1, 'game.gacha.pity', 1, NULL),
(1, 'limit.max_animes', 100, NULL),
(1, 'limit.gallery_per_day', 200, NULL),
(1, 'limit.ai_chat_per_day', 20, NULL);

-- Lv2 星之守护者（sort_order=2）
INSERT INTO tier_permissions (tier_level, permission_key, value, extra_data) VALUES
(2, 'feature.articles.read', 1, NULL),
(2, 'feature.articles.write', 1, NULL),
(2, 'feature.ai.chat', 100, '{"daily_limit":100}'),
(2, 'feature.ad.free', 1, NULL),
(2, 'feature.download', 1, NULL),
(2, 'feature.custom.theme', 1, NULL),
(2, 'feature.exclusive.emoji', 1, NULL),
(2, 'feature.exclusive.effect', 1, NULL),
(2, 'feature.early.access', 1, NULL),
(2, 'feature.priority.support', 0, NULL),
(2, 'feature.collection.cloud', 1, NULL),
(2, 'game.task.reward_multiplier', 3, NULL),
(2, 'game.gacha.pity', 1, NULL),
(2, 'limit.max_animes', -1, '{"unlimited":true}'),
(2, 'limit.gallery_per_day', -1, '{"unlimited":true}'),
(2, 'limit.ai_chat_per_day', 100, NULL);

-- Lv3 银河领主（sort_order=3）
INSERT INTO tier_permissions (tier_level, permission_key, value, extra_data) VALUES
(3, 'feature.articles.read', 1, NULL),
(3, 'feature.articles.write', 1, NULL),
(3, 'feature.ai.chat', -1, '{"daily_limit":-1,"unlimited":true}'),
(3, 'feature.ad.free', 1, NULL),
(3, 'feature.download', 1, NULL),
(3, 'feature.custom.theme', 1, NULL),
(3, 'feature.exclusive.emoji', 1, NULL),
(3, 'feature.exclusive.effect', 1, NULL),
(3, 'feature.early.access', 1, NULL),
(3, 'feature.priority.support', 1, NULL),
(3, 'feature.collection.cloud', 1, NULL),
(3, 'game.task.reward_multiplier', 5, NULL),
(3, 'game.gacha.pity', 1, NULL),
(3, 'limit.max_animes', -1, '{"unlimited":true}'),
(3, 'limit.gallery_per_day', -1, '{"unlimited":true}'),
(3, 'limit.ai_chat_per_day', -1, '{"unlimited":true}');

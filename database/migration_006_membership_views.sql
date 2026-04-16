-- ================================================
-- 会员系统视图层 (Membership Views)
-- 将 subscriptions 表映射为 membership.server.ts 期望的结构
-- ================================================

-- 用户会员视图：将 subscriptions 映射为 user_memberships 结构
CREATE VIEW IF NOT EXISTS user_memberships AS
SELECT 
    s.user_id,
    t.sort_order AS tier_level,
    s.start_date AS started_at,
    s.end_date AS expires_at,
    NULL AS payment_method,
    NULL AS payment_id,
    s.status
FROM subscriptions s
JOIN membership_tiers t ON s.tier_id = t.id;

-- 会员权限定义视图：从 membership_tiers.privileges JSON 提取
CREATE VIEW IF NOT EXISTS membership_permissions AS
SELECT 
    'feature.articles.read' AS permission_key,
    '阅读文章' AS permission_name,
    'content' AS permission_category,
    1 AS value,
    1 AS is_active
UNION ALL SELECT 'feature.articles.write', '创作文章', 'content', 1, 1
UNION ALL SELECT 'feature.ai.chat', 'AI聊天', 'feature', 1, 1
UNION ALL SELECT 'feature.ad.free', '去广告', 'feature', 1, 1
UNION ALL SELECT 'feature.download', '下载权限', 'feature', 1, 1
UNION ALL SELECT 'feature.custom.theme', '自定义主题', 'feature', 1, 1
UNION ALL SELECT 'feature.exclusive.emoji', '专属表情', 'feature', 1, 1
UNION ALL SELECT 'feature.exclusive.effect', '专属特效', 'feature', 1, 1
UNION ALL SELECT 'feature.early.access', '抢先体验', 'feature', 1, 1
UNION ALL SELECT 'feature.priority.support', '优先客服', 'feature', 1, 1
UNION ALL SELECT 'feature.collection.cloud', '云端收藏夹', 'feature', 1, 1
UNION ALL SELECT 'game.task.reward_multiplier', '任务奖励倍率', 'game', 1, 1
UNION ALL SELECT 'game.gacha.pity', 'Gacha保底加成', 'game', 0, 1;

-- 等级权限视图：基于 membership_tiers 表
CREATE VIEW IF NOT EXISTS tier_permissions AS
SELECT 
    t.sort_order AS tier_level,
    'feature.articles.read' AS permission_key,
    1 AS value,
    NULL AS extra_data
FROM membership_tiers t
WHERE t.is_active = 1
UNION ALL SELECT t.sort_order, 'feature.articles.write', 
    CASE WHEN t.sort_order >= 1 THEN 1 ELSE 0 END, NULL
FROM membership_tiers t WHERE t.is_active = 1
UNION ALL SELECT t.sort_order, 'feature.ai.chat',
    CASE WHEN t.sort_order >= 1 THEN 1 ELSE 0 END, NULL
FROM membership_tiers t WHERE t.is_active = 1
UNION ALL SELECT t.sort_order, 'feature.ad.free',
    CASE WHEN t.sort_order >= 1 THEN 1 ELSE 0 END, NULL
FROM membership_tiers t WHERE t.is_active = 1
UNION ALL SELECT t.sort_order, 'feature.download',
    CASE WHEN t.sort_order >= 1 THEN 1 ELSE 0 END, NULL
FROM membership_tiers t WHERE t.is_active = 1
UNION ALL SELECT t.sort_order, 'feature.custom.theme',
    CASE WHEN t.sort_order >= 2 THEN 1 ELSE 0 END, NULL
FROM membership_tiers t WHERE t.is_active = 1
UNION ALL SELECT t.sort_order, 'feature.exclusive.emoji',
    CASE WHEN t.sort_order >= 2 THEN 1 ELSE 0 END, NULL
FROM membership_tiers t WHERE t.is_active = 1
UNION ALL SELECT t.sort_order, 'feature.exclusive.effect',
    CASE WHEN t.sort_order >= 2 THEN 1 ELSE 0 END, NULL
FROM membership_tiers t WHERE t.is_active = 1
UNION ALL SELECT t.sort_order, 'feature.early.access',
    CASE WHEN t.sort_order >= 2 THEN 1 ELSE 0 END, NULL
FROM membership_tiers t WHERE t.is_active = 1
UNION ALL SELECT t.sort_order, 'feature.priority.support',
    CASE WHEN t.sort_order >= 3 THEN 1 ELSE 0 END, NULL
FROM membership_tiers t WHERE t.is_active = 1
UNION ALL SELECT t.sort_order, 'game.task.reward_multiplier',
    CASE t.sort_order 
        WHEN 0 THEN 1 
        WHEN 1 THEN 2 
        WHEN 2 THEN 3 
        WHEN 3 THEN 5 
        ELSE 1 END, NULL
FROM membership_tiers t WHERE t.is_active = 1
UNION ALL SELECT t.sort_order, 'game.gacha.pity',
    CASE WHEN t.sort_order >= 2 THEN 1 ELSE 0 END, NULL
FROM membership_tiers t WHERE t.is_active = 1;

-- ================================================
-- 同步 subscriptions -> user_memberships
-- 将现有订阅数据填充到新的 user_memberships 表
-- ================================================

-- 同步活跃订阅
INSERT OR REPLACE INTO user_memberships (user_id, tier_level, started_at, expires_at, payment_method, payment_id, status, updated_at)
SELECT 
    s.user_id,
    t.sort_order AS tier_level,
    datetime(s.start_date, 'unixepoch') AS started_at,
    CASE 
        WHEN s.end_date IS NOT NULL THEN datetime(s.end_date, 'unixepoch')
        ELSE NULL 
    END AS expires_at,
    'subscription' AS payment_method,
    'sync_' || s.id AS payment_id,
    s.status,
    unixepoch() AS updated_at
FROM subscriptions s
JOIN membership_tiers t ON s.tier_id = t.id
WHERE s.status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM user_memberships WHERE user_id = s.user_id
);

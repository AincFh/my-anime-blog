-- ================================================
-- 订阅变更同步触发器
-- 当 subscriptions 表发生变化时，自动同步到 user_memberships 表
-- ================================================

-- 删除已存在的触发器（用于重建）
DROP TRIGGER IF EXISTS trg_subscription_insert;
DROP TRIGGER IF EXISTS trg_subscription_update;
DROP TRIGGER IF EXISTS trg_subscription_delete;

-- 新订阅创建时：插入 user_memberships
CREATE TRIGGER trg_subscription_insert
AFTER INSERT ON subscriptions
BEGIN
    INSERT OR REPLACE INTO user_memberships (user_id, tier_level, started_at, expires_at, payment_method, payment_id, status, updated_at)
    SELECT 
        NEW.user_id,
        (SELECT sort_order FROM membership_tiers WHERE id = NEW.tier_id),
        datetime(NEW.start_date, 'unixepoch'),
        CASE WHEN NEW.end_date IS NOT NULL THEN datetime(NEW.end_date, 'unixepoch') ELSE NULL END,
        'subscription',
        'sub_' || NEW.id,
        NEW.status,
        unixepoch()
    WHERE NEW.status = 'active';
END;

-- 订阅状态变更时：更新 user_memberships
CREATE TRIGGER trg_subscription_update
AFTER UPDATE ON subscriptions
BEGIN
    INSERT OR REPLACE INTO user_memberships (user_id, tier_level, started_at, expires_at, payment_method, payment_id, status, updated_at)
    SELECT 
        NEW.user_id,
        (SELECT sort_order FROM membership_tiers WHERE id = NEW.tier_id),
        datetime(NEW.start_date, 'unixepoch'),
        CASE WHEN NEW.end_date IS NOT NULL THEN datetime(NEW.end_date, 'unixepoch') ELSE NULL END,
        'subscription',
        'sub_' || NEW.id,
        NEW.status,
        unixepoch()
    WHERE NEW.status IN ('active', 'expired', 'cancelled');
END;

-- 订阅删除时：删除 user_memberships
CREATE TRIGGER trg_subscription_delete
AFTER DELETE ON subscriptions
BEGIN
    DELETE FROM user_memberships WHERE user_id = OLD.user_id;
END;

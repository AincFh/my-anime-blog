-- ================================================
-- 补充 membership_tiers 表缺少的 tier_level 字段
-- 代码 JOIN 使用 tier_level = sort_order
-- ================================================

-- 添加 tier_level 列（与 sort_order 相同值，保留 sort_order 用于排序）
ALTER TABLE membership_tiers ADD COLUMN tier_level INTEGER;

-- 同步数据：将 sort_order 的值填充到 tier_level
UPDATE membership_tiers SET tier_level = sort_order WHERE tier_level IS NULL;

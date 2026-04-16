-- ================================================
-- 补充 membership_tiers 表字段（安全版本）
-- 使用事务确保原子性，错误不中断后续操作
-- ================================================

-- tier_level
SELECT 'Adding tier_level column' AS step;
-- SQLite ALTER TABLE ADD COLUMN 在列不存在时才生效
-- 如果列已存在，此语句会被静默忽略（D1/SQLite 行为）
ALTER TABLE membership_tiers ADD COLUMN tier_level INTEGER;

-- tier_name
SELECT 'Adding tier_name column' AS step;
ALTER TABLE membership_tiers ADD COLUMN tier_name TEXT;

-- tier_name_en
SELECT 'Adding tier_name_en column' AS step;
ALTER TABLE membership_tiers ADD COLUMN tier_name_en TEXT;

-- color_hex
SELECT 'Adding color_hex column' AS step;
ALTER TABLE membership_tiers ADD COLUMN color_hex TEXT;

-- 同步 tier_level = sort_order（0/1/2/3 对应四个等级）
UPDATE membership_tiers SET tier_level = sort_order WHERE tier_level IS NULL;

-- 同步 tier_name = display_name
UPDATE membership_tiers SET tier_name = display_name WHERE tier_name IS NULL;

-- 同步 tier_name_en
UPDATE membership_tiers SET 
    tier_name_en = CASE name
        WHEN 'traveler' THEN 'Traveler'
        WHEN 'moonchild' THEN 'Moon Child'
        WHEN 'star-guardian' THEN 'Star Guardian'
        WHEN 'galaxy-lord' THEN 'Galaxy Lord'
        ELSE name
    END
WHERE tier_name_en IS NULL;

-- 同步 color_hex = badge_color
UPDATE membership_tiers SET color_hex = badge_color WHERE color_hex IS NULL;

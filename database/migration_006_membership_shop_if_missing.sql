-- 非破坏性：仅当表不存在时创建商城/会员档位表，并补种子数据（可重复执行）
-- 本地: npx wrangler d1 execute <YOUR_DB_NAME> --local --file=database/migration_006_membership_shop_if_missing.sql
-- 远程: npx wrangler d1 execute <YOUR_DB_NAME> --remote --file=database/migration_006_membership_shop_if_missing.sql

CREATE TABLE IF NOT EXISTS membership_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    price_monthly INTEGER DEFAULT 0,
    price_quarterly INTEGER DEFAULT 0,
    price_yearly INTEGER DEFAULT 0,
    privileges TEXT,
    badge_url TEXT,
    badge_color TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS shop_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT,
    price_coins INTEGER NOT NULL,
    original_price INTEGER,
    stock INTEGER DEFAULT -1,
    sold_count INTEGER DEFAULT 0,
    image_url TEXT,
    preview_url TEXT,
    data TEXT,
    tier_required TEXT,
    is_active INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    start_time INTEGER,
    end_time INTEGER,
    created_at INTEGER DEFAULT (unixepoch())
);

INSERT INTO membership_tiers (name, display_name, description, price_monthly, price_quarterly, price_yearly, privileges, badge_color, sort_order)
SELECT 'free', '普通用户', '基础功能', 0, 0, 0,
 '{"maxAnimes":20,"maxGalleryPerDay":50,"aiChatPerDay":3,"coinMultiplier":1,"adFree":false,"download":false,"customTheme":false,"exclusiveEmoji":false,"exclusiveEffect":false,"earlyAccess":false,"prioritySupport":false}',
 NULL, 0
WHERE NOT EXISTS (SELECT 1 FROM membership_tiers WHERE name = 'free');

INSERT INTO membership_tiers (name, display_name, description, price_monthly, price_quarterly, price_yearly, privileges, badge_color, sort_order)
SELECT 'vip', 'VIP会员', '解锁更多功能', 1990, 4990, 16800,
 '{"maxAnimes":-1,"maxGalleryPerDay":-1,"aiChatPerDay":50,"coinMultiplier":1.5,"adFree":true,"download":true,"customTheme":true,"exclusiveEmoji":true,"exclusiveEffect":false,"earlyAccess":false,"prioritySupport":false,"badge":"vip"}',
 '#FFD700', 1
WHERE NOT EXISTS (SELECT 1 FROM membership_tiers WHERE name = 'vip');

INSERT INTO membership_tiers (name, display_name, description, price_monthly, price_quarterly, price_yearly, privileges, badge_color, sort_order)
SELECT 'svip', 'SVIP会员', '尊享全部特权', 3990, 9990, 29900,
 '{"maxAnimes":-1,"maxGalleryPerDay":-1,"aiChatPerDay":-1,"coinMultiplier":2,"adFree":true,"download":true,"customTheme":true,"exclusiveEmoji":true,"exclusiveEffect":true,"earlyAccess":true,"prioritySupport":true,"badge":"svip"}',
 '#E5C100', 2
WHERE NOT EXISTS (SELECT 1 FROM membership_tiers WHERE name = 'svip');

INSERT INTO shop_items (name, description, type, price_coins, image_url, is_active, is_featured)
SELECT '金色头像框', '闪耀的金色边框', 'avatar_frame', 500, '/shop/frame-gold.png', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = '金色头像框' AND type = 'avatar_frame');

INSERT INTO shop_items (name, description, type, price_coins, image_url, is_active, is_featured)
SELECT '二次元主题', '可爱的动漫风格主题', 'theme', 300, '/shop/theme-anime.png', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = '二次元主题' AND type = 'theme');

INSERT INTO shop_items (name, description, type, price_coins, image_url, is_active, is_featured)
SELECT '樱花表情包', '12个樱花主题表情', 'emoji', 200, '/shop/emoji-sakura.png', 1, 0
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = '樱花表情包' AND type = 'emoji');

INSERT INTO shop_items (name, description, type, price_coins, image_url, is_active, is_featured)
SELECT 'VIP专属徽章', '限定VIP徽章', 'badge', 1000, '/shop/badge-vip.png', 1, 0
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'VIP专属徽章' AND type = 'badge');

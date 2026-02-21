-- ================================================
-- 商城道具 v2 — 全新二次元主题，分类丰富
-- ================================================

-- ============ 头像框 (avatar_frame) ============
INSERT INTO shop_items (name, description, type, price_coins, original_price, image_url, is_active, is_featured, sort_order) VALUES
('樱花飘零', '淡粉色樱花花瓣环绕头像，春日限定感', 'avatar_frame', 80, NULL, 'https://api.iconify.design/lucide:flower-2.svg?color=%23f9a8d4', 1, 0, 100),
('金色荣耀', '华丽金色边框，彰显尊贵身份', 'avatar_frame', 500, NULL, 'https://api.iconify.design/lucide:crown.svg?color=%23fbbf24', 1, 1, 101),
('赛博霓虹', '赛博朋克风格动态霓虹边框', 'avatar_frame', 800, 1200, 'https://api.iconify.design/lucide:monitor.svg?color=%2306b6d4', 1, 1, 102),
('暗夜星辰', '深蓝星空流光效果边框', 'avatar_frame', 600, NULL, 'https://api.iconify.design/lucide:moon-star.svg?color=%236366f1', 1, 0, 103),
('火焰之心', '炽热红色火焰环绕效果', 'avatar_frame', 1000, NULL, 'https://api.iconify.design/lucide:flame.svg?color=%23ef4444', 1, 0, 104),
('极光幻境', '梦幻极光渐变边框，绿紫交织', 'avatar_frame', 1200, 1800, 'https://api.iconify.design/lucide:sparkles.svg?color=%2334d399', 1, 1, 105),
('像素复古', '8-bit 像素风格怀旧边框', 'avatar_frame', 300, NULL, 'https://api.iconify.design/lucide:gamepad-2.svg?color=%23a78bfa', 1, 0, 106);

-- ============ 主题皮肤 (theme) ============
INSERT INTO shop_items (name, description, type, price_coins, original_price, image_url, is_active, is_featured, sort_order) VALUES
('深海沉梦', '深海蓝色系主题，宁静且沉浸', 'theme', 200, NULL, 'https://api.iconify.design/lucide:waves.svg?color=%230ea5e9', 1, 0, 200),
('暮色森林', '森林绿与暖橙黄的黄昏配色', 'theme', 200, NULL, 'https://api.iconify.design/lucide:trees.svg?color=%2322c55e', 1, 0, 201),
('蒸汽波', 'Vaporwave 风格紫粉渐变主题', 'theme', 350, 500, 'https://api.iconify.design/lucide:sunset.svg?color=%23d946ef', 1, 1, 202),
('东京夜雨', '霓虹灯下的东京雨夜配色', 'theme', 400, NULL, 'https://api.iconify.design/lucide:cloud-rain.svg?color=%23ec4899', 1, 1, 203),
('纯白极简', '极简纯白主题，清爽干净', 'theme', 150, NULL, 'https://api.iconify.design/lucide:sun.svg?color=%23fbbf24', 1, 0, 204),
('血月魔族', '暗红与黑色的哥特式暗黑主题', 'theme', 500, NULL, 'https://api.iconify.design/lucide:skull.svg?color=%23dc2626', 1, 0, 205);

-- ============ 表情包 (emoji) ============
INSERT INTO shop_items (name, description, type, price_coins, original_price, image_url, is_active, is_featured, sort_order) VALUES
('樱花物语', '12 个樱花主题表情，春天的气息', 'emoji', 60, NULL, 'https://api.iconify.design/lucide:flower.svg?color=%23fb7185', 1, 0, 300),
('猫耳少女', '16 个猫耳萌妹表情包', 'emoji', 80, NULL, 'https://api.iconify.design/lucide:cat.svg?color=%23f97316', 1, 1, 301),
('颜文字大全', '30 个经典颜文字动态表情 (╯°□°)╯', 'emoji', 120, 200, 'https://api.iconify.design/lucide:smile-plus.svg?color=%23fbbf24', 1, 1, 302),
('暴走漫画', '20 个暴走脸系列表情包', 'emoji', 100, NULL, 'https://api.iconify.design/lucide:laugh.svg?color=%2360a5fa', 1, 0, 303),
('干杯啤酒', '10 个吃喝主题可爱表情', 'emoji', 50, NULL, 'https://api.iconify.design/lucide:beer.svg?color=%23fbbf24', 1, 0, 304);

-- ============ 徽章 (badge) ============
INSERT INTO shop_items (name, description, type, price_coins, original_price, image_url, is_active, is_featured, sort_order) VALUES
('初心者', '踏上旅程的第一步，所有人的起点', 'badge', 50, NULL, 'https://api.iconify.design/lucide:compass.svg?color=%2360a5fa', 1, 0, 400),
('番剧鉴赏家', '看过 50 部以上番剧的证明', 'badge', 500, NULL, 'https://api.iconify.design/lucide:clapperboard.svg?color=%23f472b6', 1, 1, 401),
('星际指挥官', '象征荣耀与实力的指挥官徽章', 'badge', 1200, NULL, 'https://api.iconify.design/lucide:medal.svg?color=%23f59e0b', 1, 1, 402),
('深渊猎人', '挑战深渊，征服一切的勇者标志', 'badge', 2000, NULL, 'https://api.iconify.design/lucide:swords.svg?color=%23ef4444', 1, 0, 403),
('传说收藏家', '集齐全部限定道具的传奇成就', 'badge', 5000, NULL, 'https://api.iconify.design/lucide:trophy.svg?color=%23fbbf24', 1, 1, 404),
('VIP 专属', '仅限 VIP 会员购买的限定徽章', 'badge', 800, NULL, 'https://api.iconify.design/lucide:shield-check.svg?color=%23a78bfa', 1, 0, 405);

-- ============ 功能道具 (prop) ============
INSERT INTO shop_items (name, description, type, price_coins, original_price, image_url, is_active, is_featured, sort_order) VALUES
('双倍经验卡 (1h)', '使用后 1 小时内获得双倍经验', 'prop', 100, NULL, 'https://api.iconify.design/lucide:zap.svg?color=%23fbbf24', 1, 1, 500),
('双倍经验卡 (24h)', '使用后 24 小时内获得双倍经验', 'prop', 500, 800, 'https://api.iconify.design/lucide:zap.svg?color=%23f97316', 1, 1, 501),
('改名卡', '修改一次用户昵称', 'prop', 500, NULL, 'https://api.iconify.design/lucide:pencil.svg?color=%233b82f6', 1, 0, 502),
('补签卡', '补签一次漏签的每日签到', 'prop', 80, NULL, 'https://api.iconify.design/lucide:calendar-check.svg?color=%2310b981', 1, 0, 503),
('星尘翻倍卡', '下一次签到/活动获得的星尘翻倍', 'prop', 200, 300, 'https://api.iconify.design/lucide:gem.svg?color=%23a78bfa', 1, 0, 504),
('高级扭蛋券', '扭蛋机必出稀有奖励的保底券', 'prop', 300, NULL, 'https://api.iconify.design/lucide:ticket.svg?color=%23ec4899', 1, 1, 505),
('幸运加持符', '提升 50% 扭蛋/抽奖的稀有概率', 'prop', 600, NULL, 'https://api.iconify.design/lucide:clover.svg?color=%2334d399', 1, 0, 506),
('传送门钥匙', '解锁隐藏页面和彩蛋内容', 'prop', 1500, 2000, 'https://api.iconify.design/lucide:key.svg?color=%23fbbf24', 1, 1, 507);

-- ============ 入场特效 (effect) ============
INSERT INTO shop_items (name, description, type, price_coins, original_price, image_url, is_active, is_featured, sort_order) VALUES
('星光坠落', '登录时星光从天而降的入场特效', 'effect', 800, NULL, 'https://api.iconify.design/lucide:star.svg?color=%23fbbf24', 1, 0, 600),
('樱花暴风', '满屏樱花飘散的华丽入场特效', 'effect', 1000, NULL, 'https://api.iconify.design/lucide:wind.svg?color=%23fb7185', 1, 1, 601),
('闪电降临', '雷电交加的震撼登场特效', 'effect', 1500, 2000, 'https://api.iconify.design/lucide:cloud-lightning.svg?color=%23a78bfa', 1, 0, 602),
('虚空裂隙', '时空裂缝撕开的传送门入场特效', 'effect', 3000, NULL, 'https://api.iconify.design/lucide:aperture.svg?color=%23818cf8', 1, 1, 603);

-- ============ 兑换券 (coupon) ============
INSERT INTO shop_items (name, description, type, price_coins, original_price, image_url, is_active, is_featured, sort_order) VALUES
('VIP 3天体验券', '体验 VIP 会员全部特权 3 天', 'coupon', 300, NULL, 'https://api.iconify.design/lucide:ticket-check.svg?color=%23fbbf24', 1, 1, 700),
('VIP 月卡兑换券', '直接兑换一个月 VIP 会员', 'coupon', 1500, 1990, 'https://api.iconify.design/lucide:crown.svg?color=%23fbbf24', 1, 1, 701),
('SVIP 月卡兑换券', '直接兑换一个月 SVIP 会员', 'coupon', 3000, 3990, 'https://api.iconify.design/lucide:gem.svg?color=%23e5c100', 1, 0, 702);

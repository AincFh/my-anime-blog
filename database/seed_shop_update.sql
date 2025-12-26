-- 添加更多商城商品
INSERT INTO shop_items (name, description, type, price_coins, image_url, is_active, is_featured, sort_order) VALUES
('双倍经验卡 (1小时)', '使用后1小时内获得双倍经验值', 'prop', 100, 'https://api.iconify.design/lucide:zap.svg?color=%23fbbf24', 1, 1, 10),
('改名卡', '修改一次用户昵称', 'prop', 500, 'https://api.iconify.design/lucide:pencil.svg?color=%233b82f6', 1, 0, 20),
('高级扭蛋券', '必出稀有奖励的扭蛋券', 'prop', 300, 'https://api.iconify.design/lucide:ticket.svg?color=%23ec4899', 1, 1, 30),
('补签卡', '补签一次漏签的日期', 'prop', 50, 'https://api.iconify.design/lucide:calendar-check.svg?color=%2310b981', 1, 0, 40),
('赛博朋克头像框', '霓虹风格的动态头像框', 'avatar_frame', 800, 'https://api.iconify.design/lucide:frame.svg?color=%2306b6d4', 1, 0, 50),
('星际指挥官徽章', '象征荣耀的指挥官徽章', 'badge', 1200, 'https://api.iconify.design/lucide:medal.svg?color=%23f59e0b', 1, 1, 60);

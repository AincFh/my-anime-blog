-- 清空旧数据
DELETE FROM animes;

-- 使用 Paugram 直链图源（带唯一种子防重复），保留真实番剧标题
INSERT INTO animes (title, cover_url, status, progress, rating, review, created_at) VALUES
('葬送的芙莉莲', 'https://api.paugram.com/wallpaper/?seed=anime_frieren', 'watching', '18/28', 9, '时间与情感的沉淀，每一话都值得回味。', strftime('%s', 'now', '-5 days')),
('鬼灭之刃 游郭篇', 'https://api.paugram.com/wallpaper/?seed=anime_kimetsu', 'completed', '11/11', 10, '飞碟社的巅峰作画时刻！', strftime('%s', 'now', '-30 days')),
('进击的巨人 完结篇', 'https://api.paugram.com/wallpaper/?seed=anime_shingeki', 'completed', '87/87', 9, '史诗落幕，十年追番画上句号。', strftime('%s', 'now', '-60 days')),
('紫罗兰永恒花园', 'https://api.paugram.com/wallpaper/?seed=anime_violet', 'completed', '13/13', 10, '京阿尼美学巅峰，每一帧都是壁纸。', strftime('%s', 'now', '-90 days')),
('赛博朋克：边缘行者', 'https://api.paugram.com/wallpaper/?seed=anime_cyberpunk', 'completed', '10/10', 9, '夜之城的悲歌，浪漫至极。', strftime('%s', 'now', '-45 days')),
('间谍过家家', 'https://api.paugram.com/wallpaper/?seed=anime_spyxfam', 'watching', '20/37', 8, '阿尼亚喜欢这个！', strftime('%s', 'now', '-10 days')),
('电锯人', 'https://api.paugram.com/wallpaper/?seed=anime_chainsaw', 'completed', '12/12', 8, 'MAPPA 的疯狂实验。', strftime('%s', 'now', '-80 days')),
('星际牛仔', 'https://api.paugram.com/wallpaper/?seed=anime_bebop', 'completed', '26/26', 10, '男人的浪漫，永恒的经典。', strftime('%s', 'now', '-120 days')),
('孤独摇滚！', 'https://api.paugram.com/wallpaper/?seed=anime_bocchi', 'completed', '12/12', 9, '社恐的终极共鸣，笑中带泪。', strftime('%s', 'now', '-70 days')),
('莉可丽丝', 'https://api.paugram.com/wallpaper/?seed=anime_lycoris', 'completed', '13/13', 8, '千束贴贴！', strftime('%s', 'now', '-85 days')),
('咒术回战', 'https://api.paugram.com/wallpaper/?seed=anime_jujutsu', 'watching', '35/47', 8, '天上天下，唯我独尊。', strftime('%s', 'now', '-15 days')),
('刀剑神域', 'https://api.paugram.com/wallpaper/?seed=anime_sao', 'completed', '25/25', 7, '梦开始的地方。', strftime('%s', 'now', '-200 days')),
('某科学的超电磁炮T', 'https://api.paugram.com/wallpaper/?seed=anime_railgun', 'completed', '25/25', 9, '指尖跃动的电光，是我此生不灭的信仰！', strftime('%s', 'now', '-150 days')),
('天气之子', 'https://api.paugram.com/wallpaper/?seed=anime_tenki', 'completed', '1/1', 8, '新海诚的又一力作。', strftime('%s', 'now', '-180 days')),
('夏日重现', 'https://api.paugram.com/wallpaper/?seed=anime_summertime', 'completed', '25/25', 9, '极其硬核的轮回系悬疑佳作。', strftime('%s', 'now', '-100 days')),
('我推的孩子', 'https://api.paugram.com/wallpaper/?seed=anime_oshinoko', 'completed', '11/11', 9, '开场核爆级别的冲击力。', strftime('%s', 'now', '-40 days')),
('无职转生', 'https://api.paugram.com/wallpaper/?seed=anime_mushoku', 'watching', '18/23', 9, '异世界天花板级别的制作。', strftime('%s', 'now', '-20 days')),
('命运石之门', 'https://api.paugram.com/wallpaper/?seed=anime_steinsgate', 'completed', '24/24', 10, '一切都是命运石之门的选择。', strftime('%s', 'now', '-250 days')),
('游戏人生', 'https://api.paugram.com/wallpaper/?seed=anime_ngnl', 'plan', '0/12', NULL, '空白永不败北，等二期等到天荒。', strftime('%s', 'now', '-300 days')),
('路人女主的养成方法', 'https://api.paugram.com/wallpaper/?seed=anime_saekano', 'plan', '0/13', NULL, '惠痴狂喜！', strftime('%s', 'now', '-280 days'));

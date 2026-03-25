-- 清空并净化脏数据
DELETE FROM animes;
DELETE FROM gallery;

INSERT INTO animes (title, cover_url, status, progress, rating, review, created_at) VALUES
('葬送的芙莉莲', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n1M8H1fUIfy9.jpg', 'watching', '6/12', 8, '时间与情感的沉淀。', strftime('%s', 'now', '-52 days')),
('鬼灭之刃 游郭篇', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142329-1y4qfX5H8D62.jpg', 'completed', '12/12', 9, '飞碟社的巅峰作画时刻！', strftime('%s', 'now', '-51 days')),
('进击的巨人 The Final Season', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx104578-laZZNMhEEcv5.jpg', 'completed', '12/12', 9, '史诗落幕。', strftime('%s', 'now', '-39 days')),
('紫罗兰永恒花园', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx97986-y1N1f1YQnd2H.jpg', 'completed', '12/12', 9, '京阿尼美学巅峰，每一帧都是壁纸。', strftime('%s', 'now', '-35 days')),
('赛博朋克：边缘行者', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx114755-kK6aYfE2L1d7.jpg', 'completed', '12/12', 9, '夜之城的悲歌，浪漫至极。', strftime('%s', 'now', '-5 days')),
('间谍过家家', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-Yl5glD6Ng2Uu.jpg', 'watching', '6/12', 8, '阿尼亚喜欢这个。', strftime('%s', 'now', '-19 days')),
('电锯人', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-Nu1hDntZWehP.jpg', 'completed', '12/12', 9, '好想揉欧派。', strftime('%s', 'now', '-11 days')),
('星际牛仔 (Cowboy Bebop)', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkLuX07B.png', 'completed', '12/12', 9, '男人的浪漫。', strftime('%s', 'now', '-5 days')),
('孤独摇滚！', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx130003-r1wBwZk1k1Hh.jpg', 'completed', '12/12', 9, '神机错乱的神作。', strftime('%s', 'now', '-45 days')),
('莉可丽丝 (Lycoris Recoil)', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx143270-13D9RymL2L9C.jpg', 'completed', '12/12', 9, '千束贴贴。', strftime('%s', 'now', '-47 days')),
('咒术回战', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg', 'watching', '6/12', 8, '天上天下，唯我独尊。', strftime('%s', 'now', '-4 days')),
('刀剑神域', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11757-QjKQJkK3P0sS.jpg', 'completed', '12/12', 9, '梦开始的地方。', strftime('%s', 'now', '-36 days')),
('某科学的超电磁炮T', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx104462-2O7mZ8rB0gX8.jpg', 'completed', '12/12', 9, '指尖跃动的电光，是我此生不灭的信仰！', strftime('%s', 'now', '-33 days')),
('天气之子', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx106286-Bf7x6DntE1f3.jpg', 'completed', '12/12', 9, '新海诚的又一重制。', strftime('%s', 'now', '-26 days')),
('夏日重现', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx128893-n2QzW8tS0U3w.png', 'completed', '12/12', 9, '极其硬核的轮回系。', strftime('%s', 'now', '-27 days')),
('我推的孩子', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx150672-1xQ31e13k5l1.png', 'completed', '12/12', 9, '开场核爆。', strftime('%s', 'now', '-40 days')),
('路人女主的养成方法', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20657-37S6DnsfK3M1.jpg', 'plan', '0/12', NULL, '惠痴狂喜。', strftime('%s', 'now', '-96 days')),
('无职转生', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx108465-B6hP18zU9wGE.jpg', 'watching', '6/12', 8, '异世界天花板。', strftime('%s', 'now', '-5 days')),
('游戏人生 NO GAME NO LIFE', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx19815-SsvbU0cId92j.png', 'plan', '0/12', NULL, '空白永不败北。', strftime('%s', 'now', '-28 days')),
('命运石之门', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9253-xkdLzF7G6B5Q.png', 'completed', '12/12', 9, '一切都是命运石之门的选择。', strftime('%s', 'now', '-31 days'));

INSERT INTO gallery (url, title, note, category, created_at) VALUES
('https://images.alphacoders.com/133/1330386.png', '空之归处', '破晓的光芒交织', 'illustration', strftime('%s', 'now', '-256 days')),
('https://images.alphacoders.com/132/1326402.png', '终末之诗', '色彩的无尽斑斓', 'concept', strftime('%s', 'now', '-158 days')),
('https://images.alphacoders.com/133/1331045.png', '夏日余光', '微风拂过的长发', 'wallpaper', strftime('%s', 'now', '-9 days')),
('https://images.alphacoders.com/132/1326543.png', '机能都市', '赛博世界的雨滴', 'concept', strftime('%s', 'now', '-5 days')),
('https://images.alphacoders.com/132/1329598.png', '放学后的教室', '少女与黄昏', 'life', strftime('%s', 'now', '-249 days')),
('https://images.alphacoders.com/131/1319200.png', '冰封黎明', '长冬的孤独前行者', 'wallpaper', strftime('%s', 'now', '-172 days')),
('https://images.alphacoders.com/132/1328904.png', '白鸟', '纯白色的礼赞', 'illustration', strftime('%s', 'now', '-77 days')),
('https://images.alphacoders.com/133/1330663.png', '幽谷的呼唤', '深渊之下也有星空', 'scenery', strftime('%s', 'now', '-157 days')),
('https://images.alphacoders.com/134/1340455.png', '剑之舞', '斩断一切虚无', 'illustration', strftime('%s', 'now', '-249 days')),
('https://images.alphacoders.com/132/1327179.png', '繁星落海', '极致深邃的宁静', 'wallpaper', strftime('%s', 'now', '-125 days')),
('https://images.alphacoders.com/133/1334994.png', '逆光飞行的鸟', '穿透云层的那道光', 'concept', strftime('%s', 'now', '-117 days')),
('https://images.alphacoders.com/133/1335002.png', '沉睡的魔女', '被封印千年的记忆', 'classic', strftime('%s', 'now', '-207 days')),
('https://images.alphacoders.com/133/1334998.png', '虚妄之城', '海市蜃楼中的都城', 'scenery', strftime('%s', 'now', '-132 days')),
('https://images.alphacoders.com/133/1330230.png', '樱花雪', '散落于此的最后温存', 'life', strftime('%s', 'now', '-234 days')),
('https://images.alphacoders.com/133/1330229.png', '异境探索', '未知的位面旅人', 'illustration', strftime('%s', 'now', '-275 days')),
('https://images.alphacoders.com/133/1330225.png', '破败的长廊', '生机从缝隙中长出', 'scenery', strftime('%s', 'now', '-233 days')),
('https://images.alphacoders.com/133/1330221.png', '暗夜之刃', '隐匿于黑暗的守护者', 'wallpaper', strftime('%s', 'now', '-297 days')),
('https://images.alphacoders.com/133/1330219.png', '微弱的心跳', '链接彼此的纽带', 'concept', strftime('%s', 'now', '-72 days')),
('https://images.alphacoders.com/134/1340458.png', '失落的神庙', '水底长眠的巨像', 'scenery', strftime('%s', 'now', '-166 days')),
('https://images.alphacoders.com/134/1340456.png', '无名之海', '蔚蓝之境的最深处', 'illustration', strftime('%s', 'now', '-132 days'));

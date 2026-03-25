const fs = require('fs');
const path = require('path');

// 绝对正宗、官方的番剧海报，拒绝随机生成导致图文不符
const trueAnimes = [
    { title: '葬送的芙莉莲', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n1M8H1fUIfy9.jpg', status: 'watching', review: '时间与情感的沉淀。' },
    { title: '鬼灭之刃 游郭篇', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142329-1y4qfX5H8D62.jpg', status: 'completed', review: '飞碟社的巅峰作画时刻！' },
    { title: '进击的巨人 The Final Season', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx104578-laZZNMhEEcv5.jpg', status: 'completed', review: '史诗落幕。' },
    { title: '紫罗兰永恒花园', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx97986-y1N1f1YQnd2H.jpg', status: 'completed', review: '京阿尼美学巅峰，每一帧都是壁纸。' },
    { title: '赛博朋克：边缘行者', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx114755-kK6aYfE2L1d7.jpg', status: 'completed', review: '夜之城的悲歌，浪漫至极。' },
    { title: '间谍过家家', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-Yl5glD6Ng2Uu.jpg', status: 'watching', review: '阿尼亚喜欢这个。' },
    { title: '电锯人', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-Nu1hDntZWehP.jpg', status: 'completed', review: '好想揉欧派。' },
    { title: '星际牛仔 (Cowboy Bebop)', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkLuX07B.png', status: 'completed', review: '男人的浪漫。' },
    { title: '孤独摇滚！', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx130003-r1wBwZk1k1Hh.jpg', status: 'completed', review: '神机错乱的神作。' },
    { title: '莉可丽丝 (Lycoris Recoil)', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx143270-13D9RymL2L9C.jpg', status: 'completed', review: '千束贴贴。' },
    { title: '咒术回战', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg', status: 'watching', review: '天上天下，唯我独尊。' },
    { title: '刀剑神域', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11757-QjKQJkK3P0sS.jpg', status: 'completed', review: '梦开始的地方。' },
    { title: '某科学的超电磁炮T', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx104462-2O7mZ8rB0gX8.jpg', status: 'completed', review: '指尖跃动的电光，是我此生不灭的信仰！' },
    { title: '天气之子', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx106286-Bf7x6DntE1f3.jpg', status: 'completed', review: '新海诚的又一重制。' },
    { title: '夏日重现', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx128893-n2QzW8tS0U3w.png', status: 'completed', review: '极其硬核的轮回系。' },
    { title: '我推的孩子', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx150672-1xQ31e13k5l1.png', status: 'completed', review: '开场核爆。' },
    { title: '路人女主的养成方法', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20657-37S6DnsfK3M1.jpg', status: 'plan', review: '惠痴狂喜。' },
    { title: '无职转生', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx108465-B6hP18zU9wGE.jpg', status: 'watching', review: '异世界天花板。' },
    { title: '游戏人生 NO GAME NO LIFE', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx19815-SsvbU0cId92j.png', status: 'plan', review: '空白永不败北。' },
    { title: '命运石之门', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9253-xkdLzF7G6B5Q.png', status: 'completed', review: '一切都是命运石之门的选择。' }
];

// 高质量图库 - 坚决屏蔽农田风景，纯正二次元人物/顶级氛围感无重复画作
const trueGallery = [
    { title: '空之归处', note: '破晓的光芒交织', url: 'https://images.alphacoders.com/133/1330386.png', category: 'illustration' },
    { title: '终末之诗', note: '色彩的无尽斑斓', url: 'https://images.alphacoders.com/132/1326402.png', category: 'concept' },
    { title: '夏日余光', note: '微风拂过的长发', url: 'https://images.alphacoders.com/133/1331045.png', category: 'wallpaper' },
    { title: '机能都市', note: '赛博世界的雨滴', url: 'https://images.alphacoders.com/132/1326543.png', category: 'concept' },
    { title: '放学后的教室', note: '少女与黄昏', url: 'https://images.alphacoders.com/132/1329598.png', category: 'life' },
    { title: '冰封黎明', note: '长冬的孤独前行者', url: 'https://images.alphacoders.com/131/1319200.png', category: 'wallpaper' },
    { title: '白鸟', note: '纯白色的礼赞', url: 'https://images.alphacoders.com/132/1328904.png', category: 'illustration' },
    { title: '幽谷的呼唤', note: '深渊之下也有星空', url: 'https://images.alphacoders.com/133/1330663.png', category: 'scenery' },
    { title: '剑之舞', note: '斩断一切虚无', url: 'https://images.alphacoders.com/134/1340455.png', category: 'illustration' },
    { title: '繁星落海', note: '极致深邃的宁静', url: 'https://images.alphacoders.com/132/1327179.png', category: 'wallpaper' },
    { title: '逆光飞行的鸟', note: '穿透云层的那道光', url: 'https://images.alphacoders.com/133/1334994.png', category: 'concept' },
    { title: '沉睡的魔女', note: '被封印千年的记忆', url: 'https://images.alphacoders.com/133/1335002.png', category: 'classic' },
    { title: '虚妄之城', note: '海市蜃楼中的都城', url: 'https://images.alphacoders.com/133/1334998.png', category: 'scenery' },
    { title: '樱花雪', note: '散落于此的最后温存', url: 'https://images.alphacoders.com/133/1330230.png', category: 'life' },
    { title: '异境探索', note: '未知的位面旅人', url: 'https://images.alphacoders.com/133/1330229.png', category: 'illustration' },
    { title: '破败的长廊', note: '生机从缝隙中长出', url: 'https://images.alphacoders.com/133/1330225.png', category: 'scenery' },
    { title: '暗夜之刃', note: '隐匿于黑暗的守护者', url: 'https://images.alphacoders.com/133/1330221.png', category: 'wallpaper' },
    { title: '微弱的心跳', note: '链接彼此的纽带', url: 'https://images.alphacoders.com/133/1330219.png', category: 'concept' },
    { title: '失落的神庙', note: '水底长眠的巨像', url: 'https://images.alphacoders.com/134/1340458.png', category: 'scenery' },
    { title: '无名之海', note: '蔚蓝之境的最深处', url: 'https://images.alphacoders.com/134/1340456.png', category: 'illustration' }
];

let sql = '';
// 1. 彻底清空表结构，拒绝一切之前随机占位符与脏数据
sql += '-- 清空并净化脏数据\n';
sql += 'DELETE FROM animes;\n';
sql += 'DELETE FROM gallery;\n\n';

// 2. 制备真实的番剧插入语句
sql += 'INSERT INTO animes (title, cover_url, status, progress, rating, review, created_at) VALUES\n';
const animeRows = trueAnimes.map((a, i) => {
    let progress = '';
    let rating = 'NULL';
    if (a.status === 'completed') { progress = '12/12'; rating = '9'; } 
    else if (a.status === 'watching') { progress = '6/12'; rating = '8'; }
    else { progress = '0/12'; }
    const dateOffset = Math.floor(Math.random() * 100); 
    return `('${a.title}', '${a.cover}', '${a.status}', '${progress}', ${rating}, '${a.review}', strftime('%s', 'now', '-${dateOffset} days'))`;
});
sql += animeRows.join(',\n') + ';\n\n';

// 3. 制备无杂质、无重复、超高清真实的图库壁纸
sql += 'INSERT INTO gallery (url, title, note, category, created_at) VALUES\n';
const galleryRows = trueGallery.map((g, i) => {
    const dateOffset = Math.floor(Math.random() * 300);
    return `('${g.url}', '${g.title}', '${g.note}', '${g.category}', strftime('%s', 'now', '-${dateOffset} days'))`;
});
sql += galleryRows.join(',\n') + ';\n';

const outPath = path.join(__dirname, '..', 'database', 'seed_purified_data.sql');
fs.writeFileSync(outPath, sql);
console.log(`Purified Data Seeding SQL generated at ${outPath}`);

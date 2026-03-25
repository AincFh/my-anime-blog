const fs = require('fs');
const path = require('path');

const titles = [
    '新世纪福音战士', '鬼灭之刃', '咒术回战', '葬送的芙莉莲', '孤独摇滚！', 
    '进击的巨人', '间谍过家家', '命运石之门', '电锯人', '我推的孩子',
    '夏目友人帐', '紫罗兰永恒花园', '冰菓', '轻音少女', '刀剑神域',
    '星际牛仔', '攻壳机动队', '钢之炼金术师 FA', 'CLANNAD', '四月是你的谎言',
    '声之形', '你的名字。', '天气之子', '铃芽之旅', '秒速五厘米',
    '言叶之庭', '斩服少女', '天元突破', '黑客帝国动画版', '未麻的部屋',
    '红辣椒', '千年女优', '穿越时空的少女', '夏日大作战', '狼的孩子雨和雪',
    '怪物之子', '未来的未来', '龙与雀斑公主', '机动战士高达：水星的魔女', '86-不存在的战区-',
    '莉可丽丝', '契约之吻', '赛博朋克：边缘行者', '双城之战', '万神殿',
    '辉夜大小姐想让我告白', '擅长捉弄的高木同学', '青春猪头少年不会梦到兔女郎学姐', '我的青春恋爱物语果然有问题', '路人女主的养成方法'
];

const reviews = [
    '神作无误，强烈推荐！', '画质爆炸，经费在燃烧', '剧情跌宕起伏，让人难以忘怀',
    '治愈人心的佳作，看完心里暖暖的', '热血沸腾，这就是青春啊', '催泪瓦斯，准备好纸巾',
    '设定新颖，脑洞大开', '配乐神级，单曲循环中', '人物刻画细腻，共鸣感强烈',
    '经典永不过时，值得反复回味', '制作精良，每一帧都能当壁纸', '虽然有瑕疵，但不失为一部好作品',
    '看一遍不够，二刷中...', '这结局我不能接受！', '日常番永远的神', '燃到炸裂，根本停不下来',
    '思考人生的哲学巨著', '轻松搞笑，下饭首选'
];

const statuses = ['watching', 'completed', 'dropped', 'plan'];

let sql = 'INSERT INTO animes (title, cover_url, status, progress, rating, review, created_at) VALUES\n';
const rows = [];
const TOTAL_RECORDS = titles.length;

for (let i = 0; i < TOTAL_RECORDS; i++) {
    const seed = Math.random().toString(36).substring(2, 9);
    
    let url = `https://api.paugram.com/wallpaper/?seed=${seed}`;
    if (i % 6 === 0) {
       url = `https://picsum.photos/seed/${seed}/1920/1080`;
    }

    const title = titles[i];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    let progress = '';
    let rating = 'NULL';
    
    if (status === 'completed') {
        const total = Math.floor(Math.random() * 24) + 12;
        progress = `${total}/${total}`;
        rating = Math.floor(Math.random() * 5) + 6; // 6-10 分
    } else if (status === 'watching') {
        const current = Math.floor(Math.random() * 12) + 1;
        progress = `${current}/12`;
        rating = Math.floor(Math.random() * 5) + 6;
    } else if (status === 'dropped') {
         progress = `${Math.floor(Math.random() * 5) + 1}/?`;
    } else {
        progress = '0/12';
    }

    const review = reviews[Math.floor(Math.random() * reviews.length)];
    const dateOffset = Math.floor(Math.random() * 800); 
    
    rows.push(`('${title}', '${url}', '${status}', '${progress}', ${rating}, '${review}', strftime('%s', 'now', '-${dateOffset} days'))`);
}

sql += rows.join(',\n') + ';';

const outPath = path.join(__dirname, '..', 'database', 'seed_animes_massive.sql');
fs.writeFileSync(outPath, sql);
console.log(`Massive anime seed generated at ${outPath} with ${TOTAL_RECORDS} records.`);

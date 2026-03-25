const fs = require('fs');
const path = require('path');

const categories = ['scenery', 'concept', 'life', 'illustration', 'wallpaper', 'classic'];
const titles = ['破晓', '雨后', '星空之下', '旅途的起点', '不可视境界线', '梦醒时分', '时光机', '初雪', '羁绊', '绝对领域', '魔女的茶会', '赛博天空', '遗迹探索', '夏日微风', '深海少女', '午后回廊', '花火大会', '黄昏街道', '神隐', '雪之镇'];
const notes = ['不可思议的光影交融', '壁纸首选，色彩饱满', '意境拉满的绝佳构图', '充满氛围感的定格瞬间', '这是一张有故事的相片', '动漫巡礼名场面', '值得收藏的超清原画', '来自深渊的呼唤', '穿越两千年的思念'];

let sql = 'INSERT INTO gallery (url, title, note, category, created_at) VALUES\n';
const rows = [];
const TOTAL_RECORDS = 45;

for (let i = 0; i < TOTAL_RECORDS; i++) {
    const seed = Math.random().toString(36).substring(2, 9);
    
    // 主力使用 Paugram 动漫高品质二次元 API，并混合少许通用高画质随机图避免频控
    let url = `https://api.paugram.com/wallpaper/?seed=${seed}`;
    if (i % 7 === 0) {
       // 每 7 张图用一种别的二次元随机服务或 Picsum 高清占位替代，防止防盗链封锁
       url = `https://picsum.photos/seed/${seed}/1920/1080`;
    }

    const title = titles[Math.floor(Math.random() * titles.length)] + ` · 第 ${i + 1} 卷`;
    const note = notes[Math.floor(Math.random() * notes.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const dateOffset = Math.floor(Math.random() * 800); // 长达两年多的时间跨度，打乱排序
    
    rows.push(`('${url}', '${title}', '${note}', '${category}', strftime('%s', 'now', '-${dateOffset} days'))`);
}

sql += rows.join(',\n') + ';';

const outPath = path.join(__dirname, '..', 'database', 'seed_gallery_massive.sql');
fs.writeFileSync(outPath, sql);
console.log(`Massive seed generated at ${outPath} with ${TOTAL_RECORDS} records.`);

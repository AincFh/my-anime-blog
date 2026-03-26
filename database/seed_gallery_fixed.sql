-- 清空旧的被防盗链拦截的脏图
DELETE FROM gallery;

-- 使用绝对可直链的图源（Pixiv 代理 + Paugram ACG API 带唯一种子防重复）
INSERT INTO gallery (url, title, note, category, created_at) VALUES
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf01', '破晓之光', '光影流转的二次元绝色', 'illustration', strftime('%s', 'now', '-10 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf02', '夏日余韵', '微风中的发丝与温度', 'life', strftime('%s', 'now', '-20 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf03', '星空深潜', '仰望时感受到的浩瀚', 'scenery', strftime('%s', 'now', '-30 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf04', '花火大会', '夜空中绽放的瞬间定格', 'life', strftime('%s', 'now', '-40 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf05', '机甲黄昏', '钢铁意志与落日遥望', 'concept', strftime('%s', 'now', '-50 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf06', '猫与少女', '窗台上的慵懒午后', 'illustration', strftime('%s', 'now', '-60 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf07', '赛博旅人', '霓虹与雨的交叠', 'concept', strftime('%s', 'now', '-70 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf08', '初雪的街道', '静谧的小镇白色覆盖', 'scenery', strftime('%s', 'now', '-80 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf09', '教室里的告别', '放学后最后的光影', 'life', strftime('%s', 'now', '-90 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf10', '深渊凝视', '来自深处的低语回响', 'wallpaper', strftime('%s', 'now', '-100 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf11', '刀剑舞姬', '银色刃光的轨迹', 'illustration', strftime('%s', 'now', '-5 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf12', '云端城堡', '天空之上的秘密王国', 'scenery', strftime('%s', 'now', '-15 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf13', '夜航列车', '穿越夜色的银河铁道', 'concept', strftime('%s', 'now', '-25 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf14', '樱吹雪', '粉色花瓣雨中的沉思', 'wallpaper', strftime('%s', 'now', '-35 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf15', '海底信箱', '投递给深海的思念', 'illustration', strftime('%s', 'now', '-45 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf16', '废墟花园', '荒芜中绽放的生机', 'scenery', strftime('%s', 'now', '-55 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf17', '电波少女', '信号交错的脉冲世界', 'concept', strftime('%s', 'now', '-65 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf18', '雨后天台', '乌云散去后的彩虹', 'life', strftime('%s', 'now', '-75 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf19', '月下起舞', '银色月光的旋律', 'wallpaper', strftime('%s', 'now', '-85 days')),
('https://api.paugram.com/wallpaper/?seed=aW1hZ2Vf20', '告白的季节', '樱花树下的勇气', 'life', strftime('%s', 'now', '-95 days'));

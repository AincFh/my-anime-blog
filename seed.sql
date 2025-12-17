-- 填充更多测试数据 (Seed Data)

-- 1. 文章数据 (Articles)
INSERT INTO articles (slug, title, description, content, category, cover_image, tags, mood_color, views, likes, created_at) VALUES 
(
    'react-router-v7-guide', 
    'React Router v7 尝鲜体验', 
    '全面解析 React Router v7 的新特性，以及它是如何改变 Remix 生态的。', 
    '# React Router v7 尝鲜体验\n\nReact Router v7 终于发布了！作为一个长期使用 Remix 的开发者，这次更新让我感到非常兴奋。\n\n## 核心变化\n\n1. **合并 Remix**: 是的，Remix 的核心功能现在直接集成到了 React Router 中。\n2. **Type Safety**: 路由参数和 Loader 数据现在拥有了更好的类型推断。\n\n## 代码示例\n\n```tsx\nimport { useLoaderData } from "react-router";\n\nexport async function loader() {\n  return { message: "Hello v7!" };\n}\n```\n\n## 总结\n\n升级过程非常顺滑，强烈推荐大家尝试！', 
    '技术', 
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80', 
    '["React", "Frontend", "Web"]', 
    '#61DAFB',
    1205,
    45,
    strftime('%s', 'now', '-5 days')
),
(
    'frieren-review', 
    '葬送的芙莉莲：时间与记忆的温柔史诗', 
    '这不是关于打败魔王的故事，而是关于之后的故事。', 
    '# 葬送的芙莉莲\n\n"勇者辛美尔死后28年..."\n\n## 时间的重量\n\n对于精灵来说，十年不过是一眨眼。但对于人类来说，那是漫长的一生。芙莉莲在辛美尔死后，终于开始理解"时间"对于人类的意义。\n\n![Frieren](https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80)\n\n## 即使是微不足道的魔法\n\n"变出花田的魔法"，听起来毫无用处，但却是辛美尔最喜欢的魔法。因为它能让人露出笑容。\n\n:::spoiler[剧透警告]\n最后见到辛美尔灵魂的那一刻，我真的哭死。\n:::\n\n这是一部需要静下心来慢慢品味的作品。', 
    '动漫', 
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80', 
    '["治愈", "奇幻", "神作"]', 
    '#E2E8F0',
    3402,
    128,
    strftime('%s', 'now', '-10 days')
),
(
    'cyberpunk-edgerunners', 
    '赛博朋克：边缘行者 - 飞向月球', 
    'I really want to stay at your house.', 
    '# 赛博朋克：边缘行者\n\n"Lucy, I made it to the moon."\n\n## 极致的视觉风格\n\n扳机社（Trigger）独特的色彩运用和夸张的动态表现，完美契合了夜之城光怪陆离的氛围。\n\n## 宿命感\n\n在大卫身上，我们看到了典型的赛博朋克式悲剧：小人物试图反抗体制，最终燃烧殆尽。\n\n> "你不是特别的，大卫。"\n\n但对于露西来说，他就是唯一的特别。', 
    '动漫', 
    'https://images.unsplash.com/photo-1535378437327-b71494669e80?w=800&q=80', 
    '["Cyberpunk", "Netflix", "Trigger"]', 
    '#Facc15',
    8901,
    560,
    strftime('%s', 'now', '-20 days')
),
(
    'cloudflare-workers-deploy', 
    '使用 Cloudflare Workers 部署全栈应用', 
    '如何利用边缘计算构建高性能的全球化应用。', 
    '# Cloudflare Workers 部署指南\n\n传统的 Serverless 可能还有冷启动问题，但 Workers 是基于 V8 Isolate 的，几乎是 0ms 启动。\n\n## 为什么选择 Workers?\n\n1. **全球分布**: 代码运行在离用户最近的节点。\n2. **免费额度**: 每天 10 万次请求，对个人开发者极其友好。\n3. **KV & D1**: 配套的存储方案非常完善。\n\n## 坑点\n\nNode.js API 的兼容性虽然在提升，但还是有一些库无法直接使用。需要注意 Polyfill。', 
    '技术', 
    'https://images.unsplash.com/photo-1544197150-b99a580bbcbf?w=800&q=80', 
    '["Cloudflare", "Serverless", "DevOps"]', 
    '#F48120',
    560,
    23,
    strftime('%s', 'now', '-2 days')
),
(
    'genshin-impact-natlan', 
    '原神：纳塔前瞻分析', 
    '火之国纳塔即将开启，战争与复活的乐章。', 
    '# 纳塔前瞻\n\n根据最新的 PV，纳塔的设计风格充满了南美和非洲的部落元素。\n\n## 龙的国度\n\n与我们想象中的巨龙不同，纳塔的龙似乎更像是与人类共存的伙伴。\n\n## 队长\n\n愚人众执行官"队长"的战力一直是谜，期待他在纳塔的表现。', 
    '游戏', 
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', 
    '["原神", "米哈游", "游戏"]', 
    '#FF6B6B',
    12003,
    890,
    strftime('%s', 'now', '-1 days')
);

-- 2. 番剧数据 (Animes)
INSERT INTO animes (title, cover_url, status, progress, rating, review, created_at) VALUES
('孤独摇滚！', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80', 'completed', '12/12', 10, '波奇酱太可爱了！社恐人的真实写照。音乐也超级好听。', strftime('%s', 'now', '-30 days')),
('进击的巨人', 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=800&q=80', 'completed', '89/89', 10, '史诗级的叙事，从热血漫到政治隐喻的完美转型。献出心脏！', strftime('%s', 'now', '-60 days')),
('间谍过家家', 'https://images.unsplash.com/photo-1560167164-616028d8d672?w=800&q=80', 'watching', '18/25', 9, '阿尼亚 waku waku！非常适合放松的合家欢动画。', strftime('%s', 'now', '-5 days')),
('命运石之门', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80', 'completed', '24/24', 10, 'El Psy Kongroo. 这一切都是命运石之门的选择。前期慢热，后期封神。', strftime('%s', 'now', '-100 days')),
('电锯人', 'https://images.unsplash.com/photo-1620559029047-e752f383538b?w=800&q=80', 'completed', '12/12', 8, '好耶！电影感十足的分镜。玛奇玛小姐...我是你的狗！', strftime('%s', 'now', '-40 days')),
('我推的孩子', 'https://images.unsplash.com/photo-1529335764857-3f1164d1e247?w=800&q=80', 'watching', '8/11', 9, '第一集就是王炸。对演艺圈黑暗面的描写很深刻。', strftime('%s', 'now', '-3 days'));

-- 3. 评论数据 (Comments)
-- 假设文章ID 1-5 对应上面的文章
INSERT INTO comments (article_id, author, content, is_danmaku, status, created_at) VALUES
(1, 'RemixFan', 'v7 的改动确实很大，不过向后兼容做得不错。', 0, 'approved', strftime('%s', 'now', '-4 days')),
(1, 'FrontendDev', 'Loader 的类型推断终于好用了！', 1, 'approved', strftime('%s', 'now', '-4 days')),
(2, 'ElfMage', '辛美尔虽然死了，但他永远活在芙莉莲的回忆里。', 0, 'approved', strftime('%s', 'now', '-9 days')),
(2, 'HeroParty', '这一段看哭了+1', 1, 'approved', strftime('%s', 'now', '-9 days')),
(3, 'David', '没有你的月球，毫无意义。', 0, 'approved', strftime('%s', 'now', '-19 days')),
(3, 'Rebecca', '扳机社牛逼！', 1, 'approved', strftime('%s', 'now', '-19 days')),
(4, 'ServerlessUser', 'D1 的性能怎么样？适合生产环境吗？', 0, 'approved', strftime('%s', 'now', '-1 days')),
(5, 'Traveler', '火神什么时候进卡池？', 1, 'approved', strftime('%s', 'now', '-12 hours'));

-- 4. 插入一些待审核评论 (用于测试后台)
INSERT INTO comments (article_id, author, content, is_danmaku, status, created_at) VALUES
(1, 'Spammer', '点击这里领取免费 iPhone！', 0, 'pending', strftime('%s', 'now', '-1 hour')),
(2, 'NewUser', '博主写得真好，求互粉~', 0, 'pending', strftime('%s', 'now', '-2 hours')),
(3, 'Hater', '这番过誉了吧？', 1, 'pending', strftime('%s', 'now', '-3 hours'));

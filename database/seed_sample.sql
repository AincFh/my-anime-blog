-- 添加示例文章数据 (适配现有表结构)
INSERT INTO articles (slug, title, content, category, cover_image, tags, views, likes, created_at) VALUES 
('hello-world', '欢迎来到 A.T. Field', '# 欢迎来到 A.T. Field

这是我的**绝对领域**。在这里，我会分享关于动漫、游戏和技术的一切。

## 关于本站

本站基于 Cloudflare 全栈构建，追求极致的视觉体验和流畅的交互。

## 未来计划

- 分享更多动漫评测
- 技术学习笔记
- 游戏攻略', '公告', NULL, '["博客", "公告"]', 128, 15, strftime('%s', 'now', '-5 days'))
ON CONFLICT(slug) DO NOTHING;

INSERT INTO articles (slug, title, content, category, cover_image, tags, views, likes, created_at) VALUES 
('frieren-review', '葬送的芙莉莲：时间与记忆的温柔史诗', '# 葬送的芙莉莲

"勇者辛美尔死后28年..."

## 时间的重量

对于精灵来说，十年不过是一眨眼。但对于人类来说，那是漫长的一生。芙莉莲在辛美尔死后，终于开始理解"时间"对于人类的意义。

## 即使是微不足道的魔法

"变出花田的魔法"，听起来毫无用处，但却是辛美尔最喜欢的魔法。因为它能让人露出笑容。

## 评分: 9.5/10

这是一部需要静下心来慢慢品味的作品。', '动漫', NULL, '["治愈", "奇幻", "神作"]', 3402, 128, strftime('%s', 'now', '-10 days'))
ON CONFLICT(slug) DO NOTHING;

INSERT INTO articles (slug, title, content, category, cover_image, tags, views, likes, created_at) VALUES 
('cloudflare-workers-guide', '使用 Cloudflare Workers 部署全栈应用', '# Cloudflare Workers 部署指南

传统的 Serverless 可能还有冷启动问题，但 Workers 是基于 V8 Isolate 的，几乎是 0ms 启动。

## 为什么选择 Workers?

1. **全球分布**: 代码运行在离用户最近的节点
2. **免费额度**: 每天 10 万次请求，对个人开发者极其友好
3. **KV & D1**: 配套的存储方案非常完善

## 核心概念

Workers 使用标准的 Web API，包括 fetch、Request、Response 等。

## 坑点

Node.js API 的兼容性虽然在提升，但还是有一些库无法直接使用。', '技术', NULL, '["Cloudflare", "Serverless", "DevOps"]', 560, 23, strftime('%s', 'now', '-2 days'))
ON CONFLICT(slug) DO NOTHING;

-- 添加示例番剧数据
INSERT OR IGNORE INTO animes (title, cover_url, status, progress, rating, review, created_at) VALUES
('孤独摇滚！', NULL, 'completed', '12/12', 10, '波奇酱太可爱了！社恐人的真实写照。', strftime('%s', 'now', '-30 days'));

INSERT OR IGNORE INTO animes (title, cover_url, status, progress, rating, review, created_at) VALUES
('进击的巨人', NULL, 'completed', '89/89', 10, '史诗级的叙事，献出心脏！', strftime('%s', 'now', '-60 days'));

INSERT OR IGNORE INTO animes (title, cover_url, status, progress, rating, review, created_at) VALUES
('间谍过家家', NULL, 'watching', '18/25', 9, '阿尼亚 waku waku！', strftime('%s', 'now', '-5 days'));

INSERT OR IGNORE INTO animes (title, cover_url, status, progress, rating, review, created_at) VALUES
('葬送的芙莉莲', NULL, 'watching', '20/28', 10, '时间与记忆的温柔史诗', strftime('%s', 'now', '-1 days'));

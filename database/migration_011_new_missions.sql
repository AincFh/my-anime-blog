-- ================================================
-- 新增任务系统任务 (Expanded Mission System)
-- ================================================

-- 插入新的日常任务（使用 INSERT OR IGNORE 避免重复）
INSERT OR IGNORE INTO missions (id, name, description, reward_coins, reward_exp, type, target_action, target_count, sort_order) VALUES
-- 原有任务（确保 id 不冲突）
-- 阅读文章 (原有 id='article_reader')
-- 点赞内容 (新)
('like_content', '点赞达人', '为喜欢的内容点赞', 3, 2, 'daily', 'like', 3, 5),
-- 分享文章 (新)
('share_article', '社交达人', '分享精彩内容', 8, 5, 'daily', 'share', 1, 6),
-- 观看问答 (新) - 每日问答/答题活动
('daily_quiz', '每日问答', '完成每日答题挑战', 10, 8, 'daily', 'quiz_complete', 1, 7),
-- 看广告赚星尘 (新) - 核心变现桥梁
('watch_ad', '观看广告', '观看广告视频获取星尘', 2, 1, 'daily', 'watch_ad', 3, 8),
-- 周常任务
('weekly_article_publish', '内容创作者', '本周发布1篇文章', 100, 80, 'weekly', 'publish_article', 1, 15),
-- 月度任务
('monthly_likes_given', '月度点赞之星', '本月累计点赞100次', 150, 100, 'monthly', 'like', 100, 25),
-- 成就型任务
('first_share', '首次分享', '首次分享文章', 20, 10, 'achievement', 'share', 1, 30),
('first_quiz', '答题新手', '首次完成每日问答', 30, 20, 'achievement', 'quiz_complete', 1, 31),
('ad_watcher_10', '广告体验官', '累计观看50次广告', 100, 50, 'achievement', 'watch_ad', 50, 32);

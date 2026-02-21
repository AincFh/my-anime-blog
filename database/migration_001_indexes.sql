-- ================================================
-- 迁移 001: 核心查询索引优化
-- 执行时间: 2026-01-16
-- 目的: 优化文章列表和评论列表查询性能
-- ================================================

-- ==================== 文章表索引 ====================

-- 文章列表查询优化 (按状态筛选 + 时间倒序)
-- 常见查询: SELECT * FROM articles WHERE status = 'published' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_articles_status_created 
ON articles(status, created_at DESC);

-- 分类筛选优化
-- 常见查询: SELECT * FROM articles WHERE category = ? AND status = 'published'
CREATE INDEX IF NOT EXISTS idx_articles_category_status 
ON articles(category, status);

-- ==================== 评论表索引 ====================

-- 文章评论列表查询优化 (按文章筛选 + 时间倒序)
-- 常见查询: SELECT * FROM comments WHERE article_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_comments_article_created 
ON comments(article_id, created_at DESC);

-- 用户评论查询优化
-- 常见查询: SELECT * FROM comments WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_comments_user_created 
ON comments(user_id, created_at DESC);

-- ==================== 番剧表索引 ====================

-- 番剧列表查询优化 (按状态筛选)
CREATE INDEX IF NOT EXISTS idx_animes_status 
ON animes(status);

-- ==================== 验证索引创建 ====================
-- 执行以下 SQL 验证索引是否创建成功:
-- SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%';

-- ==================== 预期查询计划改进 ====================
-- 执行前: SCAN TABLE articles
-- 执行后: SEARCH TABLE articles USING INDEX idx_articles_status_created
-- 
-- 使用 EXPLAIN QUERY PLAN 验证:
-- EXPLAIN QUERY PLAN SELECT * FROM articles WHERE status = 'published' ORDER BY created_at DESC LIMIT 10;

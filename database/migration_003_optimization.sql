-- 优化索引
-- 提升首页和文章列表页的查询性能

-- 1. 首页"最新文章"查询优化
CREATE INDEX IF NOT EXISTS idx_articles_status_created ON articles(status, created_at DESC);

-- 2. 首页"追番记录"查询优化
CREATE INDEX IF NOT EXISTS idx_animes_status_idx ON animes(status);

-- 3. 文章列表页"分类筛选"优化
CREATE INDEX IF NOT EXISTS idx_articles_category_status ON articles(category, status);

-- 4. Slug 查找优化 (理论上已有 UNIQUE 约束，但显式覆盖索引可能更快)
CREATE INDEX IF NOT EXISTS idx_articles_slug_status ON articles(slug, status);

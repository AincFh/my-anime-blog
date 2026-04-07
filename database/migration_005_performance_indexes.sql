-- 性能优化迁移：添加缺失索引
-- 执行时间：2026-04-04

-- 1. Gallery category 索引（加速分类筛选）
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category);

-- 2. Sessions 复合索引（加速会话验证查询）
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires_at);

-- 3. Users email 索引（加速登录查询）
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 4. Comments article_id + status 索引（加速评论列表加载）
CREATE INDEX IF NOT EXISTS idx_comments_article_status ON comments(article_id, status);

-- 5. Coin transactions 索引（加速用户积分流水查询）
CREATE INDEX IF NOT EXISTS idx_coin_trans_user_created ON coin_transactions(user_id, created_at DESC);

-- 6. Articles category + status 索引（加速文章列表筛选）
CREATE INDEX IF NOT EXISTS idx_articles_category_status ON articles(category, status);

-- 7. User purchases 索引（加速用户背包查询）
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_item ON user_purchases(user_id, item_id);
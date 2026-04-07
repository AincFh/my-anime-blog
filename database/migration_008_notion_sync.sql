-- Migration: Add Notion integration fields to articles table
-- Date: 2026-04-06
-- Purpose: Support syncing articles from Notion database

-- 添加 Notion 相关字段
ALTER TABLE articles ADD COLUMN notion_id TEXT;
ALTER TABLE articles ADD COLUMN source TEXT DEFAULT 'local';  -- 'local' | 'notion'
ALTER TABLE articles ADD COLUMN notion_url TEXT;              -- Notion 页面链接
ALTER TABLE articles ADD COLUMN last_synced_at INTEGER;       -- 最后同步时间

-- 添加索引优化查询
CREATE INDEX IF NOT EXISTS idx_articles_notion_id ON articles(notion_id);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);

-- 更新现有文章为本地来源
UPDATE articles SET source = 'local' WHERE source IS NULL OR source = '';

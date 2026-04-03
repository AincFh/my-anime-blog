-- 数据库补丁 v2: 触发器与索引增强
-- 核心哲学：自动化同步 & 字段防御

-- 1. 为 articles 添加 updated_at 自动更新触发器
CREATE TRIGGER IF NOT EXISTS articles_update_time AFTER UPDATE ON articles
BEGIN
    UPDATE articles SET updated_at = unixepoch() WHERE id = new.id;
END;

-- 2. 为 articles_fts 添加 UPDATE 触发器（解决搜索过时问题）
CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
    INSERT INTO articles_fts(articles_fts, rowid, title, content)
        VALUES('delete', old.id, old.title, old.content);
    INSERT INTO articles_fts(rowid, title, content)
        VALUES(new.id, new.title, new.content);
END;

-- 3. 补全评论表索引
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);

-- 4. 修复评论表 INSERT 规范（如果之前手动加过 author 字段，可以执行此清理，但通常只需对齐代码）
-- ALTER TABLE comments ADD COLUMN author TEXT; -- 仅当代码无法适配 schema 时使用，目前已在代码侧对齐。

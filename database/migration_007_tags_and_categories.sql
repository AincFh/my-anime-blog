-- 标签和分类表
-- 用于管理文章的标签和分类

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at INTEGER DEFAULT (unixepoch())
);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch())
);

-- 插入默认标签
INSERT OR IGNORE INTO tags (name, color) VALUES ('React', '#3B82F6');
INSERT OR IGNORE INTO tags (name, color) VALUES ('随笔', '#10B981');
INSERT OR IGNORE INTO tags (name, color) VALUES ('技术', '#8B5CF6');
INSERT OR IGNORE INTO tags (name, color) VALUES ('动漫', '#EF4444');
INSERT OR IGNORE INTO tags (name, color) VALUES ('游戏', '#F59E0B');
INSERT OR IGNORE INTO tags (name, color) VALUES ('设计', '#EC4899');

-- 插入默认分类
INSERT OR IGNORE INTO categories (name, sort_order) VALUES ('随笔', 1);
INSERT OR IGNORE INTO categories (name, sort_order) VALUES ('技术', 2);
INSERT OR IGNORE INTO categories (name, sort_order) VALUES ('动漫', 3);
INSERT OR IGNORE INTO categories (name, sort_order) VALUES ('游戏', 4);

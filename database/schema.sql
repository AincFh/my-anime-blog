-- 1. 文章表 (Grimoires) - 增强版
DROP TABLE IF EXISTS articles;
CREATE TABLE articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,        -- URL 友好路径
    title TEXT NOT NULL,
    content TEXT NOT NULL,            -- Markdown 源码
    summary TEXT,                     -- 摘要
    cover_image TEXT,                 -- 封面图 URL (R2)
    category TEXT,                    -- 分类
    tags TEXT,                        -- JSON 数组: ["React", "二次元"]
    mood_color TEXT,                  -- 文章代表色（用于动态主题，如 #60A5FA）
    
    -- 状态控制
    status TEXT DEFAULT 'published',  -- 'draft', 'published', 'hidden'
    allow_comment INTEGER DEFAULT 1,  -- BOOLEAN
    
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,          -- 简单计数
    
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- 2. 番剧/游戏记录表 (Otaku Log)
DROP TABLE IF EXISTS animes;
CREATE TABLE animes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,             -- 作品名
    cover_url TEXT,                  -- 封面
    status TEXT CHECK(status IN ('watching', 'completed', 'dropped', 'plan')), -- 状态
    progress TEXT,                   -- 进度 (e.g. "12/24")
    rating INTEGER,                  -- 评分 (1-10)
    rating_radar TEXT,               -- 雷达图数据 (JSON格式: {"plot":8,"animation":9,"voice":7,"music":8,"character":9,"passion":10})
    review TEXT,                     -- 短评
    created_at INTEGER DEFAULT (unixepoch())
);

-- 3. 用户表 (Adventurers) - 支持RPG属性和邮箱登录
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,      -- 使用 bcrypt 或 argon2 加密
    username TEXT DEFAULT '旅行者',
    avatar_url TEXT,                  -- R2 链接
    role TEXT DEFAULT 'user',         -- 'admin' 或 'user'
    
    -- RPG 属性
    level INTEGER DEFAULT 1,
    exp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,          -- 代币
    achievements TEXT,                -- JSON数组，存储成就ID，如 ['night_owl', 'combo_master']
    bio TEXT,                         -- 个人简介
    preferences TEXT DEFAULT '{}',    -- 用户偏好设置 JSON
    
    created_at INTEGER DEFAULT (unixepoch())
);

-- 4. 会话表 (Soul Links) - 支持多设备登录和后台踢人
DROP TABLE IF EXISTS sessions;
CREATE TABLE sessions (
    token TEXT PRIMARY KEY,           -- 随机生成的长字符串
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,      -- 过期时间戳
    user_agent TEXT,                  -- 设备信息
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. 评论与弹幕 (Echoes) - 增强版
DROP TABLE IF EXISTS comments;
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER,              -- 关联文章ID（可为NULL，表示全局评论）
    user_id INTEGER,                 -- 关联用户 (如果是游客则为 NULL)
    guest_name TEXT,                 -- 游客昵称
    content TEXT NOT NULL,
    
    -- 互动属性
    is_danmaku INTEGER DEFAULT 0,    -- 是否作为弹幕显示 (0/1)
    sticker_url TEXT,                -- 如果是贴纸评论
    position_x INTEGER,              -- 贴纸/划词的坐标 (可选)
    position_y INTEGER,
    avatar_style TEXT,               -- 像素头像ID（随机生成）
    
    status TEXT DEFAULT 'approved',  -- 'pending', 'approved', 'spam'
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. 全文搜索虚拟表 (FTS5)
DROP TABLE IF EXISTS articles_fts;
CREATE VIRTUAL TABLE articles_fts USING fts5(title, content, content='articles', content_rowid='id');

-- 触发器：保持 FTS 表与 articles 同步
DROP TRIGGER IF EXISTS articles_ai;
CREATE TRIGGER articles_ai AFTER INSERT ON articles BEGIN
  INSERT INTO articles_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;

DROP TRIGGER IF EXISTS articles_ad;
CREATE TRIGGER articles_ad AFTER DELETE ON articles BEGIN
  INSERT INTO articles_fts(articles_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
END;

VALUES 
('新世纪福音战士', 'completed', '26/26', 10, '神作！A.T. Field 的概念太震撼了。'),
('鬼灭之刃', 'completed', '26/26', 9, '作画精美，剧情紧凑。'),
('咒术回战', 'watching', '15/24', 8, '战斗场面很棒，期待后续发展。'),
('葬送的芙莉莲', 'plan', '0/28', NULL, '听说很治愈，准备补番。');

-- 7. 系统配置表 (The Core)
-- 单行记录，存储全站设置
DROP TABLE IF EXISTS system_config;
DROP TABLE IF EXISTS system_settings;
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    config_json TEXT NOT NULL,       -- 存储所有开关、主题色、SEO信息的 JSON
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 1. 鏂囩珷琛?(Grimoires) - 澧炲己鐗?
DROP TABLE IF EXISTS articles;
CREATE TABLE articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,        -- URL 鍙嬪ソ璺緞
    title TEXT NOT NULL,
    content TEXT NOT NULL,            -- Markdown 婧愮爜
    summary TEXT,                     -- 鎽樿
    cover_image TEXT,                 -- 灏侀潰鍥?URL (R2)
    category TEXT,                    -- 鍒嗙被
    tags TEXT,                        -- JSON 鏁扮粍: ["React", "浜屾鍏?]
    mood_color TEXT,                  -- 鏂囩珷浠ｈ〃鑹诧紙鐢ㄤ簬鍔ㄦ€佷富棰橈紝濡?#60A5FA锛?
    
    -- 鐘舵€佹帶鍒?
    status TEXT DEFAULT 'published',  -- 'draft', 'published', 'hidden'
    allow_comment INTEGER DEFAULT 1,  -- BOOLEAN
    
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,          -- 绠€鍗曡鏁?
    
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- 2. 鐣墽/娓告垙璁板綍琛?(Otaku Log)
DROP TABLE IF EXISTS animes;
CREATE TABLE animes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,             -- 浣滃搧鍚?
    cover_url TEXT,                  -- 灏侀潰
    status TEXT CHECK(status IN ('watching', 'completed', 'dropped', 'plan')), -- 鐘舵€?
    progress TEXT,                   -- 杩涘害 (e.g. "12/24")
    rating INTEGER,                  -- 璇勫垎 (1-10)
    rating_radar TEXT,               -- 闆疯揪鍥炬暟鎹?(JSON鏍煎紡: {"plot":8,"animation":9,"voice":7,"music":8,"character":9,"passion":10})
    review TEXT,                     -- 鐭瘎
    created_at INTEGER DEFAULT (unixepoch())
);

-- 3. 鐢ㄦ埛琛?(Adventurers) - 鏀寔RPG灞炴€у拰閭鐧诲綍
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,      -- 浣跨敤 bcrypt 鎴?argon2 鍔犲瘑
    username TEXT DEFAULT '鏃呰鑰?,
    avatar_url TEXT,                  -- R2 閾炬帴
    role TEXT DEFAULT 'user',         -- 'admin' 鎴?'user'
    
    -- RPG 灞炴€?
    level INTEGER DEFAULT 1,
    exp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,          -- 浠ｅ竵
    achievements TEXT,                -- JSON鏁扮粍锛屽瓨鍌ㄦ垚灏盜D锛屽 ['night_owl', 'combo_master']
    
    created_at INTEGER DEFAULT (unixepoch())
);

-- 4. 浼氳瘽琛?(Soul Links) - 鏀寔澶氳澶囩櫥褰曞拰鍚庡彴韪汉
DROP TABLE IF EXISTS sessions;
CREATE TABLE sessions (
    token TEXT PRIMARY KEY,           -- 闅忔満鐢熸垚鐨勯暱瀛楃涓?
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,      -- 杩囨湡鏃堕棿鎴?
    user_agent TEXT,                  -- 璁惧淇℃伅
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. 璇勮涓庡脊骞?(Echoes) - 澧炲己鐗?
DROP TABLE IF EXISTS comments;
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER,              -- 鍏宠仈鏂囩珷ID锛堝彲涓篘ULL锛岃〃绀哄叏灞€璇勮锛?
    user_id INTEGER,                 -- 鍏宠仈鐢ㄦ埛 (濡傛灉鏄父瀹㈠垯涓?NULL)
    guest_name TEXT,                 -- 娓稿鏄电О
    content TEXT NOT NULL,
    
    -- 浜掑姩灞炴€?
    is_danmaku INTEGER DEFAULT 0,    -- 鏄惁浣滀负寮瑰箷鏄剧ず (0/1)
    sticker_url TEXT,                -- 濡傛灉鏄创绾歌瘎璁?
    position_x INTEGER,              -- 璐寸焊/鍒掕瘝鐨勫潗鏍?(鍙€?
    position_y INTEGER,
    avatar_style TEXT,               -- 鍍忕礌澶村儚ID锛堥殢鏈虹敓鎴愶級
    
    status TEXT DEFAULT 'approved',  -- 'pending', 'approved', 'spam'
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. 鍏ㄦ枃鎼滅储铏氭嫙琛?(FTS5)
DROP TABLE IF EXISTS articles_fts;
CREATE VIRTUAL TABLE articles_fts USING fts5(title, content, content='articles', content_rowid='id');

-- 瑙﹀彂鍣細淇濇寔 FTS 琛ㄤ笌 articles 鍚屾
DROP TRIGGER IF EXISTS articles_ai;
CREATE TRIGGER articles_ai AFTER INSERT ON articles BEGIN
  INSERT INTO articles_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;

DROP TRIGGER IF EXISTS articles_ad;
CREATE TRIGGER articles_ad AFTER DELETE ON articles BEGIN
  INSERT INTO articles_fts(articles_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
END;

DROP TRIGGER IF EXISTS articles_au;
CREATE TRIGGER articles_au AFTER UPDATE ON articles BEGIN
  INSERT INTO articles_fts(articles_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
  INSERT INTO articles_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;

-- Bangumi API 集成 - 数据库扩展
-- 为 animes 表添加 Bangumi 相关字段

-- Bangumi 条目 ID
ALTER TABLE animes ADD COLUMN bangumi_id INTEGER;

-- 名称
ALTER TABLE animes ADD COLUMN name_cn TEXT;
ALTER TABLE animes ADD COLUMN name_jp TEXT;

-- 详细信息
ALTER TABLE animes ADD COLUMN summary TEXT;
ALTER TABLE animes ADD COLUMN air_date TEXT;
ALTER TABLE animes ADD COLUMN total_episodes INTEGER;

-- Bangumi 评分数据
ALTER TABLE animes ADD COLUMN bangumi_score REAL;
ALTER TABLE animes ADD COLUMN bangumi_rank INTEGER;

-- JSON 数据
ALTER TABLE animes ADD COLUMN tags TEXT;           -- Bangumi 标签 (JSON)
ALTER TABLE animes ADD COLUMN staff TEXT;          -- 制作人员 (JSON)
ALTER TABLE animes ADD COLUMN characters TEXT;     -- 角色信息 (JSON)
ALTER TABLE animes ADD COLUMN images TEXT;         -- 图片集 (JSON)

-- 制作信息
ALTER TABLE animes ADD COLUMN studio TEXT;         -- 制作公司
ALTER TABLE animes ADD COLUMN director TEXT;       -- 导演

-- 为 bangumi_id 创建索引，方便后续查重
CREATE INDEX IF NOT EXISTS idx_animes_bangumi_id ON animes(bangumi_id);

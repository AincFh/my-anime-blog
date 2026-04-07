---
name: d1-migration
description: 生成 Cloudflare D1 数据库迁移文件，包含表创建、索引、外键约束。用于创建新的数据表、修改现有表结构或添加索引。
---

# D1 数据库迁移文件生成

## 迁移文件命名规范

```
database/
├── schema.sql                  # 核心表（users, articles等）
├── schema_membership.sql       # 会员系统表
├── migration_001_*.sql         # 按编号的迁移文件
├── migration_002_*.sql
└── ...
```

### 文件名格式

```sql
-- database/migration_005_performance_indexes.sql
-- 迁移文件应包含：
-- 1. 迁移目的说明
-- 2. 迁移前检查（可选）
-- 3. 具体迁移操作
-- 4. 迁移后验证（可选）
```

## 迁移模板

### 1. 创建新表

```sql
-- ============================================
-- 迁移：创建文章分类表
-- 作者：AI Assistant
-- 日期：2026-04-05
-- ============================================

-- 创建表
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` TEXT NOT NULL,
  `slug` TEXT NOT NULL UNIQUE,
  `description` TEXT,
  `parent_id` INTEGER REFERENCES `categories`(`id`) ON DELETE SET NULL,
  `sort_order` INTEGER DEFAULT 0,
  `created_at` TEXT DEFAULT (datetime('now')),
  `updated_at` TEXT DEFAULT (datetime('now'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS `idx_categories_slug` ON `categories`(`slug`);
CREATE INDEX IF NOT EXISTS `idx_categories_parent_id` ON `categories`(`parent_id`);

-- 添加注释（如果支持）
-- COMMENT ON TABLE `categories` IS '文章分类表';
```

### 2. 添加字段

```sql
-- ============================================
-- 迁移：给 articles 表添加封面图字段
-- ============================================

-- 添加新字段
ALTER TABLE `articles` 
ADD COLUMN `cover_image` TEXT;

-- 添加描述（SQLite 不支持 COMMENT，但可以在迁移中记录）
-- 字段说明：文章封面图 URL

-- 如果需要设置默认值
-- ALTER TABLE `articles` 
-- ADD COLUMN `status` TEXT DEFAULT 'draft';
```

### 3. 创建索引

```sql
-- ============================================
-- 迁移：为性能优化添加索引
-- ============================================

-- 经常查询的字段添加索引
CREATE INDEX IF NOT EXISTS `idx_articles_author_id` 
ON `articles`(`author_id`);

CREATE INDEX IF NOT EXISTS `idx_articles_status` 
ON `articles`(`status`);

CREATE INDEX IF NOT EXISTS `idx_articles_created_at` 
ON `articles`(`created_at` DESC);

-- 复合索引
CREATE INDEX IF NOT EXISTS `idx_articles_author_status` 
ON `articles`(`author_id`, `status`);

-- 全文搜索索引（如果需要）
CREATE VIRTUAL TABLE IF NOT EXISTS `articles_fts` 
USING fts5(title, content, content='articles', content_rowid='id');
```

### 4. 数据迁移

```sql
-- ============================================
-- 迁移：将旧数据迁移到新表结构
-- ============================================

-- 1. 创建临时表（如果需要）
CREATE TABLE IF NOT EXISTS `articles_backup` AS SELECT * FROM `articles`;

-- 2. 执行数据转换
UPDATE `articles` 
SET `cover_image` = (
  SELECT `url` FROM `article_images` 
  WHERE `article_images`.`article_id` = `articles`.`id` 
  LIMIT 1
)
WHERE `cover_image` IS NULL;

-- 3. 验证数据
SELECT COUNT(*) as migrated_count 
FROM `articles` 
WHERE `cover_image` IS NOT NULL;
```

## 类型映射参考

### TypeScript → SQLite

| TypeScript 类型 | SQLite 类型 | 说明 |
|-----------------|-------------|------|
| `number` | `INTEGER` 或 `REAL` | 整数用 INTEGER，浮点数用 REAL |
| `string` | `TEXT` | 文本存储为 TEXT |
| `boolean` | `INTEGER` | 0 或 1 |
| `Date` | `TEXT` | ISO 8601 格式字符串 |
| `null` | `NULL` | 空值 |
| `bigint` | `INTEGER` | SQLite INTEGER 为 64 位 |

## 约束设计

### 主键约束

```sql
-- 自增主键（推荐）
`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL

-- UUID 主键（分布式场景）
`id` TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16))))
```

### 外键约束

```sql
CREATE TABLE IF NOT EXISTS `article_categories` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `article_id` INTEGER NOT NULL REFERENCES `articles`(`id`) ON DELETE CASCADE,
  `category_id` INTEGER NOT NULL REFERENCES `categories`(`id`) ON DELETE CASCADE,
  `created_at` TEXT DEFAULT (datetime('now')),
  UNIQUE(`article_id`, `category_id`)
);
```

### 唯一约束

```sql
-- 单字段唯一
`slug` TEXT NOT NULL UNIQUE

-- 多字段组合唯一
UNIQUE(`user_id`, `article_id`)
```

### 检查约束

```sql
-- 数值范围检查
`age` INTEGER CHECK(`age` >= 0 AND `age` <= 150)

-- 枚举值检查
`status` TEXT CHECK(`status` IN ('draft', 'published', 'archived'))
```

## 默认值设计

### 时间戳默认值

```sql
-- 创建时间
`created_at` TEXT DEFAULT (datetime('now'))

-- 更新时间（需要应用层维护）
`updated_at` TEXT

-- ISO 8601 格式（推荐用于前端显示）
`created_at` TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
```

### 序列号

```sql
-- 手动序号生成（需要应用层配合）
`sort_order` INTEGER DEFAULT 0
```

## 迁移命令

### 本地执行

```bash
# 执行单个迁移
npx wrangler d1 execute anime-db --local --file=database/migration_005.sql

# 执行多条迁移
npx wrangler d1 execute anime-db --local --file=database/migration_005.sql --file=database/migration_006.sql

# 查看数据库状态
npx wrangler d1 info anime-db --local
```

### 生产执行

```bash
# 执行迁移
npx wrangler d1 execute anime-db --remote --file=database/migration_005.sql

# 验证执行结果
npx wrangler d1 execute anime-db --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### 回滚（如果需要）

```sql
-- 注意：D1 不直接支持回滚，需要手动执行逆操作

-- 删除索引
DROP INDEX IF EXISTS `idx_articles_author_id`;

-- 删除字段（需要重建表）
ALTER TABLE `articles` DROP COLUMN `cover_image`;

-- 删除表
DROP TABLE IF EXISTS `categories`;
```

## 最佳实践

1. **始终使用 IF NOT EXISTS** - 避免重复执行报错
2. **添加索引** - 频繁查询的字段及时添加索引
3. **外键约束** - 确保数据完整性
4. **时间戳** - 记录创建和更新时间
5. **软删除** - 使用 `deleted_at` 而非物理删除
6. **迁移测试** - 先在本地测试再执行到生产

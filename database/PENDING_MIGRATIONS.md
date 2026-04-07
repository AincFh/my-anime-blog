# 待执行的数据库迁移

本目录包含需要手动执行的迁移文件。请按顺序执行以下迁移：

## 已完成迁移

以下迁移已在本地数据库执行完成：

| 迁移文件 | 执行日期 | 状态 |
|---------|---------|------|
| `schema.sql` | 2026-04-08 | ✅ 已完成 |
| `schema_membership.sql` | 2026-04-08 | ✅ 已完成 |
| `migration_004_missions.sql` | 2026-04-08 | ✅ 已完成 |
| `migration_005_performance_indexes.sql` | 2026-04-08 | ✅ 已完成 |
| `migration_006_membership_shop_if_missing.sql` | 2026-04-08 | ✅ 已完成 |
| `migration_007_tags_and_categories.sql` | 2026-04-08 | ✅ 已完成 |
| `migration_008_notion_sync.sql` | 2026-04-08 | ✅ 已完成 |
| `seed_shop_v2.sql` | 2026-04-08 | ✅ 已完成 |

## 本地数据库信息

```
数据库名称: anime-db-local
数据库 ID: 8ca52341-a718-49a2-a360-f8e3268f7b7e
绑定名称: anime_db_local (在 wrangler.jsonc 中配置)
```

## 创建的表列表

| 表名 | 用途 |
|-----|------|
| `articles` | 文章表 |
| `articles_fts` | 文章全文搜索 |
| `animes` | 番剧/游戏记录表 |
| `users` | 用户表 |
| `sessions` | 会话表 |
| `comments` | 评论表 |
| `system_settings` | 系统配置表 |
| `ai_usage` | AI 使用统计表 |
| `gallery` | 图库表 |
| `membership_tiers` | 会员等级表 |
| `subscriptions` | 用户订阅表 |
| `payment_orders` | 支付订单表 |
| `coin_transactions` | 积分交易记录表 |
| `shop_items` | 积分商城商品表 |
| `user_purchases` | 用户购买记录表 |
| `login_history` | 登录历史表 |
| `audit_logs` | 审计日志表 |
| `missions` | 使命/任务系统表 |
| `tags` | 标签表 |
| `categories` | 分类表 |

## 远程部署说明

当远程数据库连接恢复后，需要执行以下命令：

```bash
# 1. 执行基础架构
npx wrangler d1 execute my-anime-blog --remote --file=database/schema.sql

# 2. 执行会员系统
npx wrangler d1 execute my-anime-blog --remote --file=database/schema_membership.sql

# 3. 执行迁移文件
npx wrangler d1 execute my-anime-blog --remote --file=database/migration_004_missions.sql
npx wrangler d1 execute my-anime-blog --remote --file=database/migration_005_performance_indexes.sql
npx wrangler d1 execute my-anime-blog --remote --file=database/migration_006_membership_shop_if_missing.sql
npx wrangler d1 execute my-anime-blog --remote --file=database/migration_007_tags_and_categories.sql
npx wrangler d1 execute my-anime-blog --remote --file=database/migration_008_notion_sync.sql

# 4. 插入种子数据
npx wrangler d1 execute my-anime-blog --remote --file=database/seed_shop_v2.sql
```

## 注意事项

1. 远程执行时如果出现 `fetch failed` 错误，可能是网络问题，请稍后重试
2. 迁移文件 006 使用 `CREATE TABLE IF NOT EXISTS`，可安全重复执行
3. 迁移文件 007/008 使用 `INSERT OR IGNORE`，可安全重复执行

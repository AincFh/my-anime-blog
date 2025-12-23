# 数据库文件

## 文件说明

| 文件 | 说明 |
|-----|------|
| `schema.sql` | 核心表结构（用户、文章、评论等） |
| `schema_membership.sql` | 会员系统表（等级、订阅、支付、积分） |
| `seed.sql` | 初始数据（管理员、基础配置） |
| `seed_sample.sql` | 示例数据（测试用文章、番剧） |
| `update_membership.sql` | 会员权益更新脚本 |

## 执行顺序

```bash
# 1. 初始化核心表
npx wrangler d1 execute anime_db --remote --file=database/schema.sql -y

# 2. 初始化会员系统表
npx wrangler d1 execute anime_db --remote --file=database/schema_membership.sql -y

# 3. 插入初始数据
npx wrangler d1 execute anime_db --remote --file=database/seed.sql -y

# 4. （可选）插入示例数据
npx wrangler d1 execute anime_db --remote --file=database/seed_sample.sql -y
```

## 会员权益

### VIP (¥19.9/月)
- AI 聊天 100次/天
- AI 图片生成 20次/天
- 积分 2 倍
- 无广告
- 高清下载
- 自定义主题/头像
- 专属表情
- VIP 徽章
- 评论高亮
- 私信功能
- 专属文章
- 生日礼物

### SVIP (¥39.9/月)
- 包含 VIP 全部权益
- AI 无限使用
- 积分 3 倍
- 专属特效
- 抢先体验
- 优先客服
- API 访问权限
- 自定义子域名
- Beta 功能测试
- 专属活动
- 导师交流

# 项目初始化指南

## ✅ 已完成的配置

1. ✅ D1 数据库已创建：`anime-db` (ID: `feb58a7c-5330-4261-be8a-279a630f3c39`)
2. ✅ KV 命名空间已创建：`Anime-blog` (ID: `dfb4a1a1868c488cb1f9a7500b4ae61b`)
3. ✅ `wrangler.jsonc` 已更新，包含所有资源 ID
4. ✅ 邮件服务已配置域名：`noreply@aincfh.dpdns.org`

## 🚀 下一步操作

### 1. 初始化本地数据库

```bash
# 创建本地数据库（如果还没有）
npx wrangler d1 create anime-db --local

# 执行数据库迁移（本地）
npx wrangler d1 execute anime-db --local --file=./schema.sql
```

### 2. 初始化远程数据库

```bash
# 执行数据库迁移（远程/生产环境）
npx wrangler d1 execute anime-db --remote --file=./schema.sql
```

### 3. 配置 MailChannels（如果使用邮件服务）

为了使用 MailChannels 发送邮件，需要在 DNS 中添加 SPF 记录：

1. 登录 Cloudflare Dashboard
2. 进入域名 `aincfh.dpdns.org` 的 DNS 设置
3. 添加一条 TXT 记录：
   - **名称**: `@` 或 `aincfh.dpdns.org`
   - **内容**: `v=spf1 include:relay.mailchannels.net ~all`
   - **代理状态**: 仅 DNS（灰色云朵）

### 4. 测试本地开发环境

```bash
# 启动开发服务器
npm run dev
```

### 5. 测试 API 端点

#### 发送验证码
```bash
curl -X POST http://localhost:5173/api/auth/send-code \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=your-email@example.com"
```

#### 注册用户（需要先获取验证码）
```bash
curl -X POST http://localhost:5173/api/auth/register \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=your-email@example.com&password=password123&code=123456&username=测试用户"
```

#### 登录
```bash
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=your-email@example.com&password=password123" \
  -c cookies.txt
```

#### 获取当前用户
```bash
curl -X GET http://localhost:5173/api/user/me \
  -b cookies.txt
```

## 📝 注意事项

### 本地开发环境

- **KV**: 本地开发时，KV 可能不可用。代码已处理此情况，会跳过速率限制和验证码验证。
- **邮件**: 本地开发时，邮件可能无法发送。可以：
  - 检查控制台输出（开发环境可能会输出验证码）
  - 使用 MailChannels（需要配置 SPF 记录）
  - 使用 Resend（需要 API Key）

### 生产环境部署

```bash
# 构建项目
npm run build

# 部署到 Cloudflare Pages
npm run deploy
```

## 🔍 验证配置

### 检查 D1 数据库

```bash
# 查看本地数据库
npx wrangler d1 execute anime-db --local --command "SELECT name FROM sqlite_master WHERE type='table';"

# 查看远程数据库
npx wrangler d1 execute anime-db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### 检查 KV 命名空间

```bash
# 列出所有 KV 键（需要先写入一些数据）
# 可以通过 Cloudflare Dashboard 查看
```

## 🐛 常见问题

### Q: 数据库迁移失败？
A: 确保：
1. 数据库 ID 正确（已在 `wrangler.jsonc` 中配置）
2. 已登录 Cloudflare：`npx wrangler login`
3. SQL 语法正确

### Q: KV 不可用？
A: 本地开发时，KV 可能不可用。这是正常的，代码已处理此情况。

### Q: 邮件发送失败？
A: 检查：
1. SPF 记录是否已配置
2. 域名是否已添加到 Cloudflare
3. MailChannels 是否支持您的域名

## 📚 相关文档

- [后端架构文档](./BACKEND_ARCHITECTURE.md)
- [快速开始指南](./QUICK_START_BACKEND.md)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare KV 文档](https://developers.cloudflare.com/kv/)


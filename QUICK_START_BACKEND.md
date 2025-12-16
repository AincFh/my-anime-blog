# 后端架构快速开始指南

## 🎯 概述

根据《Project: Blue Sky 后端架构与开发规格说明书》，已实现完整的后端服务层。

## ✅ 已完成的工作

### 1. 数据库结构更新 (`schema.sql`)
- ✅ 用户表：支持邮箱登录、RPG 属性（level, exp, coins）
- ✅ 会话表：支持多设备登录、设备信息记录
- ✅ 文章表：状态控制（draft/published/hidden）、标签支持
- ✅ 评论表：支持用户关联、贴纸评论、坐标定位

### 2. 服务层实现 (`app/services/`)
- ✅ `crypto.server.ts` - 密码加密（PBKDF2）
- ✅ `auth.server.ts` - 认证服务（验证码、注册、登录、会话）
- ✅ `db.server.ts` - 数据库操作封装
- ✅ `email.server.ts` - 邮件服务（MailChannels/Resend）
- ✅ `ratelimit.ts` - 速率限制（基于 KV）
- ✅ `r2.server.ts` - R2 对象存储服务

### 3. 安全工具 (`app/utils/security.ts`)
- ✅ XSS 防护（HTML 转义）
- ✅ 垃圾评论检测
- ✅ CSRF Token 生成和验证

### 4. API 路由 (`app/routes/`)
- ✅ `api.auth.send-code.ts` - 发送验证码
- ✅ `api.auth.register.ts` - 用户注册
- ✅ `api.auth.login.ts` - 用户登录
- ✅ `api.user.me.ts` - 获取当前用户

### 5. 配置文件更新
- ✅ `wrangler.jsonc` - 添加 KV 命名空间配置
- ✅ `app/routes.ts` - 添加新 API 路由

## 🚀 快速开始

### 步骤 1: 创建 KV 命名空间

```bash
# 创建生产环境 KV
npx wrangler kv:namespace create "CACHE_KV"

# 创建预览环境 KV
npx wrangler kv:namespace create "CACHE_KV" --preview
```

将返回的 ID 填入 `wrangler.jsonc`：

```jsonc
"kv_namespaces": [
  {
    "binding": "CACHE_KV",
    "id": "你的生产环境ID",
    "preview_id": "你的预览环境ID"
  }
]
```

### 步骤 2: 更新数据库结构

```bash
# 执行更新的 schema.sql
npx wrangler d1 execute anime-db --local --file=./schema.sql
npx wrangler d1 execute anime-db --remote --file=./schema.sql
```

### 步骤 3: 配置邮件服务

#### 选项 A: MailChannels（推荐，无需 API Key）

1. 确保域名已添加到 Cloudflare
2. 在 DNS 中添加 SPF 记录：`v=spf1 include:relay.mailchannels.net ~all`
3. 代码中已默认使用 MailChannels

#### 选项 B: Resend API

1. 注册 [Resend](https://resend.com)
2. 获取 API Key
3. 在 `wrangler.jsonc` 中添加环境变量或使用 Secrets：
   ```bash
   npx wrangler secret put RESEND_API_KEY
   ```

### 步骤 4: 测试 API

#### 发送验证码

```bash
curl -X POST http://localhost:5173/api/auth/send-code \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=test@example.com"
```

#### 注册用户

```bash
curl -X POST http://localhost:5173/api/auth/register \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=test@example.com&password=password123&code=123456&username=测试用户"
```

#### 登录

```bash
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=test@example.com&password=password123" \
  -c cookies.txt
```

#### 获取当前用户

```bash
curl -X GET http://localhost:5173/api/user/me \
  -b cookies.txt
```

## 📋 待办事项

### 高优先级
- [ ] 创建 KV 命名空间并更新配置
- [ ] 执行数据库迁移
- [ ] 配置邮件服务（MailChannels 或 Resend）
- [ ] 测试所有 API 端点

### 中优先级
- [ ] 更新 `admin.login.tsx` 使用新的认证服务
- [ ] 实现 R2 公开访问配置或代理
- [ ] 添加更多 API 路由（评论、点赞等）
- [ ] 实现 CSRF 防护中间件

### 低优先级
- [ ] 添加单元测试
- [ ] 性能优化（缓存策略）
- [ ] 日志和监控
- [ ] 错误处理增强

## 🔧 开发环境注意事项

### KV 在本地开发

本地开发时，KV 可能不可用。代码已处理此情况：
- 速率限制会跳过（允许所有请求）
- 验证码验证会跳过（开发环境允许任意验证码）

### 邮件服务在本地开发

本地开发时，邮件可能无法发送。可以：
1. 使用 MailChannels（需要配置域名）
2. 使用 Resend（需要 API Key）
3. 临时修改代码，在控制台输出验证码

## 📖 相关文档

- [后端架构文档](./BACKEND_ARCHITECTURE.md) - 详细的服务层说明
- [架构设计文档](./ARCHITECTURE.md) - 整体架构设计
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)

## 💡 提示

1. **密码哈希**：当前使用 Web Crypto API 的 PBKDF2。生产环境建议使用 `bcryptjs`（需要 polyfill）或 Cloudflare 兼容的加密库。

2. **会话管理**：会话存储在 D1 数据库中，支持多设备登录。可以通过 `revokeAllUserSessions` 实现"踢出所有设备"功能。

3. **速率限制**：基于 KV 实现，支持灵活的配置。可以根据需要调整限制规则。

4. **错误处理**：所有服务函数都返回 `{ success: boolean, error?: string }` 格式，便于统一处理。

## 🐛 常见问题

### Q: KV 命名空间创建失败？
A: 确保已登录 Cloudflare 账户：`npx wrangler login`

### Q: 邮件发送失败？
A: 检查：
1. MailChannels：确保域名已添加到 Cloudflare，SPF 记录已配置
2. Resend：确保 API Key 正确，域名已验证

### Q: 数据库迁移失败？
A: 确保：
1. 数据库 ID 正确
2. 本地和远程数据库都已创建
3. SQL 语法正确（注意 SQLite 的限制）

### Q: 会话验证失败？
A: 检查：
1. Cookie 名称是否匹配（默认：`session`）
2. 会话是否过期
3. 数据库中的会话记录是否存在

## 📞 支持

如有问题，请参考：
- [Cloudflare Workers 社区](https://community.cloudflare.com/)
- [React Router 文档](https://reactrouter.com/)


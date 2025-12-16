# Project: Blue Sky - 后端架构实现文档

本文档说明已实现的后端架构和服务层。

## 📁 目录结构

```
app/
├── services/              # 业务逻辑层（核心）
│   ├── auth.server.ts     # 认证服务（登录、注册、会话管理）
│   ├── crypto.server.ts   # 密码加密工具
│   ├── db.server.ts       # 数据库服务封装
│   ├── email.server.ts    # 邮件服务（MailChannels/Resend）
│   ├── ratelimit.ts       # 速率限制工具
│   └── r2.server.ts       # R2 对象存储服务
├── routes/
│   ├── api.auth.*.ts      # 认证 API 路由
│   └── api.user.*.ts      # 用户 API 路由
└── utils/
    └── security.ts        # 安全工具（XSS防护、垃圾评论检测）
```

## 🔐 认证系统

### 1. 发送验证码

**API**: `POST /api/auth/send-code`

**请求体**:
```json
{
  "email": "user@example.com"
}
```

**功能**:
- 生成6位数字验证码
- 存储到 KV（5分钟过期）
- 通过邮件发送验证码
- 速率限制：1次/60秒，5次/小时

**使用示例**:
```typescript
import { sendVerificationCode } from "~/services/auth.server";

const result = await sendVerificationCode(
  email,
  request,
  CACHE_KV,
  true // 使用 MailChannels
);
```

### 2. 用户注册

**API**: `POST /api/auth/register`

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "code": "123456",
  "username": "旅行者" // 可选
}
```

**功能**:
- 验证验证码
- 检查邮箱是否已注册
- 密码哈希加密（PBKDF2）
- 创建用户并自动登录

### 3. 用户登录

**API**: `POST /api/auth/login`

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**功能**:
- 验证邮箱和密码
- 创建会话（7天有效期）
- 设置 HttpOnly Cookie
- 速率限制：5次错误/10分钟

### 4. 获取当前用户

**API**: `GET /api/user/me`

**功能**:
- 从 Cookie 读取会话令牌
- 验证会话有效性
- 返回用户信息

## 🛡️ 安全特性

### 密码加密

使用 Web Crypto API 的 PBKDF2 算法：
- 迭代次数：100,000
- 哈希算法：SHA-256
- 格式：`salt:hash`

```typescript
import { hashPassword, verifyPassword } from "~/services/crypto.server";

const hash = await hashPassword("password123");
const isValid = await verifyPassword("password123", hash);
```

### 速率限制

基于 Cloudflare KV 实现：

```typescript
import { checkRateLimit, RATE_LIMITS } from "~/services/ratelimit";

const result = await checkRateLimit(
  CACHE_KV,
  clientIP,
  RATE_LIMITS.SEND_CODE
);

if (!result.allowed) {
  return json({ error: "请求过于频繁" }, { status: 429 });
}
```

**预定义限制**:
- 发送验证码：1次/60秒，5次/小时
- 评论：1次/10秒
- 登录失败：5次/10分钟

### XSS 防护

```typescript
import { sanitizeComment } from "~/utils/security";

const cleaned = sanitizeComment(userInput);
```

功能：
- 移除 HTML 标签
- 转义特殊字符
- 限制长度（1000字符）

## 📧 邮件服务

支持两种邮件服务：

### MailChannels（推荐）

Cloudflare Workers 官方邮件服务，无需 API Key。

```typescript
import { sendVerificationCodeEmail } from "~/services/email.server";

await sendVerificationCodeEmail(email, code, true);
```

### Resend API

需要设置 `RESEND_API_KEY` 环境变量。

```typescript
await sendVerificationCodeEmail(email, code, false, RESEND_API_KEY);
```

## 📦 R2 对象存储

### 上传文件

```typescript
import { uploadToR2 } from "~/services/r2.server";

const formData = await request.formData();
const file = formData.get("file") as File;

const result = await uploadToR2(
  MEDIA_BUCKET,
  file,
  undefined, // 自动生成路径
  5 * 1024 * 1024 // 最大5MB
);

if (result.success) {
  console.log("文件URL:", result.url);
}
```

### 支持的文件类型

- 图片：JPEG, PNG, GIF, WebP, SVG
- 音频：MP3, WAV

## 🗄️ 数据库操作

使用类型安全的数据库封装：

```typescript
import { queryFirst, queryAll, execute } from "~/services/db.server";

// 查询单条记录
const user = await queryFirst<User>(
  db,
  "SELECT * FROM users WHERE id = ?",
  userId
);

// 查询多条记录
const articles = await queryAll<Article>(
  db,
  "SELECT * FROM articles WHERE status = ?",
  "published"
);

// 执行更新
await execute(
  db,
  "UPDATE users SET level = ? WHERE id = ?",
  newLevel,
  userId
);
```

## ⚙️ 配置要求

### wrangler.jsonc

```jsonc
{
  "d1_databases": [
    {
      "binding": "anime_db",
      "database_name": "anime-db",
      "database_id": "your-database-id"
    }
  ],
  "r2_buckets": [
    {
      "binding": "MEDIA_BUCKET",
      "bucket_name": "anime-blog-media"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "CACHE_KV",
      "id": "your-kv-namespace-id",
      "preview_id": "your-preview-kv-namespace-id"
    }
  ]
}
```

### 创建 KV 命名空间

```bash
# 创建生产环境 KV
npx wrangler kv:namespace create "CACHE_KV"

# 创建预览环境 KV
npx wrangler kv:namespace create "CACHE_KV" --preview
```

将返回的 ID 填入 `wrangler.jsonc`。

## 📝 使用示例

### 在路由中使用认证服务

```typescript
// app/routes/protected.tsx
import { verifySession, getSessionToken } from "~/services/auth.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { anime_db } = context.cloudflare.env;
  
  const token = getSessionToken(request);
  const result = await verifySession(token, anime_db);
  
  if (!result.valid) {
    throw redirect("/login");
  }
  
  return { user: result.user };
}
```

### 在 Action 中使用速率限制

```typescript
// app/routes/api.comment.ts
import { checkRateLimit, getClientIP, RATE_LIMITS } from "~/services/ratelimit";

export async function action({ request, context }: Route.ActionArgs) {
  const { CACHE_KV } = context.cloudflare.env;
  const ip = getClientIP(request);
  
  const limit = await checkRateLimit(
    CACHE_KV,
    ip,
    RATE_LIMITS.COMMENT
  );
  
  if (!limit.allowed) {
    return json({ error: "评论过于频繁" }, { status: 429 });
  }
  
  // 处理评论...
}
```

## 🚀 下一步

1. **配置 KV 命名空间**：运行 `wrangler kv:namespace create` 并更新配置
2. **配置邮件服务**：选择 MailChannels 或 Resend，配置域名
3. **配置 R2 公开访问**：设置自定义域名或配置代理
4. **更新现有路由**：将旧的认证逻辑迁移到新的服务层
5. **测试**：测试所有 API 端点的功能和安全性

## 📚 相关文档

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Cloudflare KV 文档](https://developers.cloudflare.com/kv/)


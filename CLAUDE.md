# A.T. Field (绝对领域) - 架构与开发指南

## 🏗️ 架构概览

**核心技术栈**: React Router v7 (SSR) on Cloudflare Workers.
**设计哲学**: 边缘优先 (Edge-first), 无服务器 (Serverless), 玻璃态 UI (Glassmorphism).

### 核心组件
- **运行环境**: Cloudflare Workers (高性能，低延迟边缘执行)
- **数据库**: Cloudflare D1 (SQLite, 分布式关系型数据)
- **存储**: Cloudflare R2 (对象存储，用于用户上传/媒体)
- **缓存**: Cloudflare KV (会话管理 & 高速缓存)
- **AI**: Workers AI (内容验证，文本生成)
- **CDN**: 阿里云 DCDN (全站加速) -> Cloudflare Workers

---

## 📂 目录结构

```bash
my-anime-blog/
├── app/                        # 应用源代码
│   ├── components/             # React 组件 (原子设计原则)
│   │   ├── ui/                 # 基础 UI 元素 (按钮, 输入框) - 玻璃态风格
│   │   ├── layout/             # 布局容器 (GlassCard, Sidebar)
│   │   └── ...                 # 功能特定组件
│   ├── routes/                 # 基于文件的路由 (React Router v7)
│   │   ├── api.*/              # 后端 API 端点 (RESTful)
│   │   └── ...                 # UI 页面
│   ├── services/               # 业务逻辑层 (关注点分离)
│   │   ├── auth.server.ts      # 认证 & 会话管理
│   │   ├── db.server.ts        # 数据库连接 & 辅助函数
│   │   ├── user/               # 用户领域逻辑
│   │   ├── membership/         # 订阅 & 计费逻辑
│   │   └── security/           # 安全工具 (审计日志, 加密)
│   ├── repositories/           # 数据访问层 (D1/KV 抽象)
│   ├── utils/                  # 共享工具 (格式化, 技术无关的辅助函数)
│   └── styles/                 # 全局样式 & Tailwind 配置
├── database/                   # 数据库模式 & 迁移
│   ├── schema.sql              # 核心表
│   └── schema_membership.sql   # 会员系统表
├── workers/                    # Cloudflare Worker 入口点
├── public/                     # 静态资源
└── wranger.jsonc               # Cloudflare 基础设施配置
```

---

## 🧩 模块边界与职责

### 前端 (App Layer)
- **Routes (`app/routes`)**: 处理请求接收、Loader 数据获取和页面渲染。**逻辑最小化**，委托给 Service 层。
- **Components (`app/components`)**: 纯 UI 展示。
  - **设计系统**: "Glassmorphism" (极光玻璃态) - `backdrop-blur`, 半透明背景, 霓虹点缀。
  - **样式**: Tailwind CSS v4. 使用 `app.css` 中定义的标准 Token。

### 后端 (Service Layer)
- **Auth Service**: 处理登录/注册/会话。用户身份的**单一事实来源**。
- **Membership Service**: 管理等级 (Free/VIP/SVIP)、订阅和虚拟货币 (Stardust)。
- **Payment Service**: 抽象支付网关 (WeChat/Alipay/Mock)。安全签名验证。
- **Security Service**: 集中式审计日志记录和加密操作。
- **Repositories**: (`app/repositories`) 直接数据库访问。将 SQL 查询和 D1/KV 交互从 Service 层中抽象出来。

### 数据层 (Data Layer)
- **D1**: 主要的关系型数据存储。模式变更**必须**在 `database/` 中跟踪。
- **KV**: 仅限临时数据 (会话,缓存)。不要在此存储永久数据。

---

## 🛠️ 开发指南

### 1. 代码风格
- **命名**:
  - 文件: `kebab-case.ts` / `PascalCase.tsx` (组件)。
  - 变量: `camelCase`。
  - 常量: `UPPER_SNAKE_CASE`。
- **类型安全**: 严格使用 TypeScript。避免 `any`。在 `app/types` 中定义接口。
  - 使用 `app/types/env.ts` 中的 `Env` 接口定义 Worker 环境变量。

### 2. 状态管理
- 优先使用 **基于 URL 的状态** (Loaders/Actions) 而非全局客户端状态。
- 对于非导航交互 (如 "点赞", "加入购物车") 使用 `useFetcher`。

### 3. 安全
- **认证**: 始终使用 `services/auth.server.ts` 中的 `authenticator` 或 `getSession`。
- **验证**: 使用 `zod` 或 Action 中的手动检查验证所有输入。
- **机密**: 使用 `wrangler secret` 机制。切勿硬编码凭据。

### 4. 数据库迁移
- 修改 `database/` 中的 `.sql` 文件。
- 本地应用: `npx wrangler d1 execute anime-db --local --file=database/xxx.sql`。
- 生产应用: `npx wrangler d1 execute anime-db --remote --file=database/xxx.sql`。

---

## 🔄 常用工作流

- **新功能**:
  1. 在 `database/` 中定义模式变更 (如果有)。
  2. 在 `app/services/` 中实现业务逻辑。
  3. 在 `app/routes/` 中创建 Route/API。
  4. 在 `app/components/` 中构建 UI 组件。

- **部署**:
  - `npm run deploy`: 构建并推送到 Cloudflare Workers。

### 5. 数据备份与恢复
- **备份**: D1 支持自动备份。手动备份:
  ```bash
  npx wrangler d1 backup create anime-db
  ```
- **恢复**:
  ```bash
  npx wrangler d1 backup restore anime-db <backup-id>
  ```
- **本地数据导出**:
  ```bash
  npx wrangler d1 execute anime-db --remote --command "SELECT * FROM users" > users_backup.csv
  ```

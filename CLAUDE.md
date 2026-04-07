---
description: 
alwaysApply: true
---

---
description: 
alwaysApply: true
---

# 🔴 最高优先级强制规则
1. **所有回复、思考过程、代码注释、解释说明必须100%使用简体中文**
2. 仅保留无法替代的技术术语（如React、TypeScript、Cloudflare）
3. 即使我用英文提问，你也必须用简体中文回答
4. 这是名为"A.T. Field (绝对领域)"的动漫博客项目，所有开发工作必须严格遵守本架构指南

---

# A.T. Field (绝对领域) - 架构与开发指南
## 🏗️ 架构概览
**核心技术栈**: React Router v7 (SSR) 运行于 Cloudflare Workers
**设计哲学**: 边缘优先、无服务器、极光玻璃态UI

### 核心组件
- **运行环境**: Cloudflare Workers（高性能低延迟边缘执行）
- **数据库**: Cloudflare D1（分布式SQLite关系型数据库）
- **存储**: Cloudflare R2（对象存储，用于用户上传和媒体文件）
- **缓存**: Cloudflare KV（会话管理和高速缓存）
- **AI能力**: Workers AI（内容验证、文本生成）
- **CDN**: 阿里云DCDN全站加速 → Cloudflare Workers

---

## 📂 目录结构规范
```
my-anime-blog/
├── app/                        # 应用源代码
│   ├── components/             # React组件（遵循原子设计原则）
│   │   ├── ui/                 # 基础UI元素（按钮、输入框）- 统一玻璃态风格
│   │   ├── layout/             # 布局容器（玻璃卡片、侧边栏）
│   │   └── ...                 # 功能特定组件
│   ├── routes/                 # 基于文件的路由（React Router v7）
│   │   ├── api.*/              # 后端API端点（RESTful风格）
│   │   └── ...                 # UI页面
│   ├── services/               # 业务逻辑层（关注点分离）
│   │   ├── auth.server.ts      # 认证与会话管理
│   │   ├── db.server.ts        # 数据库连接与辅助函数
│   │   ├── user/               # 用户领域逻辑
│   │   ├── membership/         # 订阅与计费逻辑
│   │   └── security/           # 安全工具（审计日志、加密）
│   ├── repositories/           # 数据访问层（D1/KV操作抽象）
│   ├── utils/                  # 共享工具函数（格式化、通用辅助）
│   ├── types/                  # TypeScript类型定义
│   └── styles/                 # 全局样式与Tailwind配置
├── database/                   # 数据库模式与迁移文件
│   ├── schema.sql              # 核心数据表
│   └── schema_membership.sql   # 会员系统数据表
├── workers/                    # Cloudflare Worker入口点
├── public/                     # 静态资源
└── wrangler.jsonc              # Cloudflare基础设施配置
```

---

## 🧩 模块边界与职责
### 前端层
- **路由 (`app/routes`)**: 仅处理请求接收、Loader数据获取和页面渲染，**逻辑最小化**，所有业务逻辑必须委托给Service层
- **组件 (`app/components`)**: 纯UI展示，不包含任何业务逻辑
- **设计系统**: 统一使用极光玻璃态风格
  - 基础样式：`backdrop-blur` 半透明背景 + 霓虹点缀
  - 所有颜色和尺寸必须使用 `app.css` 中定义的标准Token
- **样式**: 统一使用Tailwind CSS v4，禁止使用内联样式

### 后端服务层
- **认证服务**: 处理登录、注册、会话管理，是用户身份的**唯一事实来源**
- **会员服务**: 管理会员等级（免费/VIP/SVIP）、订阅状态和虚拟货币"星尘"
- **支付服务**: 抽象支付网关（微信/支付宝/模拟），负责安全签名验证
- **安全服务**: 集中式审计日志记录和加密操作
- **数据仓库 (`app/repositories`)**: 封装所有数据库操作，将SQL查询和D1/KV交互从Service层中抽象出来

### 数据层
- **D1**: 主要的关系型数据存储，所有模式变更**必须**在 `database/` 目录中跟踪
- **KV**: 仅限存储临时数据（会话、缓存），**绝对禁止**存储永久数据
- **R2**: 专门用于用户上传和媒体文件存储

---

## 🛠️ 开发指南
### 1. 代码风格规范
- **文件命名**:
  - 工具、服务、类型文件：`kebab-case.ts`
  - React组件文件：`PascalCase.tsx`
- **变量命名**:
  - 普通变量和函数：`camelCase`
  - 常量：`UPPER_SNAKE_CASE`
- **类型安全**: 严格使用TypeScript，**绝对禁止使用any类型**
  - 所有接口必须在 `app/types/` 目录中定义
  - 所有环境变量必须在 `app/types/env.ts` 的 `Env` 接口中定义

### 2. 状态管理
- 优先使用**基于URL的状态**（Loaders/Actions），而非全局客户端状态
- 对于非导航交互（如点赞、收藏）使用 `useFetcher`

### 3. 数据库操作
- 所有SQL查询必须写在 `app/repositories/` 目录中
- 所有D1操作必须使用参数化查询，防止SQL注入
- 模式变更必须在 `database/` 目录中创建迁移文件
- 本地应用迁移：`npx wrangler d1 execute anime-db --local --file=database/xxx.sql`
- 生产应用迁移：`npx wrangler d1 execute anime-db --remote --file=database/xxx.sql`

### 4. Cloudflare Workers 规范
- 所有服务端代码必须兼容Cloudflare Workers运行环境
- 禁止使用Node.js特有的API（如fs、path、process），必须使用Cloudflare原生API
- 环境变量必须从 `env` 对象中获取，不要使用 `process.env`
- KV操作必须设置合理的过期时间，不要永久存储临时数据
- R2上传必须验证文件类型和大小，防止恶意文件上传

### 5. React Router v7 规范
- 数据获取优先使用Loader函数，不要在客户端组件中使用useEffect获取数据
- 表单提交优先使用Action函数和useFetcher
- 路由参数使用 `params` 对象获取，搜索参数使用 `useSearchParams`
- 错误处理使用ErrorBoundary组件
- 加载状态使用Suspense组件
- 客户端组件必须在文件顶部添加 `'use client'` 指令
- 服务端组件不能使用任何客户端钩子（如useState、useEffect）

---

## 🔒 安全规范
- 所有认证操作必须使用 `services/auth.server.ts` 中的 `authenticator` 或 `getSession`
- 所有用户输入必须使用zod进行严格验证
- 所有输出必须进行HTML转义，防止XSS攻击
- 密码必须使用bcrypt或Argon2进行哈希存储，禁止明文存储
- 所有机密信息必须使用 `wrangler secret` 机制，**绝对禁止硬编码凭据**
- 所有异步操作必须添加错误处理（try/catch或.catch()）
- 所有API响应必须设置正确的CORS头
- 禁止在日志中记录敏感信息（密码、令牌、信用卡号）

---

## 🔄 开发工作流
### 新功能开发流程
1. 在 `database/` 中定义模式变更（如果需要）
2. 在 `app/repositories/` 中实现数据访问层
3. 在 `app/services/` 中实现业务逻辑
4. 在 `app/routes/` 中创建路由或API端点
5. 在 `app/components/` 中构建UI组件

### 部署流程
- 本地开发：`npm run dev`
- 生产部署：`npm run deploy`

### 数据备份与恢复
- 手动备份：`npx wrangler d1 backup create anime-db`
- 恢复备份：`npx wrangler d1 backup restore anime-db <备份ID>`
- 导出数据：`npx wrangler d1 execute anime-db --remote --command "SELECT * FROM users" > users_backup.csv`

---

## 🤖 AI交互规则
1. 当我提出需求时，先给出实现思路和步骤，再提供代码
2. 如果有多种实现方案，对比它们的优缺点并推荐最佳方案
3. 当我的需求不明确时，主动询问我需要补充的信息
4. 代码中需要我手动修改的地方，用 `// TODO:` 注释标记出来
5. 当我要求修改代码时，只输出修改的部分，不要输出整个文件的完整代码
6. 优先使用项目中已安装的依赖，不要随意引入新的第三方库
7. 如果需要安装新的依赖，明确告诉我安装命令和版本号
8. 所有代码注释必须使用简体中文

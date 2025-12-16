# 项目结构优化方案

## 1. 核心架构原则
- **前后台分离**：明确区分前台用户界面和后台管理系统
- **路由与组件分离**：页面路由独立管理，组件按功能分类
- **API 集中管理**：所有 API 端点统一存放
- **共享资源清晰**：明确区分全局共享资源和模块专用资源
- **命名规范统一**：文件命名、目录结构保持一致性

## 2. 详细目录结构
```
app/
├── core/                    # 核心系统文件
│   ├── entry.server.tsx     # 服务端入口
│   ├── root.tsx             # 根组件
│   ├── app.css              # 全局样式
│   └── routes.ts            # 主路由配置
├── frontend/                # 前台用户系统
│   ├── pages/               # 前台页面组件
│   │   ├── home.tsx         # 首页
│   │   ├── articles/        # 文章相关页面
│   │   │   ├── index.tsx    # 文章列表
│   │   │   └── [slug].tsx   # 文章详情
│   │   ├── archive.tsx      # 归档页
│   │   ├── bangumi.tsx      # 番剧页
│   │   ├── gallery.tsx      # 图库页
│   │   └── 404.tsx          # 404页面
│   ├── components/          # 前台专用组件
│   │   ├── anime/           # 番剧相关组件
│   │   ├── global/          # 前台全局组件
│   │   └── ui/              # 前台UI组件
│   └── utils/               # 前台专用工具
├── backend/                 # 后台管理系统
│   ├── pages/               # 后台页面组件
│   │   ├── dashboard.tsx    # 后台仪表盘
│   │   ├── articles/        # 文章管理
│   │   │   ├── index.tsx    # 文章列表
│   │   │   └── new.tsx      # 新建文章
│   │   ├── anime/           # 番剧管理
│   │   │   └── manage.tsx   # 番剧管理页面
│   │   ├── comments.tsx     # 评论管理
│   │   ├── gallery.tsx      # 图库管理
│   │   ├── tags.tsx         # 标签管理
│   │   ├── settings.tsx     # 系统设置
│   │   └── cleanup.tsx      # 清理功能
│   ├── auth/                # 后台认证
│   │   ├── login.tsx        # 登录页面
│   │   ├── login.simple.tsx # 简单登录页面
│   │   └── logout.tsx       # 退出登录
│   ├── components/          # 后台专用组件
│   └── utils/               # 后台专用工具
├── api/                     # API 端点
│   ├── public/              # 公开 API
│   │   ├── animes.ts        # 番剧 API
│   │   ├── comments.tsx     # 评论 API
│   │   ├── achievement.tsx  # 成就系统 API
│   │   └── og.tsx           # Open Graph API
│   ├── auth/                # 认证 API
│   │   ├── login.ts         # 登录 API
│   │   ├── register.ts      # 注册 API
│   │   └── send-code.ts     # 验证码 API
│   ├── admin/               # 后台管理 API
│   │   ├── analytics.ts     # 分析数据 API
│   │   ├── change-password.tsx # 密码修改 API
│   │   └── purge-cache.tsx  # 缓存清理 API
│   └── user/                # 用户 API
│       └── me.ts            # 当前用户信息 API
├── shared/                  # 共享资源
│   ├── components/          # 共享组件
│   ├── contexts/            # 共享上下文
│   │   └── SettingsContext.tsx # 设置上下文
│   ├── services/            # 共享服务
│   │   ├── auth.server.ts   # 认证服务
│   │   ├── crypto.server.ts # 密码加密
│   │   ├── db.server.ts     # 数据库服务
│   │   ├── email.server.ts  # 邮件服务
│   │   ├── r2.server.ts     # R2 存储服务
│   │   └── ratelimit.ts     # 速率限制
│   └── utils/               # 共享工具
├── layouts/                 # 布局组件
│   ├── PublicLayout.tsx     # 前台布局
│   └── AdminLayout.tsx      # 后台布局
├── ui/                      # 通用 UI 组件
│   ├── common/              # 通用 UI 组件
│   └── animations/          # 动画组件
└── welcome/                 # 欢迎页相关资源
    ├── logo-dark.svg        # 深色模式 logo
    ├── logo-light.svg       # 浅色模式 logo
    └── welcome.tsx          # 欢迎页组件
```

## 3. 命名规范
- **页面文件**：使用描述性名称，嵌套路由使用目录结构
- **组件文件**：使用 PascalCase 命名（如 `AnimeCard.tsx`）
- **API 文件**：使用 `api.[resource].[action].ts` 格式（如 `api.auth.login.ts`）
- **服务文件**：使用 `[service].[type].ts` 格式（如 `auth.server.ts`）
- **工具文件**：使用描述性名称，按功能分类

## 4. 实施计划
1. 创建新的目录结构
2. 迁移核心文件到新结构
3. 重新组织前后台代码
4. 集中管理 API 端点
5. 统一共享资源管理
6. 更新导入路径
7. 测试项目运行情况
# 项目结构重构方案

## 问题分析

当前项目结构存在以下问题：
1. 路由文件混合了前台页面、后台页面和API端点
2. 组件分类不够清晰，前后台组件界限不明确
3. 缺少明确的功能模块分离
4. 导入路径复杂，维护困难

## 重构目标

1. 按照功能模块明确分离文件
2. 清晰区分前台、后台、API和共享组件
3. 简化导入路径，提高可维护性
4. 符合现代前端项目的最佳实践

## 新的目录结构

```
app/
├── admin/                  # 后台管理系统
│   ├── components/         # 后台专用组件
│   ├── pages/              # 后台页面
│   └── utils/              # 后台专用工具
├── api/                    # API 端点
│   ├── auth/               # 认证相关 API
│   ├── admin/              # 后台管理 API
│   ├── public/             # 前台公开 API
│   └── shared/             # 共享 API 工具
├── public/                 # 前台用户系统
│   ├── components/         # 前台专用组件
│   ├── pages/              # 前台页面
│   └── utils/              # 前台专用工具
├── shared/                 # 共享资源
│   ├── components/         # 共享组件
│   ├── contexts/           # 共享上下文
│   ├── services/           # 共享服务
│   └── utils/              # 共享工具
├── app.css                 # 全局样式
├── entry.server.tsx        # 服务端入口
├── root.tsx                # 根组件
└── routes.ts               # 路由配置
```

## 详细说明

### 1. 后台管理系统 (admin/)

**功能**：管理后台相关的所有文件

**包含内容**：
- `components/`：后台专用组件，如仪表盘组件、数据可视化组件等
- `pages/`：后台页面，如登录页、仪表盘、文章管理等
- `utils/`：后台专用工具函数

### 2. API 端点 (api/)

**功能**：所有 API 相关的文件

**包含内容**：
- `auth/`：认证相关 API，如登录、注册、发送验证码等
- `admin/`：后台管理 API，如修改密码、清除缓存等
- `public/`：前台公开 API，如获取文章列表、番剧数据等
- `shared/`：共享 API 工具，如请求处理、响应格式化等

### 3. 前台用户系统 (public/)

**功能**：面向普通用户的前台系统

**包含内容**：
- `components/`：前台专用组件，如文章卡片、评论组件等
- `pages/`：前台页面，如首页、文章详情、番剧列表等
- `utils/`：前台专用工具函数

### 4. 共享资源 (shared/)

**功能**：前后台共享的资源

**包含内容**：
- `components/`：共享组件，如按钮、表单、模态框等
- `contexts/`：共享上下文，如主题上下文、设置上下文等
- `services/`：共享服务，如数据库服务、存储服务等
- `utils/`：共享工具函数，如安全工具、性能工具等

## 迁移计划

### 步骤 1: 创建新目录结构

```bash
mkdir -p app/admin/components app/admin/pages app/admin/utils
mkdir -p app/api/auth app/api/admin app/api/public app/api/shared
mkdir -p app/public/components app/public/pages app/public/utils
mkdir -p app/shared/components app/shared/contexts app/shared/services app/shared/utils
```

### 步骤 2: 迁移文件

#### 后台相关文件

- 将 `app/components/admin/` 下的文件迁移到 `app/admin/components/`
- 将 `app/routes/admin.*.tsx` 下的文件迁移到 `app/admin/pages/`
- 将后台相关的工具函数迁移到 `app/admin/utils/`

#### API 相关文件

- 将 `app/routes/api.auth.*.ts` 下的文件迁移到 `app/api/auth/`
- 将 `app/routes/api.admin.*.tsx` 下的文件迁移到 `app/api/admin/`
- 将 `app/routes/api.*.ts` 下的其他 API 文件迁移到 `app/api/public/`

#### 前台相关文件

- 将 `app/components/anime/`、`app/components/global/` 下的文件迁移到 `app/public/components/`
- 将 `app/routes/` 下的前台页面迁移到 `app/public/pages/`
- 将前台相关的工具函数迁移到 `app/public/utils/`

#### 共享资源

- 将 `app/components/layouts/` 下的文件迁移到 `app/shared/components/`
- 将 `app/components/ui/` 下的通用组件迁移到 `app/shared/components/`
- 将 `app/contexts/` 下的文件迁移到 `app/shared/contexts/`
- 将 `app/services/` 下的文件迁移到 `app/shared/services/`
- 将 `app/utils/` 下的通用工具函数迁移到 `app/shared/utils/`

### 步骤 3: 更新路由配置

更新 `app/routes.ts` 文件，使用新的文件路径配置路由。

### 步骤 4: 更新导入路径

更新所有文件中的导入路径，使用新的目录结构。

### 步骤 5: 测试

确保所有页面和功能都能正常工作。

## 优势

1. **清晰的功能分离**：按照功能模块明确分离文件，便于维护和扩展
2. **简化的导入路径**：使用相对路径，减少导入复杂度
3. **更好的可扩展性**：新功能可以轻松添加到对应的模块中
4. **符合现代前端实践**：遵循现代前端项目的最佳实践
5. **提高开发效率**：开发人员可以更快地找到所需文件

## 实施建议

1. 分阶段实施，避免一次性大规模修改
2. 先迁移共享资源，再迁移前后台和API
3. 每次迁移后进行测试，确保功能正常
4. 更新文档，确保团队成员了解新的结构

## 总结

通过这次重构，我们将建立一个更加清晰、可维护的项目结构，提高开发效率和代码质量。新的结构将使团队成员更容易理解和维护代码，同时也为未来的功能扩展打下良好的基础。

---
name: api-generator
description: 生成 RESTful API 端点模板，支持 Loader 和 Action 函数。用于快速创建文章API、用户API、管理API等。
---

# API 端点生成

## API 路由结构

```
app/
├── routes/                    # React Router v7 路由
│   ├── api.articles.tsx       # GET /api/articles
│   ├── api.articles.$id.tsx  # GET/PUT/DELETE /api/articles/:id
│   ├── api.users.tsx         # 用户相关 API
│   └── api.admin.tsx         # 管理后台 API
```

## 基础 API 模板

### 资源列表 API

```typescript
// app/routes/api.articles.tsx
import { data } from 'react-router';
import { z } from 'zod';
import { successResponse, errorResponse } from '~/utils/api-response';
import { articleService } from '~/services/article';

// 查询参数验证 Schema
const ListArticlesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  authorId: z.coerce.number().int().positive().optional(),
});

export async function loader({ request, env }: LoaderFunctionArgs) {
  try {
    // 解析查询参数
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const query = ListArticlesSchema.parse(params);
    
    // 获取数据
    const result = await articleService.list(env, {
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      authorId: query.authorId,
    });
    
    return successResponse(result);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
```

### 单个资源 API

```typescript
// app/routes/api.articles.$id.tsx
import { data } from 'react-router';
import { z } from 'zod';
import { successResponse, errorResponse } from '~/utils/api-response';
import { articleService } from '~/services/article';

// 更新 Schema
const UpdateArticleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  coverImage: z.string().url().optional().nullable(),
});

// 获取单个资源
export async function loader({ params, env }: LoaderFunctionArgs) {
  try {
    const id = parseInt(params.id!, 10);
    
    if (isNaN(id)) {
      return errorResponse(new BadRequestError('无效的资源ID'));
    }
    
    const article = await articleService.getById(env, id);
    
    if (!article) {
      return errorResponse(new NotFoundError('文章', id));
    }
    
    return successResponse(article);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// 更新资源
export async function action({ request, params, env }: ActionFunctionArgs) {
  try {
    // 只处理 PUT 请求
    if (request.method !== 'PUT') {
      return errorResponse(new MethodNotAllowedError('仅支持 PUT 方法'));
    }
    
    const id = parseInt(params.id!, 10);
    
    if (isNaN(id)) {
      return errorResponse(new BadRequestError('无效的资源ID'));
    }
    
    // 验证请求体
    const body = await request.json();
    const validated = UpdateArticleSchema.parse(body);
    
    // 执行更新
    const article = await articleService.update(env, id, validated);
    
    return successResponse(article);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(new ValidationError('验证失败', error.flatten()));
    }
    return errorResponse(error as Error);
  }
}

// 删除资源
export async function action({ request, params, env }: ActionFunctionArgs) {
  try {
    // 处理 DELETE 请求
    if (request.method !== 'DELETE') {
      return errorResponse(new MethodNotAllowedError('仅支持 DELETE 方法'));
    }
    
    const id = parseInt(params.id!, 10);
    
    if (isNaN(id)) {
      return errorResponse(new BadRequestError('无效的资源ID'));
    }
    
    // 执行删除
    await articleService.delete(env, id);
    
    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
```

### 创建资源 API

```typescript
// app/routes/api.articles.new.tsx
import { data } from 'react-router';
import { z } from 'zod';
import { successResponse, errorResponse } from '~/utils/api-response';
import { articleService } from '~/services/article';

const CreateArticleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  coverImage: z.string().url().optional().nullable(),
  status: z.enum(['draft', 'published']).default('draft'),
  categoryIds: z.array(z.number().int().positive()).optional(),
});

export async function action({ request, env }: ActionFunctionArgs) {
  try {
    // 验证请求方法
    if (request.method !== 'POST') {
      return errorResponse(new MethodNotAllowedError('仅支持 POST 方法'));
    }
    
    // 验证 Content-Type
    const contentType = request.headers.get('Content-Type') ?? '';
    if (!contentType.includes('application/json')) {
      return errorResponse(new BadRequestError('Content-Type 必须为 application/json'));
    }
    
    // 解析并验证请求体
    const body = await request.json();
    const validated = CreateArticleSchema.parse(body);
    
    // 从会话获取当前用户
    const session = await getSession(env, request.headers.get('Cookie'));
    if (!session) {
      return errorResponse(new UnauthorizedError('请先登录'));
    }
    
    // 创建文章
    const article = await articleService.create(env, {
      ...validated,
      authorId: session.userId,
    });
    
    return successResponse(article, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(new ValidationError('验证失败', error.flatten()));
    }
    return errorResponse(error as Error);
  }
}
```

## 认证 API 模板

### 需要认证的 API

```typescript
// 带认证检查的 API 基类模式
export async function loader({ request, env }: LoaderFunctionArgs) {
  try {
    // 1. 获取会话
    const cookieHeader = request.headers.get('Cookie');
    const sessionId = parseCookies(cookieHeader).session;
    
    if (!sessionId) {
      return errorResponse(new UnauthorizedError('请先登录'));
    }
    
    // 2. 验证会话
    const session = await sessionService.validate(env, sessionId);
    if (!session) {
      return errorResponse(new UnauthorizedError('会话已过期'));
    }
    
    // 3. 检查权限
    if (!session.permissions.includes('article:read')) {
      return errorResponse(new ForbiddenError('无读取权限'));
    }
    
    // 4. 执行业务逻辑
    const articles = await articleService.getUserArticles(env, session.userId);
    
    return successResponse(articles);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
```

### 速率限制装饰器

```typescript
// 简单的速率限制实现
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): Promise<boolean> {
  const now = Date.now();
  const record = rateLimiter.get(identifier);
  
  if (!record || record.resetAt < now) {
    rateLimiter.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

// 使用
export async function action({ request, env }: ActionFunctionArgs) {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  
  if (!(await checkRateLimit(ip, 30, 60000))) {
    return errorResponse(new RateLimitError('请求过于频繁'));
  }
  
  // 业务逻辑...
}
```

## RESTful 路由对照表

| 方法 | 路径 | 操作 | Loader | Action |
|------|------|------|--------|--------|
| GET | /api/articles | 列表 | ✓ | - |
| GET | /api/articles/:id | 详情 | ✓ | - |
| POST | /api/articles/new | 创建 | - | ✓ |
| PUT | /api/articles/:id | 更新 | - | ✓ |
| DELETE | /api/articles/:id | 删除 | - | ✓ |
| PATCH | /api/articles/:id/like | 点赞 | - | ✓ |

## 响应状态码

| 状态码 | 说明 | 使用场景 |
|--------|------|----------|
| 200 | OK | 成功获取或更新 |
| 201 | Created | 成功创建 |
| 204 | No Content | 成功删除（无返回体） |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未登录 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 429 | Too Many Requests | 速率限制 |
| 500 | Internal Server Error | 服务器错误 |

## CORS 配置

```typescript
// 在路由中设置 CORS 头
export function loader({ request, env }: LoaderFunctionArgs) {
  // ...
  
  const response = successResponse(data);
  
  // 添加 CORS 头
  response.headers.set('Access-Control-Allow-Origin', 'https://your-domain.com');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

// 处理 OPTIONS 预检请求
export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  // 正常处理...
}
```

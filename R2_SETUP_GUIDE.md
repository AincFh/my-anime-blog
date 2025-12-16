# R2 对象存储配置指南

## ✅ 当前配置

- **存储桶名称**: `anime-blog`
- **绑定名称**: `MEDIA_BUCKET`
- **位置**: 亚太地区 (APAC)

## 🔧 配置步骤

### 1. 启用公共访问（推荐方案）

为了能够通过 URL 访问上传的文件，您需要配置 R2 的公开访问。有两种方式：

#### 方案 A: 使用公共开发 URL（开发环境）

1. 在 Cloudflare Dashboard 中，进入 R2 存储桶设置
2. 找到 "公共开发 URL" 部分
3. 点击 "启用"
4. 记录生成的公共 URL（格式类似：`https://pub-xxxxx.r2.dev`）

#### 方案 B: 使用自定义域（生产环境，推荐）

1. 在 Cloudflare Dashboard 中，进入 R2 存储桶设置
2. 找到 "自定义域" 部分
3. 点击 "连接域"
4. 输入您的子域名（例如：`media.aincfh.dpdns.org`）
5. 按照提示在 DNS 中添加 CNAME 记录
6. 等待 DNS 生效（通常几分钟）

### 2. 配置 CORS 策略（如果需要从浏览器上传）

如果您的应用需要从浏览器直接上传文件到 R2，需要配置 CORS：

1. 在 R2 存储桶设置中，找到 "CORS 策略"
2. 点击 "创建 CORS 策略"
3. 配置如下：

```json
[
  {
    "AllowedOrigins": [
      "https://aincfh.dpdns.org",
      "https://*.pages.dev",
      "http://localhost:5173"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### 3. 更新代码以使用正确的 URL

根据您选择的方案，更新 `app/services/r2.server.ts` 中的 URL 生成逻辑。

#### 如果使用公共开发 URL：

```typescript
// 在 r2.server.ts 中更新 getR2PublicUrl 函数
export function getR2PublicUrl(path: string, customDomain?: string): string {
  if (customDomain) {
    return `https://${customDomain}/${path}`;
  }
  // 使用公共开发 URL（需要从环境变量或配置中获取）
  const publicDevUrl = process.env.R2_PUBLIC_DEV_URL || 'https://pub-xxxxx.r2.dev';
  return `${publicDevUrl}/${path}`;
}
```

#### 如果使用自定义域：

```typescript
export function getR2PublicUrl(path: string, customDomain?: string): string {
  // 使用自定义域名
  const domain = customDomain || 'media.aincfh.dpdns.org';
  return `https://${domain}/${path}`;
}
```

## 📝 环境变量配置

如果使用公共开发 URL，可以在 `wrangler.jsonc` 中添加环境变量：

```jsonc
"vars": {
  "R2_PUBLIC_DEV_URL": "https://pub-xxxxx.r2.dev"
}
```

或者使用 Secrets（更安全）：

```bash
npx wrangler secret put R2_PUBLIC_DEV_URL
# 输入: https://pub-xxxxx.r2.dev
```

## 🚀 使用示例

### 上传文件

```typescript
import { uploadToR2, getR2PublicUrl } from "~/services/r2.server";

// 在路由的 action 中
export async function action({ request, context }: Route.ActionArgs) {
  const { MEDIA_BUCKET } = context.cloudflare.env;
  const formData = await request.formData();
  const file = formData.get("file") as File;

  const result = await uploadToR2(MEDIA_BUCKET, file);
  
  if (result.success && result.url) {
    // 生成完整的公开 URL
    const publicUrl = getR2PublicUrl(
      result.url.replace('/media/', ''), // 移除前缀
      'media.aincfh.dpdns.org' // 或使用环境变量
    );
    
    return json({ success: true, url: publicUrl });
  }
  
  return json({ success: false, error: result.error });
}
```

## 🔒 安全建议

1. **访问控制**：
   - 上传接口应该需要认证（只有登录用户或管理员可以上传）
   - 使用 Workers 作为代理，而不是直接暴露 R2

2. **文件类型限制**：
   - 代码中已实现文件类型检查
   - 建议在 Workers 层面也进行验证

3. **文件大小限制**：
   - 默认限制为 5MB
   - 可以根据需要调整

4. **CDN 缓存**：
   - 如果使用自定义域，Cloudflare 会自动提供 CDN 加速
   - 已设置 1 年缓存时间（可在代码中调整）

## 🐛 常见问题

### Q: 上传成功但无法访问文件？
A: 检查：
1. 是否启用了公共访问或配置了自定义域
2. URL 是否正确（包含完整路径）
3. CORS 策略是否正确配置

### Q: 从浏览器上传失败？
A: 检查：
1. CORS 策略是否已配置
2. 允许的来源是否包含您的域名
3. 浏览器控制台是否有错误信息

### Q: 如何删除文件？
A: 使用 `deleteFromR2` 函数：

```typescript
import { deleteFromR2 } from "~/services/r2.server";

await deleteFromR2(MEDIA_BUCKET, "images/123456-abc.jpg");
```

## 📚 相关文档

- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [R2 自定义域](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [R2 CORS 配置](https://developers.cloudflare.com/r2/buckets/cors/)


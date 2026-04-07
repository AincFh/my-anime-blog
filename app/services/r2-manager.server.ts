/**
 * R2 存储桶服务
 * 用于扫描和管理 R2 中的孤儿文件
 */

export interface R2FileInfo {
  key: string;
  size: number; // bytes
  uploadedAt: string;
  lastUsed: string | null; // 在文章/番剧中使用的时间
  used: boolean;
}

/**
 * 获取 R2 存储桶中的所有文件
 * 注意：Cloudflare R2 API 不支持直接列出所有对象，需要使用 Workers 代理或 S3 API 兼容接口
 */
export async function listR2Files(bucket: R2Bucket | null): Promise<R2FileInfo[]> {
  if (!bucket) {
    console.warn("R2 bucket not available");
    return [];
  }

  try {
    const files: R2FileInfo[] = [];
    let cursor: string | undefined;

    // 使用 cursor 分页列出所有对象
    do {
      const result = await bucket.list({ cursor, limit: 100 });
      
      for (const obj of result.objects) {
        const customMeta = obj.httpMetadata?.cacheControl || '';
        files.push({
          key: obj.key,
          size: obj.size,
          uploadedAt: obj.uploaded instanceof Date ? obj.uploaded.toISOString() : new Date().toISOString(),
          lastUsed: null,
          used: false, // 需要后续检查是否被引用
        });
      }

      cursor = result.cursor;
    } while (cursor);

    return files;
  } catch (error) {
    console.error("Failed to list R2 files:", error);
    return [];
  }
}

/**
 * 扫描文章和番剧中引用的图片
 */
export async function getUsedImageKeys(db: D1Database): Promise<Set<string>> {
  const usedKeys = new Set<string>();

  try {
    // 从文章中获取引用的图片
    const articles = await db.prepare("SELECT cover_image, content FROM articles").all();
    for (const article of (articles.results || [])) {
      const a = article as any;
      if (a.cover_image) {
        // 提取 R2 路径（移除域名）
        const key = extractR2Key(a.cover_image);
        if (key) usedKeys.add(key);
      }
      if (a.content) {
        // 从 markdown 内容中提取图片引用
        const matches = a.content.match(/https?:\/\/[^)\s"']+(?:images|media|uploads)[^)\s"']*/g) || [];
        for (const match of matches) {
          const key = extractR2Key(match);
          if (key) usedKeys.add(key);
        }
      }
    }

    // 从番剧中获取引用的图片
    const animes = await db.prepare("SELECT cover_url FROM animes").all();
    for (const anime of (animes.results || [])) {
      const a = anime as any;
      if (a.cover_url) {
        const key = extractR2Key(a.cover_url);
        if (key) usedKeys.add(key);
      }
    }

    // 从图库中获取引用的图片
    const gallery = await db.prepare("SELECT url FROM gallery").all();
    for (const item of (gallery.results || [])) {
      const g = item as any;
      if (g.url) {
        const key = extractR2Key(g.url);
        if (key) usedKeys.add(key);
      }
    }

    // 从用户头像中获取引用的图片
    const users = await db.prepare("SELECT avatar_url FROM users WHERE avatar_url IS NOT NULL").all();
    for (const user of (users.results || [])) {
      const u = user as any;
      if (u.avatar_url) {
        const key = extractR2Key(u.avatar_url);
        if (key) usedKeys.add(key);
      }
    }
  } catch (error) {
    console.error("Failed to get used image keys:", error);
  }

  return usedKeys;
}

/**
 * 从 URL 中提取 R2 存储路径
 */
function extractR2Key(url: string): string | null {
  if (!url) return null;
  
  // 匹配 /api/r2/xxx, /media/xxx, 或 R2 自定义域名的路径
  const patterns = [
    /\/api\/r2\/(.+)/,
    /\/media\/(.+)/,
    /images\/(.+)/,
    /uploads\/(.+\.\w+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // 如果是相对路径，直接返回
  if (url.startsWith('/')) return url.slice(1);
  
  return null;
}

/**
 * 获取孤儿文件（上传但未被任何内容引用）
 */
export async function getOrphanFiles(
  bucket: R2Bucket | null,
  db: D1Database
): Promise<R2FileInfo[]> {
  const allFiles = await listR2Files(bucket);
  const usedKeys = await getUsedImageKeys(db);

  return allFiles.map(file => ({
    ...file,
    used: usedKeys.has(file.key) || usedKeys.has(`images/${file.key}`) || usedKeys.has(`uploads/${file.key}`),
    lastUsed: usedKeys.has(file.key) ? new Date().toISOString() : null,
  })).filter(file => !file.used);
}

/**
 * 批量删除 R2 文件
 */
export async function deleteR2Files(
  bucket: R2Bucket | null,
  keys: string[]
): Promise<{ success: boolean; deletedCount: number; errors: string[] }> {
  if (!bucket) {
    return { success: false, deletedCount: 0, errors: ["R2 bucket not available"] };
  }

  const errors: string[] = [];
  let deletedCount = 0;

  for (const key of keys) {
    try {
      await bucket.delete(key);
      deletedCount++;
    } catch (error) {
      console.error(`Failed to delete ${key}:`, error);
      errors.push(`Failed to delete ${key}: ${String(error)}`);
    }
  }

  return {
    success: errors.length === 0,
    deletedCount,
    errors,
  };
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

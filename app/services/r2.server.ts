/**
 * R2 对象存储服务
 * 处理图片、音频等文件的上传和管理
 */

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 上传文件到 R2
 * @param bucket R2 Bucket 绑定
 * @param file 文件对象
 * @param path 存储路径（可选，默认使用时间戳+随机字符串）
 * @param maxSize 最大文件大小（字节，默认 5MB）
 */
export async function uploadToR2(
  bucket: R2Bucket | null,
  file: File,
  path?: string,
  maxSize: number = 5 * 1024 * 1024
): Promise<UploadResult> {
  if (!bucket) {
    return { success: false, error: 'R2 存储未配置' };
  }

  // 检查文件大小
  if (file.size > maxSize) {
    return { success: false, error: `文件大小超过限制（最大 ${maxSize / 1024 / 1024}MB）` };
  }

  // 检查文件类型
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
  ];

  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: '不支持的文件类型' };
  }

  try {
    // 生成存储路径
    const fileName = path || generateFilePath(file.name, file.type);

    // 上传到 R2
    await bucket.put(fileName, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000', // 1年缓存
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // 返回文件路径（不包含域名，由调用方使用 getR2PublicUrl 生成完整 URL）
    const url = fileName;

    return { success: true, url };
  } catch (error) {
    console.error('R2 upload error:', error);
    return { success: false, error: '文件上传失败，请稍后重试' };
  }
}

/**
 * 生成安全的随机字符串
 */
function generateSecureRandom(length: number = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 生成文件存储路径
 */
function generateFilePath(originalName: string, mimeType: string): string {
  const timestamp = Date.now();
  const random = generateSecureRandom(8);
  const ext = getFileExtension(originalName, mimeType);
  const folder = mimeType.startsWith('image/') ? 'images' : 'audio';
  return `${folder}/${timestamp}-${random}${ext}`;
}

/**
 * 根据 MIME 类型获取文件扩展名
 */
function getFileExtension(originalName: string, mimeType: string): string {
  // 优先使用原始文件名
  const originalExt = originalName.match(/\.([^.]+)$/)?.[1];
  if (originalExt) {
    return `.${originalExt}`;
  }

  // 根据 MIME 类型推断
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
  };

  return mimeToExt[mimeType] || '.bin';
}

/**
 * 删除 R2 中的文件
 */
export async function deleteFromR2(
  bucket: R2Bucket | null,
  path: string
): Promise<{ success: boolean; error?: string }> {
  if (!bucket) {
    return { success: false, error: 'R2 存储未配置' };
  }

  try {
    await bucket.delete(path);
    return { success: true };
  } catch (error) {
    console.error('R2 delete error:', error);
    // 不暴露具体的云存储错误信息，使用通用错误消息
    return { success: false, error: '文件删除失败，请稍后重试' };
  }
}

/**
 * 获取文件的公开 URL
 * 支持自定义域名、公共开发 URL 或环境变量配置
 * @param path 文件路径（不包含 /media/ 前缀）
 * @param customDomain 自定义域名（可选）
 * @param env 环境变量（可选，包含 R2_PUBLIC_DEV_URL 或 R2_CUSTOM_DOMAIN）
 */
export function getR2PublicUrl(
  path: string,
  customDomain?: string,
  env?: { R2_PUBLIC_DEV_URL?: string; R2_CUSTOM_DOMAIN?: string }
): string {
  // 移除可能的前缀
  const cleanPath = path.replace(/^\/media\//, '');

  // 优先级：1. 传入的 customDomain 2. 环境变量 R2_CUSTOM_DOMAIN 3. 环境变量 R2_PUBLIC_DEV_URL 4. 相对路径
  if (customDomain) {
    return `https://${customDomain}/${cleanPath}`;
  }

  if (env?.R2_CUSTOM_DOMAIN) {
    return `https://${env.R2_CUSTOM_DOMAIN}/${cleanPath}`;
  }

  if (env?.R2_PUBLIC_DEV_URL) {
    return `${env.R2_PUBLIC_DEV_URL}/${cleanPath}`;
  }

  // 如果没有配置，返回相对路径（需要配置 Workers 代理或使用自定义域）
  return `/media/${cleanPath}`;
}

/**
 * 处理图片上传（支持智能裁切）
 * 注意：Cloudflare Images API 需要额外配置
 */
export async function uploadImageWithSmartCrop(
  bucket: R2Bucket | null,
  file: File,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): Promise<UploadResult> {
  // 基础上传
  const result = await uploadToR2(bucket, file);
  if (!result.success || !result.url) {
    return result;
  }

  // TODO: 集成 Cloudflare Images API 进行智能裁切
  // 或者在前端使用 canvas 进行预处理

  return result;
}


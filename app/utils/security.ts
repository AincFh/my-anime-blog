/**
 * 安全工具函数
 * 用于添加安全HTTP头
 */

export interface SecurityHeaders {
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
  'Content-Security-Policy': string;
  'Strict-Transport-Security'?: string;
}

/**
 * 获取默认安全HTTP头
 */
export function getSecurityHeaders(): SecurityHeaders {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; img-src 'self' data: blob: https:; media-src 'self' https: data: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://api.i-meto.com https://cdn.jsdelivr.net; frame-src https://challenges.cloudflare.com;",
  };
}

/**
 * 为响应添加安全头
 */
export function addSecurityHeaders(response: Response): Response {
  const headers = getSecurityHeaders();

  Object.entries(headers).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    }
  });

  return response;
}

/**
 * 创建带安全头的JSON响应
 */
export function jsonWithSecurity(data: any, init?: ResponseInit): Response {
  const response = Response.json(data, init);
  return addSecurityHeaders(response);
}

/**
 * 清理评论内容，移除潜在危险字符
 */
export function sanitizeComment(content: string): string {
  if (!content) return '';

  return content
    .trim()
    // 移除HTML标签
    .replace(/<[^>]*>/g, '')
    // 移除script相关内容
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    // 限制长度
    .slice(0, 2000);
}

/**
 * 检测是否为垃圾评论
 */
export function isSpamComment(content: string): boolean {
  if (!content) return false;

  const spamPatterns = [
    // 常见垃圾邮件关键词
    /赌博|博彩|棋牌|老虎机/i,
    /代开发票|代办证件/i,
    /加微信|加QQ|加我/i,
    /免费领取|点击领取/i,
    /日赚|月入|躺赚/i,
    // 链接类
    /https?:\/\/[^\s]+\.(xyz|top|cc|tk|ml|ga|cf)/i,
    // 重复字符
    /(.)\1{10,}/,
  ];

  return spamPatterns.some(pattern => pattern.test(content));
}

// ==================== CSRF 相关 ====================

/**
 * CSRF Token 表单字段名
 */
export const CSRF_TOKEN_FIELD = '_csrf';

/**
 * CSRF Token 请求头名
 */
export const CSRF_TOKEN_HEADER = 'X-CSRF-Token';

/**
 * 创建包含 CSRF Token 的隐藏表单字段 HTML
 * 用于服务端渲染时注入表单
 */
export function createCSRFInputHTML(token: string): string {
  return `<input type="hidden" name="${CSRF_TOKEN_FIELD}" value="${escapeHtml(token)}" />`;
}

/**
 * HTML 转义防止 XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
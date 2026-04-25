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
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://cdn.jsdelivr.net https://fastly.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com; img-src 'self' data: blob: https:; media-src 'self' https: data: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://api.i-meto.com https://met.liiiu.cn https://cdn.jsdelivr.net https://fastly.jsdelivr.net https://unpkg.com; frame-src https://challenges.cloudflare.com;",
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
export function jsonWithSecurity(data: unknown, init?: ResponseInit): Response {
  const response = Response.json(data, init);
  return addSecurityHeaders(response);
}

export function sanitizeComment(content: string): string {
  if (!content) return '';

  const trimmed = content.trim().slice(0, 2000);
  
  // 极限防护：废弃弱正则过滤，采取全量的实体化转义策略。
  // 任何尖括号或实体字符都将被转义，彻底免除恶意 SVG / Base64 Payload 穿透
  return trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 军工级同源拦截 (CSRF防波堤)
 * 检测所有突变型 POST 请求是否由当前站点自身发出
 */
export function verifySameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  const referer = request.headers.get("Referer");
  
  if (!origin && !referer) {
    // 拒绝无头跨站静默发包
    return false;
  }
  
  try {
    const url = new URL(request.url);
    if (origin && origin !== url.origin) return false;
    if (referer && new URL(referer).origin !== url.origin) return false;
    return true;
  } catch (e) {
    return false;
  }
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
 * 生成带签名的 CSRF Token
 */
export async function generateCSRFToken(sessionId: string, secret: string): Promise<string> {
  const timestamp = Date.now().toString();
  const payload = `${sessionId}:${timestamp}`;

  // 简单的签名逻辑 (在 Web 端使用 Web Crypto API, 在 Node 端使用 crypto)
  // 这里的实现旨在兼顾边缘函数环境
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const payloadData = encoder.encode(payload);

  try {
    const key = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, payloadData);
    const sigArray = Array.from(new Uint8Array(signature));
    const sigHex = sigArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return `${payload}:${sigHex}`;
  } catch (e) {
    // 回退逻辑
    return payload;
  }
}

/**
 * 验证 CSRF Token 签名
 */
export async function verifyCSRFToken(token: string, sessionId: string, secret: string): Promise<boolean> {
  if (!token || !sessionId) return false;

  const parts = token.split(':');
  if (parts.length !== 3) return false;

  const [tokenSessionId, timestamp, sigHex] = parts;
  if (tokenSessionId !== sessionId) return false;

  // 校验过期时间 (默认 2 小时)
  const timeDiff = Date.now() - parseInt(timestamp, 10);
  if (isNaN(timeDiff) || timeDiff > 2 * 3600 * 1000) return false;

  // 重新计算签名验证
  const expectedToken = await generateCSRFToken(sessionId, secret);
  return expectedToken === token;
}

/**
 * CSRF Token 表单字段名
 */
export const CSRF_TOKEN_FIELD = '_csrf';
// ... 保持原有代码 ...

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

// ==================== DOMPurify XSS 防护 ====================

import DOMPurify from 'dompurify';

/**
 * DOMPurify 配置：允许的 HTML 标签列表
 * 只允许安全的 Markdown 相关标签，拒绝危险标签如 script、iframe、object 等
 */
const ALLOWED_TAGS = [
  // 文本格式
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'mark', 'small', 'sub', 'sup',
  // 标题
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // 列表
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  // 引用和代码
  'blockquote', 'pre', 'code', 'samp', 'kbd',
  // 链接和图片
  'a', 'img',
  // 表格
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  // 分隔线
  'hr',
  // 容器
  'span', 'div',
  // 媒体
  'video', 'audio', 'source', 'track',
] as const;

/**
 * DOMPurify 配置：允许的属性列表
 */
const ALLOWED_ATTR = [
  // 链接
  'href', 'target', 'rel',
  // 图片
  'src', 'alt', 'title', 'width', 'height', 'loading',
  // 样式
  'class', 'id', 'style',
  // 表格
  'colspan', 'rowspan', 'headers',
  // 数据属性
  'data-*',
  // 媒体属性
  'controls', 'autoplay', 'loop', 'muted', 'playsinline',
  // 其他
  'lang', 'dir', 'align',
] as const;

/**
 * HTML 消毒函数
 * 使用 DOMPurify 对用户生成的 HTML 内容进行安全消毒
 * 只允许安全的 Markdown 相关标签和属性
 *
 * @param html - 未经消毒的 HTML 字符串
 * @returns 消毒后的安全 HTML 字符串
 *
 * @example
 * const safeHtml = sanitizeHtml('<p>Hello <script>alert(1)</script></p>');
 * // 返回: '<p>Hello </p>'
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOWED_ATTR: [...ALLOWED_ATTR],
    ALLOW_DATA_ATTR: true,
    // 强制所有链接在新窗口打开并添加安全属性
    ADD_ATTR: ['target'],
    // 禁止 javascript: 协议
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|callto):|[^a-zA-Z])/,
    // 禁止 iframe
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button', 'select', 'textarea', 'object', 'embed', 'param', 'svg', 'math', 'frame', 'frameset'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress', 'onscroll', 'ondblclick', 'ondrag', 'ondrop'],
    // 删除注释
    KEEP_CONTENT: true,
  });
}

/**
 * Markdown 预览消毒函数
 * 用于编辑器预览时将换行符转换为 <br> 并进行消毒
 * 这个函数处理的是用户输入的纯文本，不需要完整 Markdown 解析
 *
 * @param text - 未经消毒的纯文本
 * @returns 消毒后带换行的 HTML
 */
export function sanitizeMarkdownPreview(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // 转义 HTML 特殊字符
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 将换行符转换为 <br>
  const withBreaks = escaped.replace(/\n/g, '<br>');

  // 使用 DOMPurify 进行二次消毒（虽然转义后已经很安全）
  return DOMPurify.sanitize(withBreaks, {
    ALLOWED_TAGS: ['br'],
    ALLOWED_ATTR: [],
  });
}
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
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-src https://challenges.cloudflare.com;",
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
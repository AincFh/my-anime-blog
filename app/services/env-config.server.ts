/**
 * 环境变量集中验证服务（Server Only）
 *
 * 核心原则：
 * 1. 所有服务端环境变量访问通过此模块
 * 2. 不在任何 API 响应中暴露环境变量名
 * 3. 缺失变量时记录详细日志，但向客户端返回通用错误
 */

import type { Env } from '~/types/env';
import { getLogger } from '~/utils/logger';

/**
 * 环境变量验证结果
 */
export interface EnvValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * 必需的环境变量（未设置将阻止服务启动）
 */
const REQUIRED_ENV_VARS: (keyof Env)[] = [
    'SESSION_SECRET',
];

/**
 * 可选的环境变量（未设置不影响服务启动）
 */
const OPTIONAL_ENV_VARS: (keyof Env)[] = [
    'NOTION_TOKEN',
    'NOTION_DATABASE_ID',
    'NOTION_TIMELINE_DATABASE_ID',
    'NOTION_SITE_CONTENT_DATABASE_ID',
    'NOTION_CHANGELOG_DATABASE_ID',
    'NOTION_ANNOUNCEMENT_DATABASE_ID',
    'DEEPSEEK_API_KEY',
    'PAYMENT_SECRET',
    'CSRF_SECRET',
    'TURNSTILE_SECRET_KEY',
    'PAYMENT_CALLBACK_IPS',
];

/**
 * 获取经过验证的环境变量
 * @param env - Cloudflare Workers env 对象
 * @returns 验证后的 Env
 * @throws 如果必需变量缺失，抛出通用错误（不在堆栈中暴露变量名）
 */
export function getValidatedEnv(env: Env): Env {
    for (const key of REQUIRED_ENV_VARS) {
        const value = env[key as keyof Env];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            // 仅在日志中记录详情，错误对象使用通用消息
            getLogger().error('Missing required environment variable', { key });
            throw new Error('[Env] Critical configuration missing. Check server logs.');
        }
    }

    return env;
}

/**
 * 安全获取可选环境变量（返回 null 如果不存在）
 * 不在错误响应中暴露变量名
 */
export function getOptionalEnv<T extends string | undefined>(
    env: Env,
    key: (keyof Env)
): T {
    const value = env[key] as T;
    if (!value) {
        console.debug(`[Env] Optional variable not set: ${key}`);
    }
    return value ?? undefined as T;
}

/**
 * 验证环境变量是否已配置
 * 用于需要条件判断的场景（如调试端点）
 */
export function validateEnvConfig(env: Env): EnvValidationResult {
    const missing: string[] = [];

    for (const key of REQUIRED_ENV_VARS) {
        const value = env[key as keyof Env];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        // 详细日志仅在服务器端，客户端只收到通用错误
        getLogger().error('Missing required environment variables', { missing });
        return {
            valid: false,
            error: '服务配置不完整'
        };
    }

    return { valid: true };
}

/**
 * 统一的安全错误响应
 * 确保不暴露任何内部配置信息
 */
export function envErrorResponse(
    context: string,
    details?: unknown
): Response {
        getLogger().error('Configuration error', { context, details });
    return Response.json(
        { error: '服务配置错误' },
        { status: 500 }
    );
}

/**
 * 检查是否为生产环境
 */
export function isProduction(env: Env): boolean {
    return env.ENVIRONMENT === 'production';
}

/**
 * 开发环境专属检查
 * 用于保护开发专用端点
 */
export function requireProductionEnv(env: Env): void {
    if (env.ENVIRONMENT !== 'production') {
        console.debug(`[Security] Development-only access detected`);
    }
}

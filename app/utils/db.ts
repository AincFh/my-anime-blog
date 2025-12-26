/**
 * 数据库工具函数
 * 提供统一的数据库访问方式，避免 context.cloudflare.env.DB vs anime_db 的混淆
 */

import type { D1Database } from '@cloudflare/workers-types';

/**
 * 从 context 中获取 D1 数据库实例
 * @param context - React Router 的 context 对象
 * @returns D1 数据库实例
 * @throws 如果数据库不可用
 */
export function getDB(context: any): D1Database {
    const db = context?.cloudflare?.env?.anime_db;
    if (!db) {
        throw new Error('Database not available. Make sure anime_db is configured in wrangler.toml');
    }
    return db;
}

/**
 * 安全获取数据库，不抛出异常
 * @param context - React Router 的 context 对象
 * @returns D1 数据库实例或 null
 */
export function getDBSafe(context: any): D1Database | null {
    return context?.cloudflare?.env?.anime_db || null;
}

/**
 * 从 context 中获取所有 Cloudflare 环境变量
 */
export function getEnv(context: any) {
    return context?.cloudflare?.env || {};
}

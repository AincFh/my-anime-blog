/**
 * 结构化日志系统
 * 用于 Cloudflare Workers 环境的统一日志记录
 */

import type { KVNamespace } from '@cloudflare/workers-types';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: number;
    requestId?: string;
    userId?: number;
    ip?: string;
    userAgent?: string;
    path?: string;
    method?: string;
    duration?: number;
    statusCode?: number;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    metadata?: Record<string, unknown>;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    critical: 4,
};

/**
 * 生成请求 ID
 */
export function generateRequestId(): string {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 从请求中提取客户端信息
 */
export function extractClientInfo(request: Request): { ip: string; userAgent: string } {
    const cfConnectingIp = request.headers.get('CF-Connecting-IP');
    const xForwardedFor = request.headers.get('X-Forwarded-For');
    const xRealIp = request.headers.get('X-Real-IP');
    const ip = cfConnectingIp || xForwardedFor?.split(',')[0].trim() || xRealIp || 'unknown';

    return {
        ip,
        userAgent: request.headers.get('User-Agent') || 'unknown',
    };
}

/**
 * 日志记录器
 */
export class Logger {
    private kv: KVNamespace | null;
    private minLevel: LogLevel;
    private context: Partial<LogEntry>;

    constructor(kv?: KVNamespace, minLevel: LogLevel = 'info') {
        this.kv = kv || null;
        this.minLevel = minLevel;
        this.context = {};
    }

    /**
     * 设置日志上下文（适用于单次请求）
     */
    setContext(context: Partial<LogEntry>): void {
        this.context = { ...this.context, ...context };
    }

    /**
     * 检查是否应该记录此级别
     */
    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
    }

    /**
     * 格式化日志条目
     */
    private formatEntry(level: LogLevel, message: string, metadata?: Record<string, unknown>): LogEntry {
        return {
            level,
            message,
            timestamp: Date.now(),
            ...this.context,
            metadata,
        };
    }

    /**
     * 输出到控制台
     */
    private console(entries: LogEntry[]): void {
        for (const entry of entries) {
            const prefix = `[${entry.level.toUpperCase()}]`;
            const meta = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';
            const userInfo = entry.userId ? ` [user:${entry.userId}]` : '';
            const pathInfo = entry.path ? ` ${entry.method || 'GET'} ${entry.path}` : '';

            const logMessage = `${prefix}${pathInfo}${userInfo} ${entry.message}${meta}`;

            switch (entry.level) {
                case 'debug':
                    console.debug(logMessage);
                    break;
                case 'info':
                    console.info(logMessage);
                    break;
                case 'warn':
                    console.warn(logMessage);
                    break;
                case 'error':
                case 'critical':
                    console.error(logMessage, entry.error?.stack || '');
                    break;
            }
        }
    }

    /**
     * 写入 KV（异步，不阻塞主线程）
     */
    private async writeToKV(entries: LogEntry[]): Promise<void> {
        if (!this.kv) return;

        const date = new Date().toISOString().split('T')[0];
        const hour = new Date().getHours().toString().padStart(2, '0');
        const key = `logs:${date}:${hour}`;

        try {
            const existing = await this.kv.get(key, 'json');
            const logs = (existing as LogEntry[]) || [];
            logs.push(...entries);

            // 保留最近 1000 条日志
            const trimmed = logs.slice(-1000);

            await this.kv.put(key, JSON.stringify(trimmed), {
                expirationTtl: 7 * 24 * 60 * 60 // 7天过期
            });
        } catch (e) {
            console.error('Failed to write logs to KV:', e);
        }
    }

    /**
     * 记录日志
     */
    async log(level: LogLevel, message: string, metadata?: Record<string, unknown>): Promise<void> {
        if (!this.shouldLog(level)) return;

        const entry = this.formatEntry(level, message, metadata);
        this.console([entry]);

        // 异步写入 KV，不阻塞
        if (level === 'error' || level === 'critical') {
            this.writeToKV([entry]).catch(() => {});
        }
    }

    debug(message: string, metadata?: Record<string, unknown>): Promise<void> {
        return this.log('debug', message, metadata);
    }

    info(message: string, metadata?: Record<string, unknown>): Promise<void> {
        return this.log('info', message, metadata);
    }

    warn(message: string, metadata?: Record<string, unknown>): Promise<void> {
        return this.log('warn', message, metadata);
    }

    error(message: string, metadata?: Record<string, unknown>): Promise<void> {
        return this.log('error', message, metadata);
    }

    critical(message: string, metadata?: Record<string, unknown>): Promise<void> {
        return this.log('critical', message, metadata);
    }

    /**
     * 记录请求完成
     */
    async logRequest(
        request: Request,
        responseStatus: number,
        duration: number,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        const { ip, userAgent } = extractClientInfo(request);
        this.setContext({
            ip,
            userAgent,
            path: new URL(request.url).pathname,
            method: request.method,
            statusCode: responseStatus,
            duration,
        });

        const level: LogLevel = responseStatus >= 500 ? 'error' :
            responseStatus >= 400 ? 'warn' : 'info';

        await this.log(level, `Request completed: ${responseStatus}`, metadata);
    }

    /**
     * 创建子日志器（保留上下文）
     */
    child(additionalContext: Partial<LogEntry>): Logger {
        const child = new Logger(this.kv, this.minLevel);
        child.context = { ...this.context, ...additionalContext };
        return child;
    }
}

/**
 * 创建全局日志实例
 */
let globalLogger: Logger | null = null;

export function getLogger(kv?: KVNamespace, minLevel?: LogLevel): Logger {
    if (!globalLogger) {
        globalLogger = new Logger(kv, minLevel);
    }
    return globalLogger;
}

/**
 * 快速记录 API 请求
 */
export async function logAPIRequest(
    request: Request,
    handler: () => Promise<Response>
): Promise<Response> {
    const start = Date.now();
    const requestId = generateRequestId();

    const logger = getLogger();
    logger.setContext({ requestId });

    try {
        const response = await handler();
        const duration = Date.now() - start;

        await logger.logRequest(request, response.status, duration, {
            requestId,
        });

        return response;
    } catch (error) {
        const duration = Date.now() - start;

        await logger.error('Request failed', {
            requestId,
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
            } : undefined,
        });

        throw error;
    }
}
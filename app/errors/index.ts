/**
 * 应用统一错误类
 * 用于标准化错误处理和日志记录
 */

export type ErrorCode =
    | 'VALIDATION_ERROR'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'RATE_LIMIT_EXCEEDED'
    | 'INTERNAL_SERVER_ERROR'
    | 'EXTERNAL_SERVICE_ERROR'
    | 'PAYMENT_ERROR';

export class AppError extends Error {
    public readonly code: ErrorCode;
    public readonly statusCode: number;
    public readonly details?: unknown;

    constructor(message: string, code: ErrorCode = 'INTERNAL_SERVER_ERROR', statusCode: number = 500, details?: unknown) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;

        // 维持原型链 (TypeScript 编译为 ES5 时需要)
        Object.setPrototypeOf(this, AppError.prototype);
    }

    static badRequest(message: string, details?: unknown) {
        return new AppError(message, 'VALIDATION_ERROR', 400, details);
    }

    static unauthorized(message: string = '未登录或登录已过期') {
        return new AppError(message, 'UNAUTHORIZED', 401);
    }

    static forbidden(message: string = '无权访问此资源') {
        return new AppError(message, 'FORBIDDEN', 403);
    }

    static notFound(message: string = '资源不存在') {
        return new AppError(message, 'NOT_FOUND', 404);
    }

    static tooManyRequests(message: string = '请求过于频繁，请稍后再试') {
        return new AppError(message, 'RATE_LIMIT_EXCEEDED', 429);
    }

    static internal(message: string = '服务器内部错误', details?: unknown) {
        return new AppError(message, 'INTERNAL_SERVER_ERROR', 500, details);
    }
}

/**
 * 统一错误处理工具
 */

export interface AppErrorOptions {
    status?: number;
    code?: string;
    data?: any;
}

export class AppError extends Error {
    public status: number;
    public code: string;
    public data: any;

    constructor(message: string, options: AppErrorOptions = {}) {
        super(message);
        this.name = 'AppError';
        this.status = options.status || 500;
        this.code = options.code || 'UNKNOWN_ERROR';
        this.data = options.data || null;
    }

    static isAppError(error: any): error is AppError {
        return error instanceof AppError;
    }
}

export function isRouteError(error: any): boolean {
    return error?.status === 404 || error?.status === 500;
}

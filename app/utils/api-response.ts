/**
 * 统一 API 响应格式工具
 * 确保所有 API 返回一致的响应结构
 */

/** 成功响应 */
export function apiSuccess<T>(data: T, message?: string): Response {
    return Response.json({
        success: true,
        data,
        message: message || "操作成功",
        timestamp: Date.now(),
    });
}

/** 错误响应 */
export function apiError(
    message: string,
    status: number = 400,
    details?: unknown
): Response {
    return Response.json(
        {
            success: false,
            error: message,
            details,
            timestamp: Date.now(),
        },
        { status }
    );
}

/** 分页响应 */
export function apiPaginated<T>(
    items: T[],
    total: number,
    page: number,
    pageSize: number,
    message?: string
): Response {
    return Response.json({
        success: true,
        data: {
            items,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
                hasNext: page * pageSize < total,
                hasPrev: page > 1,
            },
        },
        message: message || "获取成功",
        timestamp: Date.now(),
    });
}

/** 空响应（用于无返回值的操作） */
export function apiEmpty(message: string = "操作完成"): Response {
    return Response.json({
        success: true,
        message,
        timestamp: Date.now(),
    });
}
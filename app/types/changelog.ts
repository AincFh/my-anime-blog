/**
 * 更新日志类型定义
 */

export interface ChangelogItem {
    id: string;
    title: string;       // 更新标题
    status: string;      // 状态
    version: string;     // 版本号
    type: string;        // 更新类型
    date: string;        // 日期
    summary: string;    // 摘要
    slug: string;        // slug
    featured: boolean;   // 首页展示
    major: boolean;      // 重大更新
    content?: string;    // 正文内容
}

export interface ChangelogResponse {
    success: boolean;
    data: ChangelogItem[];
    error?: string;
}

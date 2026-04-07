/**
 * 网站公告类型定义
 */

export interface Announcement {
    id: string;
    title: string;           // 公告标题
    status: string;          // 状态
    type: string;            // 类型
    displayMode: string;     // 展示方式
    priority: number;        // 优先级
    summary: string;        // 摘要
    startDate: string;      // 开始日期
    endDate: string | null; // 结束日期
    featured: boolean;       // 首页展示
    ctaText: string | null; // 按钮文案
    ctaLink: string | null;  // 按钮链接
    content?: string;       // 正文内容
}

export interface AnnouncementResponse {
    success: boolean;
    data: Announcement[];
    error?: string;
}

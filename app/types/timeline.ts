/**
 * 时光机类型定义
 * 对应 Notion 数据库字段
 */

export interface TimelineItem {
    id: string;
    title: string;          // 记录标题
    status: string;         // 状态：✅ 已发布 / 草稿
    type: string;           // 类型：网站里程碑 / 功能上线 / 界面调整 / 修复记录 / 开发随记
    date: string;           // 日期
    summary: string;        // 摘要
    slug: string;           // slug
    featured: boolean;      // 首页展示
    cover: string | null;  // 配图
    content?: string;       // 正文内容（可选）
}

export interface TimelineResponse {
    success: boolean;
    data: TimelineItem[];
    error?: string;
}

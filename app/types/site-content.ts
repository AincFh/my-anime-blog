/**
 * 网站设定类型定义
 */

export interface SiteContent {
    id: string;
    name: string;       // 条目名称
    status: string;      // 状态
    type: string;       // 类型
    pageKey: string;    // 页面标识
    page: string;       // 所属页面
    summary: string;    // 摘要
    sort: number;       // 排序
    navDisplay: boolean; // 导航显示
}

export interface SiteContentResponse {
    success: boolean;
    data: SiteContent[];
    error?: string;
}

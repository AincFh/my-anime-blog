/**
 * Notion CMS 服务统一导出
 *
 * 统一入口，所有 Notion 数据库的对接服务都从这里导出。
 * 前台页面和 API 层应从这里 import，而不是直接引用子路径。
 *
 * 架构原则：
 * - Server Only：所有服务都只能用于 loader / action / API 端点
 * - 缓存优先：KV 缓存层在 Notion API 之上
 * - 降级兜底：Notion 不可用时返回空数据而不是报错
 */

// 文章（Notion 读取 + D1 同步）
export {
    fetchNotionArticles,
    getNotionArticleContent,
    type NotionArticle,
} from "./notion.server";

export {
    syncNotionArticles,
    getSyncHistory,
    type SyncResult,
} from "./notion-sync.server";

// 网站设定
export { getSiteContent } from "./content/site-content";

// 更新日志
export { getChangelog } from "./content/changelog";

// 时光机
export { getTimeline } from "./timeline";

// 网站公告
export { getAnnouncements } from "./announcement";

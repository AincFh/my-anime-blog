/**
 * Cloudflare Analytics Engine 服务
 * 用于网站访问统计和数据分析
 */

export interface AnalyticsEvent {
    // 事件类型
    type: 'pageview' | 'article_read' | 'search' | 'login' | 'register' | 'ai_chat' | 'ai_recommend';
    // 页面路径
    path?: string;
    // 文章 ID
    articleId?: number;
    // 搜索关键词
    searchQuery?: string;
    // 用户 ID（可选）
    userId?: number;
    // 设备类型
    device?: 'mobile' | 'tablet' | 'desktop';
    // 来源
    referrer?: string;
    // 额外数据
    metadata?: Record<string, string | number>;
}

/**
 * 记录分析事件
 */
export function trackEvent(
    analytics: AnalyticsEngineDataset,
    event: AnalyticsEvent,
    request?: Request
): void {
    try {
        const timestamp = Date.now();
        const userAgent = request?.headers.get('user-agent') || '';
        const country = request?.cf?.country as string || 'unknown';

        // 检测设备类型
        const device = event.device || detectDevice(userAgent);

        analytics.writeDataPoint({
            blobs: [
                event.type,
                event.path || '',
                event.searchQuery || '',
                device,
                country,
                event.referrer || '',
                JSON.stringify(event.metadata || {}),
            ],
            doubles: [
                timestamp,
                event.articleId || 0,
                event.userId || 0,
            ],
            indexes: [event.type],
        });
    } catch (error) {
        console.error('Analytics tracking error:', error);
    }
}

/**
 * 记录页面浏览
 */
export function trackPageView(
    analytics: AnalyticsEngineDataset,
    path: string,
    request?: Request
): void {
    trackEvent(analytics, { type: 'pageview', path }, request);
}

/**
 * 记录文章阅读
 */
export function trackArticleRead(
    analytics: AnalyticsEngineDataset,
    articleId: number,
    articleTitle: string,
    request?: Request
): void {
    trackEvent(
        analytics,
        {
            type: 'article_read',
            articleId,
            metadata: { title: articleTitle },
        },
        request
    );
}

/**
 * 记录搜索行为
 */
export function trackSearch(
    analytics: AnalyticsEngineDataset,
    query: string,
    resultsCount: number,
    request?: Request
): void {
    trackEvent(
        analytics,
        {
            type: 'search',
            searchQuery: query,
            metadata: { results: resultsCount },
        },
        request
    );
}

/**
 * 记录 AI 聊天
 */
export function trackAIChat(
    analytics: AnalyticsEngineDataset,
    userId?: number,
    request?: Request
): void {
    trackEvent(analytics, { type: 'ai_chat', userId }, request);
}

/**
 * 记录 AI 推荐
 */
export function trackAIRecommend(
    analytics: AnalyticsEngineDataset,
    articleId: number,
    userId?: number,
    request?: Request
): void {
    trackEvent(
        analytics,
        { type: 'ai_recommend', articleId, userId },
        request
    );
}

/**
 * 记录用户登录
 */
export function trackLogin(
    analytics: AnalyticsEngineDataset,
    userId: number,
    request?: Request
): void {
    trackEvent(analytics, { type: 'login', userId }, request);
}

/**
 * 记录用户注册
 */
export function trackRegister(
    analytics: AnalyticsEngineDataset,
    userId: number,
    request?: Request
): void {
    trackEvent(analytics, { type: 'register', userId }, request);
}

/**
 * 检测设备类型
 */
function detectDevice(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
    const ua = userAgent.toLowerCase();

    if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
        return 'tablet';
    }

    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
        return 'mobile';
    }

    return 'desktop';
}

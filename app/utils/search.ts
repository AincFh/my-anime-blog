/**
 * 高级搜索服务
 * 基于 Cloudflare Workers AI 的语义搜索能力
 */

export interface SearchOptions {
    /** 搜索类型 */
    type?: 'articles' | 'animes' | 'comments' | 'all';
    /** 模糊匹配阈值 (0-1) */
    threshold?: number;
    /** 最大结果数 */
    limit?: number;
    /** 是否启用 AI 语义搜索 */
    semantic?: boolean;
    /** 过滤器 */
    filters?: {
        category?: string;
        status?: string;
        dateFrom?: number;
        dateTo?: number;
    };
}

export interface SearchResult {
    id: string | number;
    type: 'article' | 'anime' | 'comment';
    title: string;
    excerpt: string;
    url: string;
    score: number;
    metadata?: Record<string, unknown>;
}

/**
 * 快速文本搜索（基于关键词匹配）
 */
export function quickSearch(
    query: string,
    items: Array<{ id: string | number; title: string; content?: string; [key: string]: unknown }>,
    options: { limit?: number; threshold?: number } = {}
): SearchResult[] {
    const { limit = 20, threshold = 0 } = options;
    const queryLower = query.toLowerCase().trim();

    if (!queryLower) return [];

    const results: Array<SearchResult & { _score: number }> = [];

    for (const item of items) {
        let score = 0;
        const titleLower = String(item.title || '').toLowerCase();
        const contentLower = String(item.content || '').toLowerCase();

        // 标题精确匹配
        if (titleLower === queryLower) {
            score = 100;
        }
        // 标题开头匹配
        else if (titleLower.startsWith(queryLower)) {
            score = 80;
        }
        // 标题包含匹配
        else if (titleLower.includes(queryLower)) {
            score = 60;
        }
        // 内容包含匹配
        else if (contentLower.includes(queryLower)) {
            score = 40;
        }
        // 分词匹配（简单）
        else {
            const queryWords = queryLower.split(/\s+/);
            const titleWords = titleLower.split(/\s+/);
            const contentWords = contentLower.split(/\s+/);

            const matchedWords = queryWords.filter(word =>
                titleWords.some(tw => tw.includes(word)) ||
                contentWords.some(cw => cw.includes(word))
            );

            if (matchedWords.length > 0) {
                score = (matchedWords.length / queryWords.length) * 30;
            }
        }

        if (score > threshold) {
            results.push({
                id: item.id,
                type: 'article',
                title: String(item.title),
                excerpt: String(item.content || '').slice(0, 200),
                url: `/articles/${item.id}`,
                score,
                _score: score,
            });
        }
    }

    // 排序并返回
    return results
        .sort((a, b) => b._score - a._score)
        .slice(0, limit)
        .map(({ _score, ...result }) => result);
}

/**
 * 搜索结果高亮
 */
export function highlightSearchResult(text: string, query: string): string {
    if (!query.trim()) return text;

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');

    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
}

/**
 * 搜索历史管理
 */
export class SearchHistory {
    private key = 'search_history';
    private maxItems = 50;

    get(): Array<{ query: string; timestamp: number }> {
        try {
            const data = localStorage.getItem(this.key);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    add(query: string): void {
        const history = this.get();

        // 移除重复
        const filtered = history.filter(item => item.query !== query);

        // 添加到开头
        filtered.unshift({
            query: query.trim(),
            timestamp: Date.now(),
        });

        // 限制数量
        const trimmed = filtered.slice(0, this.maxItems);

        try {
            localStorage.setItem(this.key, JSON.stringify(trimmed));
        } catch {
            // Ignore storage errors
        }
    }

    clear(): void {
        try {
            localStorage.removeItem(this.key);
        } catch {
            // Ignore
        }
    }
}

/**
 * 搜索建议（基于历史和热门）
 */
export function generateSearchSuggestions(
    partialQuery: string,
    history: string[],
    popular: string[] = [],
    limit = 5
): string[] {
    const queryLower = partialQuery.toLowerCase().trim();

    if (!queryLower) {
        // 无输入时返回热门搜索
        return popular.slice(0, limit);
    }

    const suggestions = new Set<string>();

    // 从历史中匹配
    for (const item of history) {
        if (item.toLowerCase().includes(queryLower)) {
            suggestions.add(item);
            if (suggestions.size >= limit) break;
        }
    }

    // 从热门中匹配
    for (const item of popular) {
        if (item.toLowerCase().includes(queryLower)) {
            suggestions.add(item);
            if (suggestions.size >= limit) break;
        }
    }

    return Array.from(suggestions).slice(0, limit);
}
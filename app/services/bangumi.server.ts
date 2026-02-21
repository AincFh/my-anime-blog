/**
 * Bangumi.tv API 服务
 * 提供番剧搜索、详情获取等功能
 */

const BANGUMI_API_BASE = 'https://api.bgm.tv';

// 类型定义
export interface BangumiSearchResult {
    id: number;
    name: string;
    name_cn: string;
    type: number;
    images?: {
        large?: string;
        common?: string;
        medium?: string;
        small?: string;
        grid?: string;
    };
    summary?: string;
    air_date?: string;
    rating?: {
        score: number;
        total: number;
        rank?: number;
    };
    eps_count?: number;
}

export interface BangumiSubject {
    id: number;
    type: number;
    name: string;
    name_cn: string;
    summary: string;
    date?: string;
    images?: {
        large?: string;
        common?: string;
        medium?: string;
        small?: string;
        grid?: string;
    };
    eps: number;
    total_episodes?: number;
    rating?: {
        score: number;
        total: number;
        rank?: number;
    };
    tags?: Array<{
        name: string;
        count: number;
    }>;
    infobox?: Array<{
        key: string;
        value: any;
    }>;
}

export interface BangumiCharacter {
    id: number;
    name: string;
    relation: string;
    images?: {
        large?: string;
        medium?: string;
        small?: string;
        grid?: string;
    };
    actors?: Array<{
        id: number;
        name: string;
        images?: {
            large?: string;
            medium?: string;
            small?: string;
        };
    }>;
}

export interface BangumiPerson {
    id: number;
    name: string;
    relation: string;
    images?: {
        large?: string;
        medium?: string;
        small?: string;
        grid?: string;
    };
}

interface BangumiSearchResponse {
    results?: number;
    list?: any[];
}

/**
 * 搜索番剧
 */
export async function searchAnime(keyword: string, limit: number = 10): Promise<BangumiSearchResult[]> {
    if (!keyword || keyword.trim().length === 0) {
        return [];
    }

    try {
        const url = `${BANGUMI_API_BASE}/search/subject/${encodeURIComponent(keyword)}?type=2&responseGroup=small&max_results=${limit}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'my-anime-blog/1.0 (https://my-anime-blog.fhainc.workers.dev)',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Bangumi search failed:', response.status);
            return [];
        }

        const data: BangumiSearchResponse = await response.json();

        if (data && data.list && Array.isArray(data.list)) {
            return data.list.map((item: any) => ({
                id: item.id,
                name: item.name || '',
                name_cn: item.name_cn || item.name || '',
                type: item.type,
                images: item.images,
                summary: item.summary,
                air_date: item.air_date,
                rating: item.rating,
                eps_count: item.eps_count,
            }));
        }

        return [];
    } catch (error) {
        console.error('Bangumi search error:', error);
        return [];
    }
}

/**
 * 获取番剧详细信息
 */
export async function getAnimeDetail(subjectId: number): Promise<BangumiSubject | null> {
    try {
        const url = `${BANGUMI_API_BASE}/v0/subjects/${subjectId}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'my-anime-blog/1.0 (https://my-anime-blog.fhainc.workers.dev)',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Bangumi detail fetch failed:', response.status);
            return null;
        }

        const data = await response.json();
        return data as BangumiSubject;
    } catch (error) {
        console.error('Bangumi detail error:', error);
        return null;
    }
}

/**
 * 获取番剧角色列表
 */
export async function getAnimeCharacters(subjectId: number): Promise<BangumiCharacter[]> {
    try {
        const url = `${BANGUMI_API_BASE}/v0/subjects/${subjectId}/characters`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'my-anime-blog/1.0 (https://my-anime-blog.fhainc.workers.dev)',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Bangumi characters fetch failed:', response.status);
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Bangumi characters error:', error);
        return [];
    }
}

/**
 * 获取番剧制作人员
 */
export async function getAnimeStaff(subjectId: number): Promise<BangumiPerson[]> {
    try {
        const url = `${BANGUMI_API_BASE}/v0/subjects/${subjectId}/persons`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'my-anime-blog/1.0 (https://my-anime-blog.fhainc.workers.dev)',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Bangumi staff fetch failed:', response.status);
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Bangumi staff error:', error);
        return [];
    }
}

/**
 * 从 infobox 提取制作公司等信息
 */
export function extractInfoFromInfobox(infobox: Array<{ key: string; value: any }> | undefined): {
    studio?: string;
    director?: string;
    originalWork?: string;
} {
    if (!infobox) return {};

    const result: { studio?: string; director?: string; originalWork?: string } = {};

    for (const item of infobox) {
        if (item.key === '动画制作' || item.key === '製作') {
            result.studio = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
        }
        if (item.key === '导演' || item.key === '監督') {
            result.director = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
        }
        if (item.key === '原作') {
            result.originalWork = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
        }
    }

    return result;
}

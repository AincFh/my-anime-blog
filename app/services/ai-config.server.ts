/**
 * AI 功能开关与配置服务
 * 从 system_settings 读取 AI 相关配置
 */

import { queryFirst } from './db.server';

// ============ 类型定义 ============

import { type AIConfig } from '~/types/ai';

const DEFAULT_AI_CONFIG: AIConfig = {
    enabled: true,
    features: {
        chat: true,
        summary: true,
        writing: true,
        moderate: true,
        seo: true,
        tags: true,
        search: true,
        recommend: true,
    },
    chatbot: {
        name: 'MAGI',
        welcomeMessage: 'Need some anime recommendations?',
        placeholder: 'Ask me anything...',
    },
    limits: {
        dailyTotal: 100,
        perFeature: {},
    },
};

export type { AIConfig };

// ============ 配置读取 ============

/**
 * 从数据库获取 AI 配置
 */
export async function getAIConfig(db: any): Promise<AIConfig> {
    try {
        const settings = await queryFirst<{ config_json: string }>(
            db,
            'SELECT config_json FROM system_settings WHERE id = 1'
        );

        if (!settings?.config_json) {
            return DEFAULT_AI_CONFIG;
        }

        const config = JSON.parse(settings.config_json);
        const aiConfig = config.ai || {};

        // 合并默认配置
        return {
            enabled: aiConfig.enabled ?? DEFAULT_AI_CONFIG.enabled,
            features: {
                ...DEFAULT_AI_CONFIG.features,
                ...aiConfig.features,
            },
            limits: {
                dailyTotal: aiConfig.limits?.dailyTotal ?? DEFAULT_AI_CONFIG.limits!.dailyTotal,
                perFeature: {
                    ...DEFAULT_AI_CONFIG.limits!.perFeature,
                    ...aiConfig.limits?.perFeature,
                },
            },
            chatbot: {
                ...DEFAULT_AI_CONFIG.chatbot,
                ...aiConfig.chatbot,
            },
        };
    } catch (error) {
        console.error('Failed to get AI config:', error);
        return DEFAULT_AI_CONFIG;
    }
}

/**
 * 检查特定 AI 功能是否启用
 */
export async function isAIFeatureEnabled(
    db: any,
    feature: keyof AIConfig['features']
): Promise<boolean> {
    const config = await getAIConfig(db);
    return config.enabled && config.features[feature];
}

/**
 * 获取 Deepseek API Key
 * 从 Cloudflare Workers 的 env 对象获取
 */
export function getDeepseekAPIKey(env: { DEEPSEEK_API_KEY?: string }): string | null {
    return env?.DEEPSEEK_API_KEY || null;
}

/**
 * 验证 API Key 是否有效
 */
export async function validateAPIKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch('https://api.deepseek.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });
        return response.ok;
    } catch {
        return false;
    }
}

// ============ 博客上下文构建 ============

/**
 * 构建博客上下文信息（用于聊天机器人）
 */
export async function buildBlogContext(db: any): Promise<string> {
    try {
        // 获取最新文章列表
        const articles = await db.prepare(`
      SELECT title, slug, summary, category, tags
      FROM articles
      WHERE status = 'published'
      ORDER BY created_at DESC
      LIMIT 20
    `).all();

        // 获取番剧列表
        const animes = await db.prepare(`
      SELECT title, status, rating, review
      FROM animes
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

        let context = '## 博客文章\n';
        for (const article of articles.results || []) {
            context += `- 《${article.title}》(${article.category || '未分类'}): ${article.summary || '暂无摘要'}\n`;
        }

        context += '\n## 追番记录\n';
        for (const anime of animes.results || []) {
            const statusMap: Record<string, string> = {
                watching: '在看',
                completed: '已完成',
                dropped: '弃坑',
                plan: '计划中',
            };
            context += `- 《${anime.title}》${statusMap[anime.status] || anime.status}${anime.rating ? ` 评分:${anime.rating}/10` : ''}\n`;
        }

        return context;
    } catch (error) {
        console.error('Failed to build blog context:', error);
        return '暂无博客信息';
    }
}

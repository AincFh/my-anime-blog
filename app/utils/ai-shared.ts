/**
 * AI 共享工具和类型
 * 可以在客户端和服务器端安全使用
 */

export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AICompletionOptions {
    model?: string;
    messages: AIMessage[];
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
}

export interface AICompletionResult {
    success: boolean;
    content?: string;
    error?: string;
    tokensUsed?: number;
    cached?: boolean;
}

/**
 * 构建 AI 消息数组
 */
export function buildMessages(
    prompt: { system: string; user: string }
): AIMessage[] {
    return [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
    ];
}

export const AI_PROMPTS = {
    /** 文章摘要生成 */
    summary: (content: string) => ({
        system: `你是一个专业的文章摘要助手。请用简洁、吸引人的语言生成文章摘要。
要求：
1. 摘要长度在 100-200 字之间
2. 突出文章的核心观点和亮点
3. 使用适合二次元博客风格的语言
4. 不要使用"本文"、"这篇文章"等开头`,
        user: `请为以下文章生成摘要：\n\n${content}`,
    }),

    /** 智能搜索 */
    search: (query: string, articlesContext: string) => ({
        system: `你是一个智能搜索助手。用户会提问，你需要根据提供的文章列表，找出最相关的文章并解释为什么相关。
返回格式为 JSON 数组：[{"slug": "文章slug", "relevance": "相关原因"}]
如果没有相关文章，返回空数组 []`,
        user: `用户问题：${query}\n\n可用文章：\n${articlesContext}`,
    }),

    /** 写作助手 - 续写 */
    writingContinue: (content: string) => ({
        system: `你是一个创意写作助手。请根据用户提供的内容，自然地续写下去。
保持：
1. 与原文风格一致
2. 逻辑连贯
3. 内容丰富有趣`,
        user: `请续写以下内容（约 200-300 字）：\n\n${content}`,
    }),

    /** 写作助手 - 润色 */
    writingPolish: (content: string) => ({
        system: `你是一个专业的文字编辑。请润色用户提供的内容，使其更加流畅、优美、有感染力。
注意：
1. 保持原意不变
2. 修正语法和用词问题
3. 提升文学性`,
        user: `请润色以下内容：\n\n${content}`,
    }),

    /** 聊天机器人 */
    chat: (systemContext: string) => ({
        system: `你是「A.T. Field」二次元博客的 AI 助手，名叫「小绫」。
性格：活泼可爱、热情、略带傲娇
语言风格：使用适量的颜文字和二次元用语

博客信息：
${systemContext}

回复要求：
1. 友好、有趣、有个性
2. 如果问到博客内容，基于提供的信息回答
3. 如果不确定，诚实说明
4. 回复简洁，一般不超过 150 字`,
    }),

    /** 内容审核 */
    moderate: (content: string) => ({
        system: `你是内容安全审核助手。请判断以下内容是否包含：
1. 垃圾广告
2. 侮辱性言论
3. 政治敏感内容
4. 色情或暴力内容

返回 JSON 格式：
{
  "safe": true/false,
  "reason": "如果不安全，说明原因",
  "category": "spam/hate/political/nsfw/safe"
}`,
        user: `请审核：${content}`,
    }),

    /** SEO 元数据生成 */
    seo: (title: string, content: string) => ({
        system: `你是 SEO 专家。请根据文章标题和内容，生成优化的 SEO 元数据。
返回 JSON 格式：
{
  "metaTitle": "SEO 优化后的标题（50-60字符）",
  "metaDescription": "描述（120-160字符）",
  "keywords": ["关键词1", "关键词2", ...]
}`,
        user: `标题：${title}\n\n内容摘要：${content.slice(0, 1000)}`,
    }),

    /** 标签生成 */
    tags: (title: string, content: string) => ({
        system: `你是标签生成助手。请根据文章内容生成合适的标签。
要求：
1. 返回 3-6 个标签
2. 标签简洁（2-4 个字）
3. 返回 JSON 数组格式：["标签1", "标签2", ...]`,
        user: `标题：${title}\n\n内容：${content.slice(0, 2000)}`,
    }),

    /** 推荐理由生成 */
    recommend: (currentArticle: string, candidateArticles: string) => ({
        system: `你是文章推荐助手。根据用户正在阅读的文章，从候选列表中选择最相关的 3-5 篇推荐。
返回 JSON 格式：
[{"slug": "文章slug", "reason": "推荐理由（15字以内）"}]`,
        user: `当前阅读：${currentArticle}\n\n候选文章：${candidateArticles}`,
    }),
};

/**
 * 安全解析 JSON（AI 返回的内容可能包含额外文本）
 */
export function safeParseJSON<T>(content: string, fallback: T): T {
    try {
        // 尝试提取 JSON 部分
        const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(content);
    } catch {
        console.error('Failed to parse AI JSON response:', content);
        return fallback;
    }
}

/**
 * Cloudflare Workers AI 服务
 * 使用 Cloudflare 原生 AI 模型替代第三方 API
 */

// AI 模型类型
export type AIModel =
    | '@cf/meta/llama-3-8b-instruct'
    | '@cf/meta/llama-2-7b-chat-int8'
    | '@cf/qwen/qwen1.5-14b-chat-awq'
    | '@cf/mistral/mistral-7b-instruct-v0.1'
    | '@hf/thebloke/deepseek-coder-6.7b-instruct-awq';

export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AIResponse {
    response: string;
}

export interface AIImageDescription {
    description: string;
}

/**
 * 使用 Workers AI 进行文本生成
 */
export async function generateText(
    ai: Ai,
    messages: AIMessage[],
    model: AIModel = '@cf/meta/llama-3-8b-instruct'
): Promise<string> {
    try {
        const response = await ai.run(model, {
            messages,
            max_tokens: 1024,
            temperature: 0.7,
        }) as AIResponse;

        return response.response || '';
    } catch (error) {
        console.error('Workers AI error:', error);
        // 保留原始错误信息，便于调试
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`AI 生成失败: ${message}`, { cause: error });
    }
}

/**
 * 使用 Workers AI 进行聊天
 */
export async function chat(
    ai: Ai,
    userMessage: string,
    systemPrompt?: string,
    history: AIMessage[] = []
): Promise<string> {
    const messages: AIMessage[] = [];

    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push(...history);
    messages.push({ role: 'user', content: userMessage });

    return generateText(ai, messages);
}

/**
 * 使用 Workers AI 生成文章摘要
 */
export async function summarizeArticle(
    ai: Ai,
    content: string,
    maxLength: number = 200
): Promise<string> {
    const messages: AIMessage[] = [
        {
            role: 'system',
            content: `你是一个专业的文章摘要生成器。请将用户提供的文章内容压缩成不超过${maxLength}字的摘要，保留关键信息。只输出摘要内容，不要有其他说明。`,
        },
        {
            role: 'user',
            content: content,
        },
    ];

    return generateText(ai, messages);
}

/**
 * 使用 Workers AI 生成文章标签
 */
export async function generateTags(
    ai: Ai,
    title: string,
    content: string
): Promise<string[]> {
    const messages: AIMessage[] = [
        {
            role: 'system',
            content: '你是一个标签生成器。根据文章标题和内容，生成3-5个相关的标签。只输出标签，用逗号分隔，不要有其他说明。',
        },
        {
            role: 'user',
            content: `标题：${title}\n\n内容：${content.substring(0, 2000)}`,
        },
    ];

    const response = await generateText(ai, messages);
    return response.split(/[,，]/).map(tag => tag.trim()).filter(Boolean);
}

/**
 * 使用 Workers AI 进行内容审核
 */
export async function moderateContent(
    ai: Ai,
    content: string
): Promise<{ isApproved: boolean; reason?: string }> {
    const messages: AIMessage[] = [
        {
            role: 'system',
            content: `你是一个内容审核员。检查用户提供的内容是否包含违规信息（如色情、暴力、仇恨言论、违法内容等）。
如果内容合规，只回复"APPROVED"。
如果内容违规，回复"REJECTED: [原因]"。`,
        },
        {
            role: 'user',
            content: content,
        },
    ];

    const response = await generateText(ai, messages);

    if (response.startsWith('APPROVED')) {
        return { isApproved: true };
    } else {
        const reason = response.replace('REJECTED:', '').trim();
        return { isApproved: false, reason };
    }
}

/**
 * 使用 Workers AI 生成文章推荐
 */
export async function recommendArticles(
    ai: Ai,
    currentArticle: { title: string; content: string },
    candidateArticles: Array<{ id: number; title: string; description: string }>
): Promise<number[]> {
    const candidateList = candidateArticles
        .map((a, i) => `${i + 1}. [ID:${a.id}] ${a.title}`)
        .join('\n');

    const messages: AIMessage[] = [
        {
            role: 'system',
            content: `你是一个文章推荐系统。根据用户正在阅读的文章，从候选列表中选择最相关的3篇文章进行推荐。
只输出推荐文章的ID，用逗号分隔，如：1,5,3`,
        },
        {
            role: 'user',
            content: `当前文章：${currentArticle.title}\n\n候选文章：\n${candidateList}`,
        },
    ];

    const response = await generateText(ai, messages);
    const ids = response.match(/\d+/g)?.map(Number) || [];

    return ids.filter(id => candidateArticles.some(a => a.id === id));
}

// 导出默认聊天机器人系统提示
export const DEFAULT_CHATBOT_PROMPT = `你是 A.T. Field 博客的 AI 助手。
你的性格活泼友好，喜欢动漫和游戏。
回答要简洁有趣，可以使用 emoji。
如果用户问到博客内容，可以推荐他们去阅读相关文章。`;

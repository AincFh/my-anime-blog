/**
 * AI 相关类型定义
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

export interface AIConfig {
    enabled: boolean;
    features: {
        chat: boolean;
        summary: boolean;
        writing: boolean;
        moderate: boolean;
        seo: boolean;
        tags: boolean;
        search: boolean;
        recommend: boolean;
    };
    chatbot: {
        name: string;
        welcomeMessage: string;
        placeholder: string;
    };
}

/**
 * 国际化 (i18n) 系统
 * 支持多语言切换，基于 React Context
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// 支持的语言
export const SUPPORTED_LANGUAGES = ['zh-CN', 'en-US'] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];

// 默认语言
export const DEFAULT_LANGUAGE: Language = 'zh-CN';

// 语言名称映射
export const LANGUAGE_NAMES: Record<Language, string> = {
    'zh-CN': '简体中文',
    'en-US': 'English',
};

// 翻译函数类型
export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

// 翻译上下文
interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: TranslateFn;
    formatNumber: (num: number) => string;
    formatDate: (date: Date | number, style?: 'short' | 'medium' | 'long') => string;
    formatRelativeTime: (date: Date | number) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

// 翻译数据存储
const translations: Record<Language, Record<string, string>> = {
    'zh-CN': {},
    'en-US': {},
};

/**
 * 加载翻译文件
 */
export async function loadTranslations(language: Language): Promise<void> {
    if (translations[language] && Object.keys(translations[language]).length > 0) {
        return; // Already loaded
    }

    try {
        const module = await import(`./locales/${language}.ts`);
        translations[language] = module.default || module;
    } catch (error) {
        console.warn(`Failed to load translations for ${language}:`, error);
        translations[language] = {};
    }
}

/**
 * 注册翻译数据（静态加载）
 */
export function registerTranslations(language: Language, data: Record<string, string>): void {
    translations[language] = { ...translations[language], ...data };
}

/**
 * 获取嵌套的翻译值
 */
function getNestedValue(obj: Record<string, string>, path: string): string | undefined {
    const keys = path.split('.');
    let value: unknown = obj;

    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = (value as Record<string, unknown>)[key];
        } else {
            return undefined;
        }
    }

    return typeof value === 'string' ? value : undefined;
}

/**
 * I18n Provider 组件
 */
export function I18nProvider({
    children,
    initialLanguage = DEFAULT_LANGUAGE,
}: {
    children: ReactNode;
    initialLanguage?: Language;
}) {
    const [language, setLanguageState] = useState<Language>(initialLanguage);

    const setLanguage = useCallback((lang: Language) => {
        if (lang !== language) {
            loadTranslations(lang);
            setLanguageState(lang);

            // 持久化到 localStorage
            try {
                localStorage.setItem('language', lang);
            } catch {
                // Ignore storage errors
            }
        }
    }, [language]);

    const t = useCallback<TranslateFn>((key: string, params?: Record<string, string | number>): string => {
        const langTranslations = translations[language] || translations[DEFAULT_LANGUAGE];
        let text = getNestedValue(langTranslations, key) || key;

        // 替换参数
        if (params) {
            for (const [paramKey, paramValue] of Object.entries(params)) {
                text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
            }
        }

        return text;
    }, [language]);

    const formatNumber = useCallback((num: number): string => {
        return new Intl.NumberFormat(language).format(num);
    }, [language]);

    const formatDate = useCallback((date: Date | number, style: 'short' | 'medium' | 'long' = 'medium'): string => {
        const d = typeof date === 'number' ? new Date(date * 1000) : date;
        const options: Intl.DateTimeFormatOptions = {
            short: { month: 'numeric', day: 'numeric' },
            medium: { year: 'numeric', month: 'long', day: 'numeric' },
            long: { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' },
        }[style];

        return new Intl.DateTimeFormat(language, options).format(d);
    }, [language]);

    const formatRelativeTime = useCallback((date: Date | number): string => {
        const d = typeof date === 'number' ? new Date(date * 1000) : date;
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });

        if (diffDay > 30) {
            return formatDate(d, 'medium');
        } else if (diffDay > 0) {
            return rtf.format(-diffDay, 'day');
        } else if (diffHour > 0) {
            return rtf.format(-diffHour, 'hour');
        } else if (diffMin > 0) {
            return rtf.format(-diffMin, 'minute');
        } else {
            return rtf.format(-diffSec, 'second');
        }
    }, [language, formatDate]);

    return (
        <I18nContext.Provider value={{ language, setLanguage, t, formatNumber, formatDate, formatRelativeTime }}>
            {children}
        </I18nContext.Provider>
    );
}

/**
 * 使用 i18n 上下文
 */
export function useI18n(): I18nContextType {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return context;
}

/**
 * 简化翻译调用（用于非组件文件）
 */
export function createT(language: Language = DEFAULT_LANGUAGE): TranslateFn {
    return (key: string, params?: Record<string, string | number>): string => {
        const langTranslations = translations[language] || translations[DEFAULT_LANGUAGE];
        let text = getNestedValue(langTranslations, key) || key;

        if (params) {
            for (const [paramKey, paramValue] of Object.entries(params)) {
                text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
            }
        }

        return text;
    };
}
/**
 * 个性化功能同意状态管理 Hook
 * 使用 localStorage 存储用户的同意状态
 */

import { useState, useEffect, useCallback } from 'react';

const CONSENT_STORAGE_KEY = 'personalization_consent';
const CONSENT_SEEN_KEY = 'personalization_consent_seen';

export interface ConsentState {
    /** 用户是否已查看过同意提示 */
    hasSeenConsent: boolean;
    /** 用户是否已同意（查看即同意） */
    hasConsented: boolean;
    /** 同意时间戳 */
    consentedAt: number | null;
}

export function usePersonalizationConsent() {
    const [state, setState] = useState<ConsentState>({
        hasSeenConsent: false,
        hasConsented: false,
        consentedAt: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    // 从 localStorage 加载状态
    useEffect(() => {
        if (typeof window === 'undefined') {
            setIsLoading(false);
            return;
        }

        try {
            const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as ConsentState;
                setState(parsed);
            }
        } catch (error) {
            console.error('Failed to load consent state:', error);
        }
        setIsLoading(false);
    }, []);

    // 标记用户已查看同意提示（查看即同意）
    const markConsentSeen = useCallback(() => {
        const newState: ConsentState = {
            hasSeenConsent: true,
            hasConsented: true,
            consentedAt: Date.now(),
        };

        setState(newState);

        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newState));
            } catch (error) {
                console.error('Failed to save consent state:', error);
            }
        }
    }, []);

    // 撤销同意（清除个性化数据）
    const revokeConsent = useCallback(() => {
        const newState: ConsentState = {
            hasSeenConsent: true,
            hasConsented: false,
            consentedAt: null,
        };

        setState(newState);

        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newState));
                // 清除可能存储的个性化数据
                localStorage.removeItem('browsing_history');
                localStorage.removeItem('reading_preferences');
            } catch (error) {
                console.error('Failed to revoke consent:', error);
            }
        }
    }, []);

    // 重置所有状态（用于测试）
    const resetConsent = useCallback(() => {
        setState({
            hasSeenConsent: false,
            hasConsented: false,
            consentedAt: null,
        });

        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem(CONSENT_STORAGE_KEY);
            } catch (error) {
                console.error('Failed to reset consent:', error);
            }
        }
    }, []);

    return {
        ...state,
        isLoading,
        markConsentSeen,
        revokeConsent,
        resetConsent,
    };
}

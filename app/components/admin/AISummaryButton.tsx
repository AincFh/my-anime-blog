/**
 * AI 摘要生成按钮
 * 一键生成文章摘要
 */

import { useState, useCallback } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface AISummaryButtonProps {
    /** 文章内容 */
    content: string;
    /** 摘要生成后的回调 */
    onSummaryGenerated: (summary: string) => void;
    /** 按钮样式类 */
    className?: string;
}

export function AISummaryButton({ content, onSummaryGenerated, className = "" }: AISummaryButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!content.trim() || content.length < 50) {
            setError("文章内容太短（至少50字）");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/ai/summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });

            const data = await res.json() as { success: boolean; summary?: string; error?: string };

            if (data.success && data.summary) {
                onSummaryGenerated(data.summary);
            } else {
                setError(data.error || "生成失败");
            }
        } catch (err) {
            console.error("AI Summary error:", err);
            setError("网络错误");
        } finally {
            setIsLoading(false);
        }
    }, [content, onSummaryGenerated]);

    return (
        <div className="inline-flex items-center gap-2">
            <button
                onClick={handleGenerate}
                disabled={isLoading || !content.trim()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-start to-primary-end text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Sparkles className="w-4 h-4" />
                )}
                {isLoading ? "生成中..." : "AI 生成摘要"}
            </button>
            {error && (
                <span className="text-xs text-red-500">{error}</span>
            )}
        </div>
    );
}

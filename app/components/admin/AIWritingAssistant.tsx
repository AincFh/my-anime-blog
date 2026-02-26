/**
 * AI 写作助手面板
 * 集成到文章编辑器，提供续写、润色、翻译等功能
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand2, Languages, CheckCircle, PenTool, Loader2, X, Copy, Check } from "lucide-react";

type WritingAction = "continue" | "polish" | "translate" | "correct";

interface AIWritingAssistantProps {
    /** 当前选中或全部内容 */
    content: string;
    /** 插入生成的内容 */
    onInsert: (text: string) => void;
    /** 替换原内容 */
    onReplace: (text: string) => void;
}

const ACTIONS: { key: WritingAction; label: string; icon: typeof Wand2; description: string }[] = [
    { key: "continue", label: "续写", icon: PenTool, description: "根据内容继续写下去" },
    { key: "polish", label: "润色", icon: Wand2, description: "优化文字表达" },
    { key: "translate", label: "翻译", icon: Languages, description: "中英互译" },
    { key: "correct", label: "纠错", icon: CheckCircle, description: "检查并修正错误" },
];

export function AIWritingAssistant({ content, onInsert, onReplace }: AIWritingAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [targetLang, setTargetLang] = useState("英文");

    const handleAction = useCallback(async (action: WritingAction) => {
        if (!content.trim()) {
            setError("请先选择或输入一些内容");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch("/api/ai/writing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: content.trim(),
                    action,
                    targetLang: action === "translate" ? targetLang : undefined,
                }),
            });

            const data = await res.json() as { success: boolean; result?: string; error?: string };

            if (data.success && data.result) {
                setResult(data.result);
            } else {
                setError(data.error || "AI 处理失败");
            }
        } catch (err) {
            console.error("AI Writing error:", err);
            setError("网络错误，请稍后再试");
        } finally {
            setIsLoading(false);
        }
    }, [content, targetLang]);

    const handleCopy = useCallback(() => {
        if (result) {
            navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [result]);

    const handleInsert = useCallback(() => {
        if (result) {
            onInsert(result);
            setResult(null);
            setIsOpen(false);
        }
    }, [result, onInsert]);

    const handleReplace = useCallback(() => {
        if (result) {
            onReplace(result);
            setResult(null);
            setIsOpen(false);
        }
    }, [result, onReplace]);

    return (
        <div className="relative">
            {/* 触发按钮 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-start to-primary-end text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
                <Sparkles className="w-4 h-4" />
                AI 助手
            </button>

            {/* 面板 */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full left-0 mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden bg-slate-900/95 backdrop-blur-xl border border-white/10"
                    >
                        {/* 头部 */}
                        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary-start" />
                                <span className="font-bold text-slate-800 dark:text-white">AI 写作助手</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>

                        {/* 内容 */}
                        <div className="p-4">
                            {/* 操作按钮 */}
                            {!result && !isLoading && (
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                        已选择 {content.length} 个字符
                                    </p>

                                    {ACTIONS.map((action) => (
                                        <button
                                            key={action.key}
                                            onClick={() => handleAction(action.key)}
                                            disabled={!content.trim()}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <action.icon className="w-5 h-5 text-primary-start" />
                                            <div className="text-left">
                                                <div className="font-medium text-slate-800 dark:text-white text-sm">
                                                    {action.label}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    {action.description}
                                                </div>
                                            </div>
                                        </button>
                                    ))}

                                    {/* 翻译语言选择 */}
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                                        <span className="text-xs text-slate-500">翻译目标:</span>
                                        <select
                                            value={targetLang}
                                            onChange={(e) => setTargetLang(e.target.value)}
                                            className="flex-1 text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white outline-none"
                                        >
                                            <option value="英文">英文</option>
                                            <option value="日文">日文</option>
                                            <option value="中文">中文</option>
                                            <option value="韩文">韩文</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* 加载中 */}
                            {isLoading && (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 text-primary-start animate-spin" />
                                    <p className="text-sm text-slate-500 mt-3">AI 正在处理中...</p>
                                </div>
                            )}

                            {/* 结果显示 */}
                            {result && (
                                <div className="space-y-3">
                                    <div className="max-h-48 overflow-y-auto p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                                        <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                                            {result}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCopy}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            {copied ? "已复制" : "复制"}
                                        </button>
                                        <button
                                            onClick={handleInsert}
                                            className="flex-1 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm"
                                        >
                                            插入
                                        </button>
                                        <button
                                            onClick={handleReplace}
                                            className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-primary-start to-primary-end text-white hover:opacity-90 transition-opacity text-sm"
                                        >
                                            替换
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setResult(null)}
                                        className="w-full text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    >
                                        返回选择其他操作
                                    </button>
                                </div>
                            )}

                            {/* 错误提示 */}
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

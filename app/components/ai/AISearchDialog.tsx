/**
 * AI 智能搜索对话框
 * 语义搜索，理解用户问题并匹配相关文章
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Loader2, X, ArrowRight } from "lucide-react";
import { Link } from "react-router";

interface SearchResult {
    slug: string;
    relevance: string;
}

interface AISearchDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AISearchDialog({ isOpen, onClose }: AISearchDialogProps) {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // 打开时聚焦输入框
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // ESC 关闭
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    const handleSearch = useCallback(async () => {
        if (!query.trim() || query.length < 2) {
            setError("请输入至少2个字符");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResults([]);
        setHasSearched(true);

        try {
            const res = await fetch("/api/ai/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: query.trim() }),
            });

            const data = await res.json() as { success: boolean; results?: SearchResult[]; error?: string };

            if (data.success && data.results) {
                setResults(data.results);
            } else {
                setError(data.error || "搜索失败");
            }
        } catch (err) {
            console.error("AI Search error:", err);
            setError("网络错误，请稍后再试");
        } finally {
            setIsLoading(false);
        }
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSearch();
        }
    };

    const handleResultClick = () => {
        onClose();
        setQuery("");
        setResults([]);
        setHasSearched(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
                onClick={onClose}
            >
                {/* 背景遮罩 */}
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                {/* 搜索框 */}
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
                    style={{
                        background: "var(--card-bg)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid var(--glass-border)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 输入区域 */}
                    <div className="flex items-center gap-3 p-4 border-b border-slate-200/50 dark:border-slate-700/50">
                        <Sparkles className="w-5 h-5 text-primary-start flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="用自然语言描述你想找的内容..."
                            className="flex-1 bg-transparent text-slate-800 dark:text-white placeholder-slate-400 outline-none text-lg"
                        />
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 text-primary-start animate-spin flex-shrink-0" />
                        ) : (
                            <button
                                onClick={handleSearch}
                                disabled={!query.trim()}
                                className="p-2 rounded-lg bg-gradient-to-r from-primary-start to-primary-end text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {/* 结果区域 */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {/* 加载中 */}
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-primary-start animate-spin" />
                                <p className="text-sm text-slate-500 mt-3">AI 正在理解你的问题...</p>
                            </div>
                        )}

                        {/* 结果列表 */}
                        {!isLoading && results.length > 0 && (
                            <div className="p-4 space-y-2">
                                <p className="text-xs text-slate-500 mb-3">
                                    找到 {results.length} 个相关结果
                                </p>
                                {results.map((result, index) => (
                                    <Link
                                        key={result.slug}
                                        to={`/articles/${result.slug}`}
                                        onClick={handleResultClick}
                                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-800 dark:text-white group-hover:text-primary-start transition-colors">
                                                {result.slug.replace(/-/g, " ")}
                                            </div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                                {result.relevance}
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-start transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* 无结果 */}
                        {!isLoading && hasSearched && results.length === 0 && !error && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Search className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                                <p className="text-slate-500 mt-3">没有找到相关内容</p>
                                <p className="text-sm text-slate-400">试试换个问题？</p>
                            </div>
                        )}

                        {/* 错误提示 */}
                        {error && (
                            <div className="p-4">
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                                    {error}
                                </div>
                            </div>
                        )}

                        {/* 初始状态提示 */}
                        {!isLoading && !hasSearched && (
                            <div className="p-6 text-center">
                                <p className="text-slate-500">
                                    ✨ 试试问我：
                                </p>
                                <div className="flex flex-wrap justify-center gap-2 mt-3">
                                    {["有关于 React 的文章吗？", "推荐一些番剧相关的内容", "技术教程"].map((example) => (
                                        <button
                                            key={example}
                                            onClick={() => setQuery(example)}
                                            className="px-3 py-1.5 text-sm rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            {example}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

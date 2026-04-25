import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";

/**
 * 极速全文搜索（Ctrl+K）
 * 基于 D1 FTS5 的毫秒级搜索
 */
interface SearchResult {
    id: number;
    type: "article" | "anime";
    title: string;
    description?: string;
    slug?: string;
    url: string;
}

export function InstantSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Ctrl+K 快捷键
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === "Escape") {
                setIsOpen(false);
                setQuery("");
                setResults([]);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // 聚焦输入框
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // 搜索
    const performSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ q }),
            });

            const data = await response.json() as { success?: boolean; results?: SearchResult[]; error?: string };

            if (data.success && data.results) {
                setResults(data.results);
                setSelectedIndex(0);
            } else {
                setResults([]);
            }
        } catch {
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 防抖搜索
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => performSearch(query), 180);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, performSearch]);

    // 键盘导航
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
        }
    };

    const handleSelect = (result: SearchResult) => {
        navigate(result.url);
        setIsOpen(false);
        setQuery("");
        setResults([]);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 遮罩层 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setIsOpen(false); setQuery(""); }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* 搜索框 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-[101] w-full max-w-2xl px-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="glass-panel-deep rounded-2xl shadow-2xl overflow-hidden border border-white/10">
                            {/* 搜索输入框 */}
                            <div className="flex items-center gap-4 p-4 border-b border-white/5">
                                <svg
                                    className="w-5 h-5 text-indigo-400 shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="搜索文章、番剧..."
                                    className="flex-1 bg-transparent outline-none text-white placeholder-white/30 text-base"
                                />
                                {isLoading && (
                                    <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin shrink-0" />
                                )}
                                {query && !isLoading && (
                                    <button
                                        onClick={() => setQuery("")}
                                        className="text-white/40 hover:text-white transition-colors shrink-0"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                                <kbd className="px-2 py-1 text-xs bg-white/10 rounded border border-white/15 text-white/50 shrink-0">
                                    ESC
                                </kbd>
                            </div>

                            {/* 搜索结果 */}
                            <div className="max-h-80 overflow-y-auto">
                                {results.length > 0 ? (
                                    <div className="py-2">
                                        {results.map((result, index) => (
                                            <motion.div
                                                key={`${result.type}-${result.id}`}
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                onClick={() => handleSelect(result)}
                                                className={`
                                                    px-4 py-3 cursor-pointer flex items-center gap-4 mx-2 rounded-xl transition-colors
                                                    ${index === selectedIndex
                                                        ? "bg-indigo-500/20 border border-indigo-500/30"
                                                        : "hover:bg-white/5 border border-transparent"
                                                    }
                                                `}
                                            >
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-base
                                                    ${result.type === "article"
                                                        ? "bg-blue-500/20 text-blue-400"
                                                        : "bg-purple-500/20 text-purple-400"
                                                    }
                                                `}>
                                                    {result.type === "article" ? "📝" : "🎬"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-white font-medium mb-0.5 line-clamp-1">
                                                        {result.title}
                                                    </h3>
                                                    {result.description && (
                                                        <p className="text-xs text-white/40 line-clamp-1">
                                                            {result.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-white/30 shrink-0 px-2 py-0.5 bg-white/5 rounded">
                                                    {result.type === "article" ? "文章" : "番剧"}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : query.length >= 2 && !isLoading ? (
                                    <div className="p-8 text-center text-white/40">
                                        <p className="text-sm">没有找到相关结果</p>
                                    </div>
                                ) : query.length > 0 && query.length < 2 ? (
                                    <div className="p-6 text-center text-white/30 text-sm">
                                        再多打几个字…
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-white/30">
                                        <p className="text-sm mb-3">输入关键词开始搜索</p>
                                        <div className="flex items-center justify-center gap-3 text-xs">
                                            <span className="flex items-center gap-1">
                                                <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/15">Ctrl</kbd>
                                                <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/15">K</kbd>
                                            </span>
                                            <span className="text-white/40">打开搜索</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

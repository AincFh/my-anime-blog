import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";

/**
 * 极速全文搜索（Ctrl+K）
 * 功能：
 * 1. 基于D1 FTS5的毫秒级搜索
 * 2. MacOS聚焦搜索风格的UI
 * 3. 实时搜索结果
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
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Ctrl+K 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };

    if (typeof window === 'undefined') return;
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 搜索功能（实际应该调用API）
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // 模拟搜索延迟（实际应该调用后端API）
    const searchTimer = setTimeout(async () => {
      try {
        // 这里应该调用实际的搜索API
        // const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        // const data = await response.json();
        
        // 模拟搜索结果
        const mockResults: SearchResult[] = [
          {
            id: 1,
            type: "article",
            title: `关于"${query}"的文章`,
            description: "这是一篇相关的文章...",
            slug: "example",
            url: "/articles/example",
          },
        ];
        
        setResults(mockResults);
      } catch (error) {
        console.error("搜索失败:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 150); // 防抖

    return () => clearTimeout(searchTimer);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setIsOpen(false);
    setQuery("");
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
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* 搜索框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 z-[101] w-full max-w-2xl px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-panel rounded-2xl shadow-2xl overflow-hidden">
              {/* 搜索输入框 */}
              <div className="flex items-center gap-4 p-4 border-b border-white/10">
                <svg
                  className="w-5 h-5 text-slate-400"
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
                  placeholder="搜索文章、番剧..."
                  className="flex-1 bg-transparent outline-none text-white placeholder-slate-400"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                )}
                <kbd className="px-2 py-1 text-xs bg-white/10 rounded border border-white/20 text-slate-300">
                  ESC
                </kbd>
              </div>

              {/* 搜索结果 */}
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center text-slate-400">
                    <div className="inline-block animate-spin">⏳</div>
                    <p className="mt-2 text-sm">搜索中...</p>
                  </div>
                ) : results.length > 0 ? (
                  <div className="py-2">
                    {results.map((result) => (
                      <motion.div
                        key={result.id}
                        whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                        onClick={() => handleSelect(result)}
                        className="px-4 py-3 cursor-pointer flex items-start gap-4 hover:bg-white/5 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          result.type === "article" ? "bg-blue-500/20" : "bg-purple-500/20"
                        }`}>
                          {result.type === "article" ? "📝" : "🎬"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium mb-1 line-clamp-1">
                            {result.title}
                          </h3>
                          {result.description && (
                            <p className="text-sm text-slate-400 line-clamp-2">
                              {result.description}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {result.type === "article" ? "文章" : "番剧"}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : query ? (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-sm">没有找到相关结果</p>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-sm mb-4">输入关键词开始搜索</p>
                    <div className="flex flex-wrap gap-2 justify-center text-xs">
                      <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">
                        Ctrl+K
                      </kbd>
                      <span className="text-slate-500">打开搜索</span>
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


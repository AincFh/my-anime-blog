import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { sanitizeMarkdownPreview } from "~/utils/security";

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
    const [preview, setPreview] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [slashMenuOpen, setSlashMenuOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // 简单的 Markdown 预览（后续可以集成 marked）
        setPreview(value);
    }, [value]);

    // Focus Mode Effect: Toggle body class or overlay
    useEffect(() => {
        if (isFocusMode) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isFocusMode]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "/") {
            setSlashMenuOpen(true);
        } else if (slashMenuOpen) {
            if (e.key === "Escape") {
                setSlashMenuOpen(false);
            }
        }
    };

    const insertMarkdown = (syntax: string, offset: number = 0) => {
        if (!textareaRef.current) return;
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        // 如果是斜杠触发的，删除斜杠
        const prefix = text.slice(0, start - (slashMenuOpen ? 1 : 0));
        const suffix = text.slice(end);

        const newValue = prefix + syntax + suffix;
        onChange(newValue);
        setSlashMenuOpen(false);

        // 恢复焦点并移动光标
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + syntax.length - offset, start + syntax.length - offset);
        }, 0);
    };

    return (
        <motion.div
            className={isFocusMode ? "fixed inset-0 z-50 bg-[#FDF6E3] dark:bg-[#1a1b26] p-8 overflow-y-auto" : "w-full"}
            layout
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
            {/* Slash Command Menu */}
            {slashMenuOpen && (
                <div className="absolute z-50 bg-white dark:bg-slate-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 p-2 w-64 top-20 left-20 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-xs font-bold text-gray-400 px-2 py-1 mb-1">基础块</div>
                    {[
                        { label: "一级标题", icon: "H1", action: () => insertMarkdown("# ", 0) },
                        { label: "二级标题", icon: "H2", action: () => insertMarkdown("## ", 0) },
                        { label: "列表", icon: "📝", action: () => insertMarkdown("- ", 0) },
                        { label: "引用", icon: "❝", action: () => insertMarkdown("> ", 0) },
                        { label: "代码块", icon: "💻", action: () => insertMarkdown("```\n\n```", 4) },
                    ].map((item) => (
                        <button
                            key={item.label}
                            onClick={item.action}
                            className="w-full text-left flex items-center gap-3 px-2 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm text-gray-700 dark:text-gray-200"
                        >
                            <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-[rgba(37,40,54,0.85)] rounded text-xs font-bold">
                                {item.icon}
                            </span>
                            {item.label}
                        </button>
                    ))}
                </div>
            )}

            {/* 编辑器工具栏 */}
            <div className={`flex items-center gap-2 mb-2 p-2 rounded-lg border transition-all ${isFocusMode
                    ? "bg-transparent border-transparent max-w-4xl mx-auto"
                    : "bg-white/5 backdrop-blur-sm border-white/10"
                }`}>
                <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-3 py-1 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 rounded text-sm transition-colors"
                >
                    {showPreview ? "编辑" : "预览"}
                </button>

                <button
                    type="button"
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${isFocusMode
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300"
                            : "bg-white/10 text-gray-400 hover:bg-white/20"
                        }`}
                >
                    {isFocusMode ? "退出专注" : "专注模式"}
                </button>

                <div className="flex-1"></div>
                <span className="text-xs text-gray-500">支持 Markdown 语法</span>
            </div>

            {/* 编辑器区域 */}
            <motion.div
                layout
                className={`relative ${isFocusMode ? "max-w-4xl mx-auto h-[calc(100vh-100px)]" : ""}`}
            >
                {!showPreview ? (
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder || "在这里写下你的内容... (输入 / 唤起命令)"}
                        className={`w-full p-4 rounded-lg resize-none focus:outline-none transition-all
                            ${isFocusMode
                                ? "h-full bg-transparent text-gray-800 dark:text-gray-200 text-lg leading-loose border-none shadow-none"
                                : "h-[500px] bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder-gray-500 focus:border-pink-500/50 text-sm leading-relaxed"
                            }
                            font-mono`}
                    />
                ) : (
                    <div
                        className={`w-full p-4 rounded-lg overflow-auto
                            ${isFocusMode
                                ? "h-full bg-transparent text-gray-800 dark:text-gray-200 prose-lg"
                                : "min-h-[500px] bg-white/5 backdrop-blur-sm border border-white/10 text-white prose prose-invert prose-pink max-w-none"
                            }`}
                    >
                        <div dangerouslySetInnerHTML={{ __html: sanitizeMarkdownPreview(preview) }} />
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

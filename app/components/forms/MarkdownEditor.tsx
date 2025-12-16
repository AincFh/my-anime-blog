import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
    const [preview, setPreview] = useState("");
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        // 简单的 Markdown 预览（后续可以集成 marked）
        setPreview(value);
    }, [value]);

    return (
        <div className="w-full">
            {/* 编辑器工具栏 */}
            <div className="flex items-center gap-2 mb-2 p-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-3 py-1 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 rounded text-sm transition-colors"
                >
                    {showPreview ? "编辑" : "预览"}
                </button>
                <div className="flex-1"></div>
                <span className="text-xs text-gray-500">支持 Markdown 语法</span>
            </div>

            {/* 编辑器区域 */}
            <motion.div
                layout
                className="relative"
            >
                {!showPreview ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder || "在这里写下你的内容..."}
                        className="w-full h-[500px] p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg
                     text-white placeholder-gray-500 resize-none focus:outline-none focus:border-pink-500/50
                     font-mono text-sm leading-relaxed"
                    />
                ) : (
                    <div
                        className="w-full min-h-[500px] p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg
                     text-white prose prose-invert prose-pink max-w-none overflow-auto"
                    >
                        <div dangerouslySetInnerHTML={{ __html: preview.replace(/\n/g, '<br>') }} />
                    </div>
                )}
            </motion.div>
        </div>
    );
}

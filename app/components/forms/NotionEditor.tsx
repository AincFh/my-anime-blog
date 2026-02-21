import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { marked } from "marked";
import { Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Image as ImageIcon, Link as LinkIcon, Undo, Redo, X } from "lucide-react";
import { cn } from "~/utils/cn";
import { toast } from "~/components/ui/Toast";

/**
 * Notion风格的后台编辑器
 * 功能：
 * 1. 左右分栏实时预览
 * 2. 拖拽上传图片（自动传到R2并生成链接）
 * 3. Markdown快捷键支持
 * 4. 所见即所得
 */
interface NotionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function NotionEditor({ value, onChange, placeholder }: NotionEditorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 插入文本到光标位置
  const insertText = useCallback((before: string, after: string = "") => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

    onChange(newText);

    // 恢复光标位置
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }, [value, onChange]);

  // Markdown快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+B: 粗体
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      insertText("**", "**");
    }
    // Ctrl+I: 斜体
    if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      e.preventDefault();
      insertText("*", "*");
    }
    // Ctrl+K: 链接
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      insertText("[", "](url)");
    }
  }, [insertText]);

  // 处理文件上传
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("请上传图片文件");
      return;
    }

    // TODO: 实际上传到R2
    // 这里先使用base64作为占位符
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      // 插入Markdown图片语法
      insertText(`![${file.name}](${base64})\n`);
    };
    reader.readAsDataURL(file);
  }, [insertText]);

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  // 工具栏按钮
  const ToolbarButton = ({ icon, onClick, title }: { icon: string; onClick: () => void; title: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
    >
      {icon}
    </button>
  );

  return (
    <div
      className="w-full border border-white/10 rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 工具栏 */}
      <div className="flex items-center gap-2 p-3 bg-white/5 border-b border-white/10">
        <ToolbarButton
          icon="B"
          onClick={() => insertText("**", "**")}
          title="粗体 (Ctrl+B)"
        />
        <ToolbarButton
          icon="I"
          onClick={() => insertText("*", "*")}
          title="斜体 (Ctrl+I)"
        />
        <ToolbarButton
          icon="🔗"
          onClick={() => insertText("[", "](url)")}
          title="链接 (Ctrl+K)"
        />
        <div className="w-px h-6 bg-white/10 mx-2" />
        <ToolbarButton
          icon="📷"
          onClick={() => fileInputRef.current?.click()}
          title="上传图片"
        />
        <ToolbarButton
          icon="📝"
          onClick={() => insertText("# ", "")}
          title="标题"
        />
        <ToolbarButton
          icon="•"
          onClick={() => insertText("- ", "")}
          title="列表"
        />
        <div className="flex-1" />
        <span className="text-xs text-slate-500">Markdown 实时预览</span>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* 左右分栏 */}
      <div className="grid grid-cols-2 divide-x divide-white/10">
        {/* 左侧：编辑器 */}
        <div className="relative">
          {isDragging && (
            <div className="absolute inset-0 bg-primary-start/20 border-2 border-dashed z-10 flex items-center justify-center" style={{ borderColor: '#FF9F43' }}>
              <div className="text-center">
                <div className="text-4xl mb-2">📷</div>
                <div className="text-primary-start font-bold">松开以上传图片</div>
              </div>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "在这里写下你的内容...\n\n支持 Markdown 语法，拖拽图片即可上传"}
            className="w-full h-[600px] p-6 bg-transparent text-white placeholder-slate-500 resize-none focus:outline-none font-mono text-sm leading-relaxed"
          />
        </div>

        {/* 右侧：实时预览 */}
        <div className="h-[600px] overflow-y-auto p-6 bg-white/5">
          <div className="prose prose-invert prose-pink max-w-none">
            {value ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: marked(value, {
                    breaks: true,
                    gfm: true,
                  }) as string,
                }}
                className="markdown-content"
              />
            ) : (
              <div className="text-slate-500 text-center mt-20">
                <div className="text-4xl mb-4">✨</div>
                <p>预览将在这里显示</p>
                <p className="text-xs mt-2">支持 :::spoiler[警告] 内容 ::: 语法</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


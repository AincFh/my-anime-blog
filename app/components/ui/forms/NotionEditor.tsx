import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { renderMarkdown } from "~/utils/markdown";

/**
 * Notion风格的后台编辑器
 * 功能：
 * 1. 左右分栏实时预览（支持代码高亮）
 * 2. 拖拽上传图片（自动传到R2并生成链接）
 * 3. Markdown快捷键支持
 * 4. 字数统计
 * 5. 同步滚动
 */
interface NotionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSave?: () => void;
}

export function NotionEditor({ value, onChange, placeholder, onSave }: NotionEditorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncScroll, setSyncScroll] = useState(true);

  // 字数统计
  const wordStats = useMemo(() => {
    const chars = value.length;
    const chineseChars = (value.match(/[\u4e00-\u9fa5]/g) || []).length;
    const words = value.split(/\s+/).filter(Boolean).length;
    const readTime = Math.ceil((chineseChars + words) / 300); // 300字/分钟
    return { chars, chineseChars, words, readTime };
  }, [value]);

  // 渲染预览（使用增强的 renderMarkdown）
  const renderedContent = useMemo(() => {
    if (!value) return "";
    return renderMarkdown(value);
  }, [value]);

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
      const newPosition = start + before.length + selectedText.length;
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
    // Ctrl+S: 保存
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      onSave?.();
    }
    // Ctrl+`: 行内代码
    if ((e.ctrlKey || e.metaKey) && e.key === "`") {
      e.preventDefault();
      insertText("`", "`");
    }
    // Tab: 缩进
    if (e.key === "Tab") {
      e.preventDefault();
      insertText("  ");
    }
  }, [insertText, onSave]);

  // 处理文件上传
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      alert("请上传图片文件");
      return;
    }

    // 插入上传中占位符
    const placeholderId = `uploading-${Date.now()}`;
    insertText(`![上传中...](${placeholderId})`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json() as any;

      if (data.success && data.url) {
        // 替换占位符为真实链接
        if (textareaRef.current) {
          const newContent = textareaRef.current.value.replace(
            `![上传中...](${placeholderId})`,
            `![${file.name}](${data.url})`
          );
          onChange(newContent);
        }
      } else {
        alert("上传失败: " + (data.error || "未知错误"));
        // 移除占位符
        if (textareaRef.current) {
          const newContent = textareaRef.current.value.replace(
            `![上传中...](${placeholderId})`,
            ""
          );
          onChange(newContent);
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("上传出错");
      // 移除占位符
      if (textareaRef.current) {
        const newContent = textareaRef.current.value.replace(
          `![上传中...](${placeholderId})`,
          ""
        );
        onChange(newContent);
      }
    }
  }, [insertText, onChange, value]); // Added value to dependency as we read it via ref/onChange but better to be safe

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

  // 同步滚动
  const handleEditorScroll = useCallback(() => {
    if (!syncScroll || !textareaRef.current || !previewRef.current) return;

    const textarea = textareaRef.current;
    const preview = previewRef.current;
    const scrollRatio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight);
    preview.scrollTop = scrollRatio * (preview.scrollHeight - preview.clientHeight);
  }, [syncScroll]);

  // 工具栏按钮组件
  const ToolbarButton = ({ icon, onClick, title, active }: {
    icon: React.ReactNode;
    onClick: () => void;
    title: string;
    active?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded transition-colors text-sm
        ${active
          ? "bg-primary-start/20 text-primary-start"
          : "hover:bg-white/10 text-slate-400 hover:text-white"
        }`}
    >
      {icon}
    </button>
  );

  // 工具栏分隔线
  const Divider = () => <div className="w-px h-6 bg-white/10 mx-1" />;

  return (
    <div
      className="w-full border border-white/10 rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 工具栏 */}
      <div className="flex items-center gap-1 p-3 bg-white/5 border-b border-white/10 flex-wrap">
        {/* 标题 */}
        <ToolbarButton icon="H1" onClick={() => insertText("# ", "")} title="一级标题" />
        <ToolbarButton icon="H2" onClick={() => insertText("## ", "")} title="二级标题" />
        <ToolbarButton icon="H3" onClick={() => insertText("### ", "")} title="三级标题" />

        <Divider />

        {/* 格式 */}
        <ToolbarButton icon={<span className="font-bold">B</span>} onClick={() => insertText("**", "**")} title="粗体 (Ctrl+B)" />
        <ToolbarButton icon={<span className="italic">I</span>} onClick={() => insertText("*", "*")} title="斜体 (Ctrl+I)" />
        <ToolbarButton icon={<span className="line-through">S</span>} onClick={() => insertText("~~", "~~")} title="删除线" />
        <ToolbarButton icon="<>" onClick={() => insertText("`", "`")} title="行内代码 (Ctrl+`)" />

        <Divider />

        {/* 块元素 */}
        <ToolbarButton icon="🔗" onClick={() => insertText("[", "](url)")} title="链接 (Ctrl+K)" />
        <ToolbarButton icon="📷" onClick={() => fileInputRef.current?.click()} title="上传图片" />
        <ToolbarButton icon="❝" onClick={() => insertText("> ", "")} title="引用" />
        <ToolbarButton icon="•" onClick={() => insertText("- ", "")} title="无序列表" />
        <ToolbarButton icon="1." onClick={() => insertText("1. ", "")} title="有序列表" />
        <ToolbarButton icon="☑" onClick={() => insertText("- [ ] ", "")} title="任务列表" />

        <Divider />

        {/* 代码块 */}
        <ToolbarButton
          icon="{ }"
          onClick={() => insertText("```javascript\n", "\n```")}
          title="代码块"
        />
        <ToolbarButton
          icon="📊"
          onClick={() => insertText("| 标题1 | 标题2 |\n|-------|-------|\n| 内容1 | 内容2 |\n", "")}
          title="表格"
        />
        <ToolbarButton
          icon="⚠️"
          onClick={() => insertText(":::spoiler[剧透警告]\n", "\n:::")}
          title="剧透折叠"
        />

        <div className="flex-1" />

        {/* 同步滚动开关 */}
        <ToolbarButton
          icon="🔄"
          onClick={() => setSyncScroll(!syncScroll)}
          title={`同步滚动: ${syncScroll ? "开" : "关"}`}
          active={syncScroll}
        />

        {/* 字数统计 */}
        <div className="text-xs text-slate-500 ml-2 hidden sm:block">
          {wordStats.chars} 字符 · {wordStats.chineseChars} 汉字 · 约 {wordStats.readTime} 分钟
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-white/10">
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
            onScroll={handleEditorScroll}
            placeholder={placeholder || "在这里写下你的内容...\n\n支持 Markdown 语法\n\n快捷键:\n- Ctrl+B 粗体\n- Ctrl+I 斜体\n- Ctrl+K 链接\n- Ctrl+S 保存\n- Ctrl+` 行内代码\n- Tab 缩进"}
            className="w-full h-[600px] p-6 bg-transparent text-white placeholder-slate-500 resize-none focus:outline-none font-mono text-sm leading-relaxed"
          />
        </div>

        {/* 右侧：实时预览 */}
        <div
          ref={previewRef}
          className="h-[600px] overflow-y-auto p-6 bg-white/5 hidden md:block"
        >
          <div className="prose prose-invert prose-pink max-w-none">
            {value ? (
              <div
                dangerouslySetInnerHTML={{ __html: renderedContent }}
                className="markdown-content"
              />
            ) : (
              <div className="text-slate-500 text-center mt-20">
                <div className="text-4xl mb-4">✨</div>
                <p>预览将在这里显示</p>
                <p className="text-xs mt-2">支持 :::spoiler[警告] 内容 ::: 语法</p>
                <p className="text-xs mt-1">支持代码语法高亮</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 移动端状态栏 */}
      <div className="md:hidden flex items-center justify-between p-2 bg-white/5 border-t border-white/10 text-xs text-slate-500">
        <span>{wordStats.chars} 字符 · {wordStats.chineseChars} 汉字</span>
        <span>约 {wordStats.readTime} 分钟阅读</span>
      </div>
    </div>
  );
}



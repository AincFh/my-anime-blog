import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

/**
 * 复制文本小尾巴
 * 功能：复制文章内容时自动追加出处
 */
export function CopyAttribution() {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const selectedText = selection.toString().trim();
      if (!selectedText || selectedText.length < 10) return; // 太短的文本不处理

      // 检查是否在文章内容区域
      const articleContent = document.querySelector(".prose, .markdown-content, article");
      if (!articleContent || !articleContent.contains(selection.anchorNode as Node)) {
        return;
      }

      // 获取当前页面信息
      const pageTitle = document.title;
      const pageUrl = window.location.href;

      // 追加出处
      const attribution = `\n\n—— 摘自 ${pageTitle} ${pageUrl}`;
      const newText = selectedText + attribution;

      e.clipboardData?.setData("text/plain", newText);
      e.preventDefault();

      // 显示Toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };

    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, []);

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="flex items-center gap-2 text-gray-800">
            <span>✓</span>
            <span className="font-medium">复制成功！转载请记得带上出处哦 ( •̀ ω •́ )y</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


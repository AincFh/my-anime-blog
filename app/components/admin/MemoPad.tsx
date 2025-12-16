import { motion } from "framer-motion";
import { useState, useEffect } from "react";

/**
 * 灵感便签
 * 功能：便利贴风格的快速记录，存储在LocalStorage
 */
export function MemoPad() {
  const [memo, setMemo] = useState("");

  // 从LocalStorage加载
  useEffect(() => {
    const saved = localStorage.getItem("admin_memo");
    if (saved) {
      setMemo(saved);
    }
  }, []);

  // 保存到LocalStorage
  const handleSave = () => {
    localStorage.setItem("admin_memo", memo);
    alert("已保存！");
  };

  // Ctrl+Enter快速保存
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 shadow-sm border-2 border-yellow-200"
      initial={{ opacity: 0, rotate: -2 }}
      animate={{ opacity: 1, rotate: 0 }}
      style={{
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          📝 灵感便签
        </h2>
        <motion.button
          onClick={handleSave}
          className="px-4 py-2 bg-yellow-400 text-yellow-900 text-sm font-medium rounded-lg hover:bg-yellow-500 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          保存
        </motion.button>
      </div>
      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="随手记下你的想法...&#10;支持 Ctrl+Enter 快速保存"
        className="w-full h-48 bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-400 font-serif"
        style={{ fontFamily: "'Noto Serif SC', serif" }}
      />
      <p className="text-xs text-gray-500 mt-2">
        💡 提示：按 Ctrl+Enter 快速保存
      </p>
    </motion.div>
  );
}


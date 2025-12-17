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
      className="glass-card-deep p-6 tech-border relative overflow-hidden group"
      initial={{ opacity: 0, rotate: -2 }}
      animate={{ opacity: 1, rotate: 0 }}
    >
      {/* 背景装饰：全息网格 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

      {/* 顶部发光条 */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500/50 via-orange-500/50 to-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 font-orbitron">
          <span className="text-yellow-400">📝</span> 灵感便签
        </h2>
        <motion.button
          onClick={handleSave}
          className="px-4 py-1.5 bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 text-sm font-medium rounded hover:bg-yellow-500/30 transition-all shadow-[0_0_10px_rgba(234,179,8,0.2)]"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          SAVE
        </motion.button>
      </div>
      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="随手记下你的想法...&#10;支持 Ctrl+Enter 快速保存"
        className="w-full h-48 bg-black/20 border border-white/5 rounded-lg p-4 outline-none resize-none text-white/90 placeholder-white/30 font-mono focus:border-yellow-500/30 focus:bg-black/30 transition-all relative z-10"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      />
      <p className="text-xs text-white/40 mt-2 font-mono relative z-10">
        <span className="text-yellow-500/70">TIP:</span> Ctrl+Enter to save
      </p>
    </motion.div>
  );
}

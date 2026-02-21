import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { toast } from "~/components/ui/Toast";

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
    toast.success("备忘录已保存！");
  };

  // Ctrl+Enter快速保存
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col relative z-10 min-h-[300px]">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2 text-yellow-400">
          <span>📝</span>
          <span className="text-xs font-mono uppercase tracking-wider text-white/40">灵感便签</span>
        </div>
        <motion.button
          onClick={handleSave}
          className="px-4 py-1.5 bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 text-xs font-bold rounded hover:bg-yellow-500/30 transition-all shadow-[0_0_10px_rgba(234,179,8,0.2)]"
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
    </div>
  );
}

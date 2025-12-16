import { useState } from "react";
import { motion } from "framer-motion";

/**
 * 防剧透组件
 * 功能：黑幕/模糊遮罩，点击或悬停后显示内容
 */
interface SpoilerProps {
  children: React.ReactNode;
  warning?: string; // 自定义警告文字
  variant?: "black" | "blur"; // 遮罩样式
}

export function Spoiler({ children, warning = "剧透警告", variant = "black" }: SpoilerProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="relative inline-block my-2">
      {!isRevealed ? (
        <motion.div
          className={`cursor-pointer select-none ${
            variant === "black"
              ? "bg-black text-black px-3 py-1 rounded"
              : "bg-gray-800/80 backdrop-blur-md text-transparent px-3 py-1 rounded"
          }`}
          onClick={() => setIsRevealed(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title="点击显示内容"
        >
          <span className="text-white text-sm font-medium">{warning}</span>
          <span className="text-white/50 text-xs ml-2">👆 点击查看</span>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-yellow-50 border-l-4 border-yellow-400 px-3 py-2 rounded"
        >
          <span className="text-xs text-yellow-700 font-medium mb-1 block">⚠️ {warning}</span>
          <div className="text-gray-800">{children}</div>
        </motion.div>
      )}
    </div>
  );
}


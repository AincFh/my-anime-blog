import { motion } from "framer-motion";
import { Form } from "react-router";
import { useState } from "react";

/**
 * 番剧进度一键同步
 * 功能：快捷按钮，点击一下当前在看的番剧进度自动+1
 */
interface QuickSyncButtonProps {
  animeId: number;
  currentProgress: string; // 如 "12/24"
  onSync?: () => void;
}

export function QuickSyncButton({ animeId, currentProgress, onSync }: QuickSyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  // 解析进度字符串 "12/24" -> { current: 12, total: 24 }
  const parseProgress = (progress: string) => {
    const match = progress.match(/(\d+)\/(\d+)/);
    if (match) {
      return {
        current: parseInt(match[1]),
        total: parseInt(match[2]),
      };
    }
    return { current: 0, total: 0 };
  };

  const { current, total } = parseProgress(currentProgress);
  const newProgress = current < total ? `${current + 1}/${total}` : currentProgress;

  return (
    <Form method="post" className="inline">
      <input type="hidden" name="_action" value="update_progress" />
      <input type="hidden" name="id" value={animeId} />
      <input type="hidden" name="progress" value={newProgress} />
      <motion.button
        type="submit"
        onClick={() => {
          setIsSyncing(true);
          if (onSync) onSync();
          setTimeout(() => setIsSyncing(false), 1000);
        }}
        disabled={current >= total || isSyncing}
        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: current < total ? 1.05 : 1 }}
        whileTap={{ scale: current < total ? 0.95 : 1 }}
        animate={isSyncing ? { scale: [1, 1.1, 1] } : {}}
      >
        {isSyncing ? (
          <span className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
            >
              ⏳
            </motion.span>
            同步中...
          </span>
        ) : current >= total ? (
          <span>✅ 已看完</span>
        ) : (
          <span className="flex items-center gap-2">
            <span>📺</span>
            <span>今天看了一集</span>
            <span className="text-xs opacity-75">({current + 1}/{total})</span>
          </span>
        )}
      </motion.button>
    </Form>
  );
}


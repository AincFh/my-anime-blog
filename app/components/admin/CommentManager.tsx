import { motion, AnimatePresence } from "framer-motion";
import { useFetcher } from "react-router";
import { useState, useEffect } from "react";

interface Comment {
  id: number;
  author: string;
  content: string;
  created_at: number;
  status: string;
  is_danmaku: boolean;
}

interface CommentManagerProps {
  initialComments: Comment[];
}

/**
 * 互动/弹幕管理
 * 功能：最新评论流、待审核弹幕
 */
export function CommentManager({ initialComments }: CommentManagerProps) {
  const fetcher = useFetcher();
  const [comments, setComments] = useState<Comment[]>(initialComments);

  // 当 props 更新时同步状态
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // 乐观 UI 更新
  const handleAction = (id: number, intent: "approve" | "delete") => {
    // 立即从列表中移除（因为无论是批准还是删除，都不再是"待审核"状态）
    setComments((prev) => prev.filter((c) => c.id !== id));

    // 提交请求
    fetcher.submit(
      { intent, commentId: id.toString() },
      { method: "post", action: "/api/admin/comments" }
    );
  };

  const unreadCount = comments.length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500/80 text-white text-xs font-bold rounded border border-red-400/50 shadow-[0_0_10px_rgba(239,68,68,0.4)]">
              {unreadCount}条待审
            </span>
          )}
        </h2>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {comments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-white/30 text-sm"
            >
              暂无待审核留言
            </motion.div>
          ) : (
            comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                layout
                className="p-4 rounded-xl border bg-yellow-500/10 border-yellow-500/30"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* 聊天气泡样式 */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg border border-white/20 flex-shrink-0">
                    {comment.author[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white/90 truncate">{comment.author}</span>
                      {comment.is_danmaku && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30 flex-shrink-0">
                          弹幕
                        </span>
                      )}
                      <span className="text-xs text-white/40 font-mono flex-shrink-0 ml-auto">
                        {new Date(comment.created_at * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 mb-3 break-words">{comment.content}</p>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => handleAction(comment.id, "approve")}
                        className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/50 text-xs rounded hover:bg-green-500/30 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        批准
                      </motion.button>
                      <motion.button
                        onClick={() => handleAction(comment.id, "delete")}
                        className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/50 text-xs rounded hover:bg-red-500/30 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        删除
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { useState } from "react";

/**
 * 互动/弹幕管理
 * 功能：最新评论流、待审核弹幕
 */
export function CommentManager() {
  const [comments] = useState([
    {
      id: 1,
      author: "路人A",
      content: "大佬求友链！",
      time: "2小时前",
      status: "pending",
      isDanmaku: false,
    },
    {
      id: 2,
      author: "二次元爱好者",
      content: "这是什么番？",
      time: "5小时前",
      status: "approved",
      isDanmaku: false,
    },
    {
      id: 3,
      author: "匿名用户",
      content: "好喜欢这个设计！",
      time: "1天前",
      status: "approved",
      isDanmaku: true,
    },
  ]);

  const handleAction = (id: number, action: "approve" | "delete" | "reply") => {
    console.log(`执行操作: ${action} on comment ${id}`);
    // TODO: 实现实际的API调用
  };

  const unreadCount = comments.filter((c) => c.status === "pending").length;

  return (
    <div className="glass-card-deep p-6 tech-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 font-orbitron">
          <span className="text-violet-400">💌</span> 最新评论
        </h2>
        {unreadCount > 0 && (
          <span className="px-3 py-1 bg-red-500/80 text-white text-xs font-bold rounded border border-red-400/50 shadow-[0_0_10px_rgba(239,68,68,0.4)]">
            {unreadCount}条未读
          </span>
        )}
      </div>

      <div className="space-y-3">
        {comments.map((comment, index) => (
          <motion.div
            key={comment.id}
            className={`p-4 rounded-xl border ${comment.status === "pending"
                ? "bg-yellow-500/10 border-yellow-500/30"
                : "bg-white/5 border-white/10"
              }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* 聊天气泡样式 */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg border border-white/20">
                {comment.author[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white/90">{comment.author}</span>
                  {comment.isDanmaku && (
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30">
                      弹幕
                    </span>
                  )}
                  <span className="text-xs text-white/40 font-mono">{comment.time}</span>
                </div>
                <p className="text-sm text-white/80 mb-3">{comment.content}</p>
                <div className="flex gap-2">
                  {comment.status === "pending" && (
                    <>
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
                    </>
                  )}
                  <motion.button
                    onClick={() => handleAction(comment.id, "reply")}
                    className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/50 text-xs rounded hover:bg-blue-500/30 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    回复
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

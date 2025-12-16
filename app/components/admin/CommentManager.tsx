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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          💌 最新评论
        </h2>
        {unreadCount > 0 && (
          <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
            {unreadCount}条未读
          </span>
        )}
      </div>

      <div className="space-y-3">
        {comments.map((comment, index) => (
          <motion.div
            key={comment.id}
            className={`p-4 rounded-xl border-2 ${
              comment.status === "pending"
                ? "bg-yellow-50 border-yellow-200"
                : "bg-gray-50 border-gray-200"
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* 聊天气泡样式 */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-white font-bold text-sm">
                {comment.author[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-800">{comment.author}</span>
                  {comment.isDanmaku && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                      弹幕
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{comment.time}</span>
                </div>
                <p className="text-sm text-gray-700 mb-3">{comment.content}</p>
                <div className="flex gap-2">
                  {comment.status === "pending" && (
                    <>
                      <motion.button
                        onClick={() => handleAction(comment.id, "approve")}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        批准
                      </motion.button>
                      <motion.button
                        onClick={() => handleAction(comment.id, "delete")}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        删除
                      </motion.button>
                    </>
                  )}
                  <motion.button
                    onClick={() => handleAction(comment.id, "reply")}
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
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


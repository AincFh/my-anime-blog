import { motion } from "framer-motion";
import { useState } from "react";
import type { Route } from "./+types/admin.comments";
import { redirect } from "react-router";
import { getSessionId } from "~/utils/auth";

export async function loader({ request, context }: Route.LoaderArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/admin/login");
  }

  const { anime_db } = context.cloudflare.env;

  try {
    const { results } = await anime_db
      .prepare(`
        SELECT c.id, c.content, c.status, c.is_spam as isSpam, c.created_at,
               c.guest_name as author, a.title as article
        FROM comments c
        LEFT JOIN articles a ON c.article_id = a.id
        ORDER BY c.created_at DESC
        LIMIT 50
      `)
      .all();

    const comments = (results || []).map((comment: any) => {
      const createdAt = new Date(comment.created_at * 1000);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);

      let time = '';
      if (diffMins < 60) {
        time = `${diffMins}分钟前`;
      } else if (diffHours < 24) {
        time = `${diffHours}小时前`;
      } else {
        time = createdAt.toISOString().split('T')[0];
      }

      return {
        ...comment,
        author: comment.author || '匿名',
        article: comment.article || '未知文章',
        time,
        isSpam: Boolean(comment.isSpam),
      };
    });

    return { comments };
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return { comments: [] };
  }
}

export default function CommentsManager({ loaderData }: Route.ComponentProps) {
  const { comments } = loaderData;
  const [filter, setFilter] = useState<"all" | "pending" | "spam">("all");

  const filteredComments = comments.filter((c) => {
    if (filter === "pending") return c.status === "pending";
    if (filter === "spam") return c.isSpam;
    return true;
  });

  const pendingCount = comments.filter((c) => c.status === "pending").length;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-8">羁绊通信</h1>

        {/* 筛选标签 */}
        <div className="flex gap-3 mb-6">
          {[
            { key: "all", label: "全部" },
            { key: "pending", label: `待审核 (${pendingCount})` },
            { key: "spam", label: "垃圾箱" },
          ].map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${filter === tab.key
                  ? "bg-pink-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* 评论列表 - 聊天气泡流 */}
        <div className="space-y-4">
          {filteredComments.map((comment, index) => (
            <motion.div
              key={comment.id}
              className={`p-4 rounded-xl border-2 ${comment.status === "pending"
                  ? "bg-yellow-50 border-yellow-200"
                  : comment.isSpam
                    ? "bg-red-50 border-red-200"
                    : "bg-white border-gray-200"
                }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-white font-bold text-sm">
                  {comment.author[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">{comment.author}</span>
                    <span className="text-xs text-gray-500 font-mono">({comment.time})</span>
                    <span className="text-xs text-gray-500">来自文章《{comment.article}》</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                    <p className="text-sm text-gray-700">💬 {comment.content}</p>
                  </div>
                  <div className="flex gap-2">
                    {comment.status === "pending" && !comment.isSpam && (
                      <>
                        <motion.button
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          ✅ 批准
                        </motion.button>
                        <motion.button
                          className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          ↩️ 回复
                        </motion.button>
                      </>
                    )}
                    {comment.isSpam && (
                      <>
                        <motion.button
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          🚫 永久封禁 IP
                        </motion.button>
                        <motion.button
                          className="px-3 py-1 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          🗑️ 删除
                        </motion.button>
                      </>
                    )}
                    {!comment.isSpam && comment.status === "approved" && (
                      <motion.button
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ↩️ 回复
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}


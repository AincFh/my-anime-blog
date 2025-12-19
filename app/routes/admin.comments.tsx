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

  const filteredComments = comments.filter((c: any) => {
    if (filter === "pending") return c.status === "pending";
    if (filter === "spam") return c.isSpam;
    return true;
  });

  const pendingCount = comments.filter((c: any) => c.status === "pending").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Comments</h1>
          <p className="text-gray-500 text-sm mt-1">Manage community interactions.</p>
        </div>
      </div>

      {/* iOS Segmented Control */}
      <div className="bg-gray-100/80 p-1 rounded-lg inline-flex mb-6">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: `Pending (${pendingCount})` },
          { key: "spam", label: "Spam" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Comment List */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">
            No comments found in this filter.
          </div>
        ) : (
          filteredComments.map((comment: any, index: number) => (
            <motion.div
              key={comment.id}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0 ${comment.isSpam ? "bg-red-400" : "bg-blue-500"
                }`}>
                {comment.author[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{comment.author}</span>
                    <span className="text-xs text-gray-400">• {comment.time}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${comment.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      comment.isSpam ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}>
                    {comment.isSpam ? "SPAM" : comment.status}
                  </span>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-3 break-words">
                  {comment.content}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 truncate max-w-[200px]">
                    on <span className="font-medium text-gray-500">{comment.article}</span>
                  </span>

                  <div className="flex gap-2">
                    {comment.status === "pending" && !comment.isSpam && (
                      <>
                        <button className="text-xs font-medium text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-full transition-colors">
                          Approve
                        </button>
                        <button className="text-xs font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors">
                          Spam
                        </button>
                      </>
                    )}
                    <button className="text-xs font-medium text-gray-400 hover:text-gray-600 px-2 py-1.5 transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}


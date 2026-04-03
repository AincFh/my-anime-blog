import { useFetcher } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare, User } from "lucide-react";

interface Comment {
    id: number;
    author: string;
    content: string;
    created_at: number;
    is_danmaku: boolean;
    avatar_style?: string;
}

interface CommentsSectionProps {
    articleId: number | string;
    comments: Comment[];
}

export function CommentsSection({ articleId, comments: initialComments }: CommentsSectionProps) {
    const fetcher = useFetcher();
    const formRef = useRef<HTMLFormElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isSuccess = fetcher.data?.success;
    const error = fetcher.data?.error;

    useEffect(() => {
        if (fetcher.state === "submitting") {
            setIsSubmitting(true);
        } else {
            setIsSubmitting(false);
            if (isSuccess && formRef.current) {
                formRef.current.reset();
            }
        }
    }, [fetcher.state, isSuccess]);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div>
            {/* 评论表单 */}
            <div className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-slate-100 dark:border-white/10">
                <fetcher.Form
                    method="post"
                    action="/api/comments"
                    ref={formRef}
                    className="space-y-4"
                >
                    <input type="hidden" name="article_id" value={articleId} />

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    name="author"
                                    required
                                    placeholder="昵称 *"
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="邮箱（可选）"
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                            <textarea
                                name="content"
                                required
                                rows={3}
                                placeholder="写下你的想法..."
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                                    isSubmitting
                                    ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg active:scale-95"
                                }`}
                            >
                                {isSubmitting ? "发送中..." : <><Send size={14} /> 发布</>}
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isSuccess && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-green-600 dark:text-green-400 text-xs flex items-center gap-1"
                            >
                                评论已提交，等待审核
                            </motion.div>
                        )}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-red-500 text-xs"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </fetcher.Form>
            </div>

            {/* 评论列表 */}
            <div className="space-y-3">
                {initialComments.length === 0 ? (
                    <div className="text-center py-12 bg-white/40 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-white/5">
                        <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 dark:text-slate-500 text-sm">还没有评论，来坐沙发吧！</p>
                    </div>
                ) : (
                    initialComments.map((comment, index) => (
                        <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group flex gap-4 p-4 bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-colors"
                        >
                            {/* 头像 */}
                            <div className="flex-shrink-0 mt-0.5">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/80 to-purple-500/80 flex items-center justify-center text-white font-bold text-sm shadow-sm border border-white/20">
                                    {comment.author[0]?.toUpperCase() || <User className="w-4 h-4" />}
                                </div>
                            </div>

                            {/* 内容 */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{comment.author}</span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500">
                                        {formatDate(comment.created_at)}
                                    </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{comment.content}</p>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}


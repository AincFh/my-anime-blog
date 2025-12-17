import { useFetcher } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { GlassCard } from "~/components/ui/layout/GlassCard";
import { Send, MessageSquare } from "lucide-react";

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

    // 乐观UI更新：提交后立即显示（虽然实际需要审核，但可以给用户反馈）
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

    return (
        <div className="mt-12">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageSquare size={20} className="text-primary-start" />
                评论区
                <span className="text-sm text-slate-400 font-normal ml-2">
                    ({initialComments.length})
                </span>
            </h3>

            {/* 评论表单 - 移至顶部并紧凑化 */}
            <GlassCard className="p-6 mb-8 border-l-4 border-l-primary-start">
                <fetcher.Form
                    method="post"
                    action="/api/comments"
                    ref={formRef}
                    className="space-y-4"
                >
                    <input type="hidden" name="article_id" value={articleId} />

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    name="author"
                                    required
                                    placeholder="昵称 *"
                                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-start transition-colors"
                                />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="邮箱 (可选)"
                                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-start transition-colors"
                                />
                            </div>
                            <textarea
                                name="content"
                                required
                                rows={3}
                                placeholder="发表你的看法..."
                                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-start transition-colors resize-none"
                            />
                        </div>

                        <div className="flex flex-col justify-end">
                            <motion.button
                                type="submit"
                                disabled={isSubmitting}
                                className={`h-10 px-6 rounded-lg font-medium text-white text-sm transition-all flex items-center justify-center gap-2 ${isSubmitting
                                    ? "bg-slate-600 cursor-not-allowed"
                                    : "bg-gradient-to-r from-primary-start to-primary-end hover:shadow-lg hover:shadow-primary-start/20"
                                    }`}
                                whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                            >
                                {isSubmitting ? "..." : <><Send size={14} /> 发送</>}
                            </motion.button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isSuccess && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-green-400 text-xs flex items-center gap-1"
                            >
                                ✅ 评论已提交，等待审核。
                            </motion.div>
                        )}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-red-400 text-xs"
                            >
                                ❌ {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </fetcher.Form>
            </GlassCard>

            {/* 评论列表 */}
            <div className="space-y-4">
                {initialComments.length === 0 ? (
                    <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10 border-dashed">
                        <p className="text-slate-500 text-sm">暂无评论，来坐沙发！</p>
                    </div>
                ) : (
                    initialComments.map((comment, index) => (
                        <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className="group flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                {/* 头像 */}
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white font-bold text-sm shadow-inner border border-white/10">
                                        {comment.author[0].toUpperCase()}
                                    </div>
                                </div>

                                {/* 内容 */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-slate-200 text-sm">{comment.author}</span>
                                        <span className="text-xs text-slate-500">
                                            {new Date(comment.created_at * 1000).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-slate-300 text-sm leading-relaxed">{comment.content}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

import { useFetcher } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { onComment } from "~/components/ui/system/AchievementSystem";

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
                onComment();
            }
        }
    }, [fetcher.state, isSuccess]);

    return (
        <div className="mt-12 py-8 px-6 rounded-3xl bg-slate-100/50 dark:bg-[rgba(37,40,54,0.85)] backdrop-blur-xl border border-slate-200/50 dark:border-white/5">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <MessageSquare size={20} className="text-primary-start" />
                最新评论
                <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-secondary)' }}>
                    ({initialComments.length})
                </span>
            </h3>

            {/* 评论表单 */}
            <div className="mb-8 p-6 rounded-2xl bg-white/80 dark:bg-[rgba(46,50,68,0.90)] backdrop-blur-xl border border-slate-200/50 dark:border-white/5">
                <fetcher.Form
                    method="post"
                    action="/api/comments"
                    ref={formRef}
                    className="space-y-4"
                >
                    <input type="hidden" name="article_id" value={articleId} />

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    name="author"
                                    required
                                    placeholder="昵称 *"
                                    className="w-full px-4 py-3 bg-white dark:bg-[rgba(37,40,54,0.85)] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary-start transition-colors"
                                    style={{ color: 'var(--text-primary)' }}
                                />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="邮箱 (可选)"
                                    className="w-full px-4 py-3 bg-white dark:bg-[rgba(37,40,54,0.85)] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary-start transition-colors"
                                    style={{ color: 'var(--text-primary)' }}
                                />
                            </div>
                            <textarea
                                name="content"
                                required
                                rows={3}
                                placeholder="发表你的看法..."
                                className="w-full px-4 py-3 bg-white dark:bg-[rgba(37,40,54,0.85)] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary-start transition-colors resize-none"
                                style={{ color: 'var(--text-primary)' }}
                            />
                        </div>

                        <div className="flex flex-col justify-end">
                            <motion.button
                                type="submit"
                                disabled={isSubmitting}
                                className={`h-11 px-6 rounded-xl font-medium text-white text-sm transition-all flex items-center justify-center gap-2 ${isSubmitting
                                    ? "bg-slate-400 cursor-not-allowed"
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
                                评论已提交，等待审核
                            </motion.div>
                        )}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-red-400 text-xs"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </fetcher.Form>
            </div>

            {/* 评论列表 */}
            <div className="space-y-4 mt-8">
                {initialComments.length === 0 ? (
                    <div className="text-center py-8 rounded-xl border border-dashed" style={{ borderColor: 'var(--glass-border)' }}>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>暂无评论，来坐沙发！</p>
                    </div>
                ) : (
                    initialComments.map((comment, index) => (
                        <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className="group flex gap-4 p-4 rounded-xl transition-colors" style={{ backgroundColor: 'var(--glass-bg)' }}>
                                {/* 头像 */}
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-start to-primary-end flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                        {comment.author[0].toUpperCase()}
                                    </div>
                                </div>

                                {/* 内容 */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{comment.author}</span>
                                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                            {new Date(comment.created_at * 1000).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{comment.content}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

/**
 * 文章详情页
 */

import { Link, useLoaderData } from "react-router";
import { motion } from "framer-motion";
import { Calendar, Eye, Heart, ArrowLeft, Share2, Tag, Clock } from "lucide-react";
import type { Route } from "./+types/articles.$slug";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import { getCategoryColor } from "~/utils/categoryColor";
import { toast } from "~/components/ui/Toast";
import { CommentsSection } from "~/components/ui/interactive/CommentsSection";

interface Article {
    id: number;
    slug: string;
    title: string;
    content: string;
    category: string;
    cover_image: string | null;
    tags: string | null;
    views: number;
    likes: number;
    created_at: number;
    updated_at: number | null;
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
    const { getDB } = await import("~/utils/db");
    const db = getDB(context);
    const { slug } = params;

    // 获取文章
    const article = await db
        .prepare(`
            SELECT * FROM articles 
            WHERE slug = ? AND (status = 'published' OR status IS NULL)
        `)
        .bind(slug)
        .first() as Article | null;

    if (!article) {
        throw new Response("文章不存在", { status: 404 });
    }

    // 增加阅读量及附属功能务必使用 try-catch 以防阻塞主文章加载
    try {
        await db
            .prepare(`UPDATE articles SET views = views + 1 WHERE id = ?`)
            .bind(article.id)
            .run();

        // 更新任务进度：阅读 (仅对登录用户)
        const { getSessionToken, verifySession } = await import('~/services/auth.server');
        const { updateMissionProgress } = await import('~/services/membership/mission.server');
        const token = getSessionToken(request);
        if (token) {
            const { valid, user } = await verifySession(token, db);
            if (valid && user) {
                await updateMissionProgress(db, user.id, 'article_read');
            }
        }
    } catch (err) {
        console.error("Non-fatal error updating views or mission:", err);
    }

    // 获取相关文章
    let relatedArticles = { results: [] };
    try {
        relatedArticles = (await db
            .prepare(`
                SELECT id, slug, title, cover_image, category, created_at
                FROM articles 
                WHERE category = ? AND id != ? AND (status = 'published' OR status IS NULL)
                ORDER BY created_at DESC
                LIMIT 3
            `)
            .bind(article.category, article.id)
            .all()) as any;
    } catch (err) {
        console.error("Failed to fetch related articles:", err);
    }
    
    // 获取评论
    let comments = { results: [] };
    try {
        comments = (await db
            .prepare(`
                SELECT id, author, content, created_at, is_danmaku, avatar_style
                FROM comments
                WHERE article_id = ? AND status = 'approved'
                ORDER BY created_at DESC
            `)
            .bind(article.id)
            .all()) as any;
    } catch (err) {
        console.error("Failed to fetch comments for article:", err);
    }

    return {
        article,
        relatedArticles: relatedArticles.results || [],
        comments: comments.results || [],
    };
}

export default function ArticleDetailPage() {
    const { article, relatedArticles, comments } = useLoaderData<typeof loader>();

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const estimateReadTime = (content: string) => {
        const words = content.length;
        const minutes = Math.ceil(words / 500); // 假设每分钟阅读500字
        return `${minutes} 分钟`;
    };

    const parseTags = (tagsJson: string | null): string[] => {
        if (!tagsJson) return [];
        try {
            return JSON.parse(tagsJson);
        } catch {
            return [];
        }
    };

    const tags = parseTags(article.tags);

    // const getCategoryColor = ... (removed local function)

    return (
        <div className="min-h-screen pt-safe md:pt-16 pb-20 w-full px-5 sm:px-8">
            <div className="max-w-3xl mx-auto">
                {/* 极简返回栏 */}
                <Link
                    to="/articles"
                    className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-10 md:mb-16"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Articles
                </Link>

                {/* 沉浸感头部 */}
                <motion.header
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-10 md:mb-14"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-[11px] font-bold uppercase tracking-widest rounded-full">
                            {article.category || 'Uncategorized'}
                        </span>
                        <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {estimateReadTime(article.content || '')} read
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-sans font-black text-slate-900 dark:text-white mb-6 leading-tight md:leading-[1.1] tracking-tight text-pretty">
                        {article.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-6 border-t border-slate-100 dark:border-white/5 text-[14px] text-slate-500 dark:text-slate-400 font-medium">
                        <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 opacity-70" />
                            {formatDate(article.created_at)}
                        </span>
                        <span className="flex items-center gap-2">
                            <Eye className="w-4 h-4 opacity-70" />
                            {article.views + 1} Views
                        </span>
                        <span className="flex items-center gap-2">
                            <Heart className="w-4 h-4 opacity-70" />
                            {article.likes || 0} Likes
                        </span>
                    </div>
                </motion.header>

                {/* 无界震撼巨幕头图 */}
                {article.cover_image && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="mb-12 md:mb-16 -mx-5 sm:mx-0 sm:rounded-[32px] overflow-hidden bg-slate-100 dark:bg-slate-900"
                    >
                        <OptimizedImage
                            src={article.cover_image}
                            alt={article.title}
                            aspectRatio="video"
                            className="w-full h-auto object-cover"
                        />
                    </motion.div>
                )}

                {/* 核心阅读区无边框流 (剥离动画避免字体发虚模糊) */}
                <article className="mb-16 md:mb-24">
                    <div
                        className="prose prose-slate md:prose-xl max-w-none dark:prose-invert antialiased tracking-wide
                            prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-white
                            prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-3xl
                            prose-h3:text-2xl
                            prose-p:text-slate-700 dark:prose-p:text-slate-200 prose-p:leading-relaxed prose-p:mb-8 font-medium
                            prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
                            prose-code:bg-slate-100 dark:prose-code:bg-slate-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:text-[0.9em] prose-code:font-medium
                            prose-pre:bg-slate-900 dark:prose-pre:bg-[#0A0A0A] prose-pre:border prose-pre:border-slate-800 dark:prose-pre:border-white/5 prose-pre:rounded-2xl prose-pre:shadow-2xl
                            prose-img:rounded-[24px] prose-img:shadow-xl prose-img:my-10
                            prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-white/5 prose-blockquote:rounded-r-2xl prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:not-italic"
                        dangerouslySetInnerHTML={{
                            __html: article.content?.replace(/\n/g, '<br>') || ''
                        }}
                    />
                </article>

                {/* 底部交互组 */}
                <div className="pt-8 border-t border-slate-100 dark:border-white/5 mb-16 md:mb-24">
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8">
                            {tags.map((tag, i) => (
                                <span
                                    key={i}
                                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-[#1A1A1A] dark:hover:bg-[#222] text-slate-600 dark:text-slate-300 rounded-full text-[13px] font-bold transition-colors cursor-pointer"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                toast.success('链接已复制到剪贴板！');
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-black rounded-full text-[15px] font-bold hover:scale-[1.02] transition-transform active:scale-[0.98]"
                        >
                            <Share2 className="w-4 h-4" />
                            Share Article
                        </button>
                    </div>
                </div>

                {/* 相关阅读矩阵 */}
                {relatedArticles.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mb-16 md:mb-24 pt-12 border-t border-slate-100 dark:border-white/5"
                    >
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-8">
                            Read Next
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {relatedArticles.map((related: any) => (
                                <Link
                                    key={related.id}
                                    to={`/articles/${related.slug}`}
                                    className="block group"
                                >
                                    <div className="aspect-[4/3] rounded-[24px] bg-slate-100 dark:bg-slate-800 mb-4 overflow-hidden border border-slate-200/50 dark:border-white/5">
                                        {related.cover_image ? (
                                            <OptimizedImage
                                                src={related.cover_image}
                                                alt={related.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                                                <span className="text-3xl opacity-50">📰</span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-amber-500 transition-colors">
                                        {related.title}
                                    </h3>
                                </Link>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* 评论区隔离与净化 */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="pt-12 border-t border-slate-100 dark:border-white/5">
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-8">
                            Discussions
                        </h2>
                        <CommentsSection articleId={article.id} comments={comments as any} />
                    </div>
                </motion.section>
            </div>
        </div>
    );
}

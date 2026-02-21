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

export async function loader({ params, context }: Route.LoaderArgs) {
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

    // 增加阅读量
    await db
        .prepare(`UPDATE articles SET views = views + 1 WHERE id = ?`)
        .bind(article.id)
        .run();

    // 获取相关文章
    const relatedArticles = await db
        .prepare(`
            SELECT id, slug, title, cover_image, category, created_at
            FROM articles 
            WHERE category = ? AND id != ? AND (status = 'published' OR status IS NULL)
            ORDER BY created_at DESC
            LIMIT 3
        `)
        .bind(article.category, article.id)
        .all();

    return {
        article,
        relatedArticles: relatedArticles.results || [],
    };
}

export default function ArticleDetailPage() {
    const { article, relatedArticles } = useLoaderData<typeof loader>();

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
        <div className="min-h-screen pt-4 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* 返回按钮 */}
                <Link
                    to="/articles"
                    className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary-start transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    返回文章列表
                </Link>

                {/* 文章头部 */}
                <motion.header
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    {/* 分类 */}
                    <div className="mb-4">
                        <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getCategoryColor(article.category)}`}>
                            {article.category || '未分类'}
                        </span>
                    </div>

                    {/* 标题 */}
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4 leading-tight">
                        {article.title}
                    </h1>


                    {/* 元信息 */}
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {formatDate(article.created_at)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {estimateReadTime(article.content || '')}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4" />
                            {article.views + 1} 次阅读
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Heart className="w-4 h-4" />
                            {article.likes || 0} 喜欢
                        </span>
                    </div>
                </motion.header>

                {/* 封面图 */}
                {article.cover_image && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8 rounded-2xl overflow-hidden"
                    >
                        <OptimizedImage
                            src={article.cover_image}
                            alt={article.title}
                            aspectRatio="video"
                            className="w-full h-auto object-cover"
                        />
                    </motion.div>
                )}

                {/* 文章内容 */}
                <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-8 rounded-2xl mb-8"
                >
                    <div
                        className="prose prose-base md:prose-lg dark:prose-invert max-w-none
                            prose-headings:text-slate-800 dark:prose-headings:text-white
                            prose-p:text-slate-600 dark:prose-p:text-slate-300
                            prose-a:text-primary-start hover:prose-a:text-primary-end
                            prose-code:bg-slate-100 dark:prose-code:bg-slate-800
                            prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950
                            prose-img:rounded-xl"
                        dangerouslySetInnerHTML={{
                            __html: article.content?.replace(/\n/g, '<br>') || ''
                        }}
                    />
                </motion.article>

                {/* 标签 */}
                {tags.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap gap-2 mb-8"
                    >
                        {tags.map((tag, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-lg text-sm"
                            >
                                <Tag className="w-3.5 h-3.5" />
                                {tag}
                            </span>
                        ))}
                    </motion.div>
                )}

                {/* 分享按钮 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="flex gap-3 mb-12"
                >
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success('链接已复制到剪贴板！');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Share2 className="w-4 h-4" />
                        分享文章
                    </button>
                </motion.div>

                {/* 相关文章 */}
                {relatedArticles.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                            相关文章
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {relatedArticles.map((related: any) => (
                                <Link
                                    key={related.id}
                                    to={`/articles/${related.slug}`}
                                    className="glass-card rounded-xl overflow-hidden group hover:shadow-lg transition-shadow"
                                >
                                    <div className="aspect-video bg-slate-200 dark:bg-slate-700">
                                        {related.cover_image ? (
                                            <OptimizedImage
                                                src={related.cover_image}
                                                alt={related.title}
                                                aspectRatio="video"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className={`w-full h-full bg-gradient-to-br ${getCategoryColor(related.category)} opacity-50 flex items-center justify-center`}>
                                                <span className="text-2xl">📝</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-medium text-slate-800 dark:text-white line-clamp-2 group-hover:text-primary-start transition-colors">
                                            {related.title}
                                        </h3>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.section>
                )}
            </div>
        </div>
    );
}

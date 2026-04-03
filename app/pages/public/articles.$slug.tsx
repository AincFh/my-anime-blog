/**
 * 文章详情页
 * Apple HIG 阅读体验设计
 */

import { Link, useLoaderData } from "react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { Calendar, Eye, Heart, ArrowLeft, Share2, Tag, Clock, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Route } from "./+types/articles.$slug";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import { getPlaceholderCover } from "~/utils/placeholder_covers";
import { CommentsSection } from "~/components/ui/interactive/CommentsSection";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    const { getNotionArticleContent } = await import("~/services/notion.server.ts");
    const { getDB } = await import("~/utils/db");
    const db = getDB(context);
    const { slug } = params;

    let article: any = null;
    let isNotion = false;

    try {
        const notionData = await getNotionArticleContent(slug!, context);
        if (notionData) {
            article = {
                ...notionData.metadata,
                content: notionData.content,
            };
            isNotion = true;
        }
    } catch (error) {
        console.warn("Notion detail fetch failed, falling back to D1:", error);
    }

    if (!article) {
        article = await db
            .prepare(`
                SELECT * FROM articles
                WHERE slug = ? AND (status = 'published' OR status IS NULL)
            `)
            .bind(slug)
            .first() as Article | null;
    }

    if (!article) {
        throw new Response("文章不存在", { status: 404 });
    }

    // 增加阅读量（异步不阻塞）
    try {
        if (!isNotion) {
            db.prepare(`UPDATE articles SET views = views + 1 WHERE id = ?`)
                .bind(article.id)
                .run();
        }

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
        console.error("Non-fatal error:", err);
    }

    // 获取相关文章
    let relatedArticles = { results: [] };
    try {
        relatedArticles = (await db
            .prepare(`
                SELECT id, slug, title, cover_image, category, created_at
                FROM articles
                WHERE category = ? AND slug != ? AND (status = 'published' OR status IS NULL)
                ORDER BY created_at DESC
                LIMIT 3
            `)
            .bind(article.category, slug)
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
        console.error("Failed to fetch comments:", err);
    }

    return {
        article,
        relatedArticles: relatedArticles.results || [],
        comments: comments.results || [],
        isNotion
    };
}

export function meta({ data }: Route.MetaArgs) {
    const article = data?.article;
    if (!article) {
        return [{ title: "文章未找到 - A.T. Field" }];
    }
    return [
        { title: `${article.title} - A.T. Field` },
        { name: "description", content: article.content?.slice(0, 160) || article.title },
        { property: "og:title", content: article.title },
        { property: "og:description", content: article.content?.slice(0, 160) || '' },
        { property: "og:type", content: "article" },
        { property: "og:image", content: article.cover_image || '' },
        { name: "article:published_time", content: new Date((article.created_at || 0) * 1000).toISOString() },
        { name: "article:author", content: "Ainc" },
    ];
}

export default function ArticleDetailPage() {
    const loaderData = useLoaderData<typeof loader>();
    const { article, relatedArticles, comments } = loaderData;
    const articleRef = useRef<HTMLElement>(null);
    const [readProgress, setReadProgress] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(article.likes || 0);

    const { scrollYProgress } = useScroll({
        target: articleRef,
        offset: ["start start", "end end"]
    });

    useEffect(() => {
        const unsubscribe = scrollYProgress.on("change", (v) => {
            setReadProgress(Math.round(v * 100));
        });
        return () => unsubscribe();
    }, [scrollYProgress]);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const estimateReadTime = (content: string) => {
        const words = content.length;
        const minutes = Math.ceil(words / 500);
        return minutes;
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
    const processedContent = (article.content || "").replace(/\\n/g, '\n');

    // 提取目录
    const extractHeadings = (text: string) => {
        const headingLines = text.split('\n').filter(line => line.trim().match(/^#{2,3}\s/));
        return headingLines.map(line => {
            const cleanLine = line.trim();
            const level = cleanLine.match(/^#+/)![0].length;
            const title = cleanLine.replace(/^#+\s/, '').trim();
            const id = title.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '-');
            return { level, title, id };
        });
    };

    const headings = extractHeadings(processedContent);

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article.title,
                    text: article.content?.slice(0, 100) || '',
                    url
                });
            } catch {
                // 用户取消分享
            }
        } else {
            await navigator.clipboard.writeText(url);
            // 可以加一个 toast 提示
        }
    };

    const handleLike = () => {
        if (isLiked) {
            setLikeCount(prev => prev - 1);
            setIsLiked(false);
        } else {
            setLikeCount(prev => prev + 1);
            setIsLiked(true);
        }
        // 实际提交到后端
        fetch('/api/article/like', {
            method: 'POST',
            body: new URLSearchParams({ articleId: article.id.toString() })
        }).catch(() => {});
    };

    return (
        <div ref={articleRef} className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A]">
            {/* 阅读进度条 */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-[3px] z-[100] origin-left"
                style={{
                    scaleX: scrollYProgress,
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #d946ef)'
                }}
            />

            {/* 顶部导航 */}
            <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/[0.85] dark:bg-[#0A0A0A]/[0.85] border-b border-black/[0.06] dark:border-white/[0.06]">
                <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
                    {/* 左侧 */}
                    <div className="flex items-center gap-4">
                        <Link
                            to="/articles"
                            className="flex items-center gap-2 text-[15px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="hidden sm:inline">返回</span>
                        </Link>

                        {/* 进度指示器 */}
                        <div className="hidden md:flex items-center gap-2 text-[13px] text-slate-400 dark:text-slate-500 font-medium">
                            <div className="w-24 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                                    style={{ width: `${readProgress}%` }}
                                />
                            </div>
                            <span>{readProgress}%</span>
                        </div>
                    </div>

                    {/* 中间标题 */}
                    <div className="hidden md:block absolute left-1/2 -translate-x-1/2 max-w-[300px] truncate text-[15px] font-bold text-slate-900 dark:text-white">
                        {article.title}
                    </div>

                    {/* 右侧操作 */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                                isLiked
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/15'
                            }`}
                        >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                            <span>{likeCount}</span>
                        </button>

                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/15 transition-all text-[13px] font-semibold"
                        >
                            <Share2 className="w-4 h-4" />
                            <span className="hidden sm:inline">分享</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero 封面 */}
            {article.cover_image && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full aspect-[21/9] md:aspect-[3/1] overflow-hidden"
                >
                    <OptimizedImage
                        src={article.cover_image}
                        alt={article.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAFA] dark:from-[#0A0A0A] via-transparent to-transparent" />
                </motion.div>
            )}

            {/* 文章主体 */}
            <article className="max-w-[800px] mx-auto px-6 md:px-8 lg:px-0 -mt-20 relative z-10">

                {/* 元信息 */}
                <motion.header
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mb-12"
                >
                    {/* 分类和阅读时间 */}
                    <div className="flex items-center gap-4 mb-6">
                        <Link
                            to={`/articles?category=${article.category}`}
                            className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-lg shadow-indigo-500/25"
                        >
                            {article.category || '无分类'}
                        </Link>
                        <span className="flex items-center gap-2 text-[13px] text-slate-400 dark:text-slate-500 font-medium">
                            <Clock className="w-4 h-4" />
                            {estimateReadTime(processedContent)} 分钟阅读
                        </span>
                    </div>

                    {/* 标题 */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-8 leading-[1.1] tracking-tight">
                        {article.title}
                    </h1>

                    {/* 作者信息 */}
                    <div className="flex items-center justify-between py-6 border-y border-slate-200/80 dark:border-white/10">
                        <div className="flex items-center gap-4">
                            {/* 头像 */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/25">
                                A
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white">Ainc</div>
                                <div className="text-[13px] text-slate-500 dark:text-slate-400">
                                    {formatDate(article.created_at)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 text-[13px] text-slate-400 dark:text-slate-500">
                            <span className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                {(article.views + 1).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-2">
                                <Heart className="w-4 h-4" />
                                {likeCount}
                            </span>
                        </div>
                    </div>
                </motion.header>

                {/* 目录 (TOC) */}
                {headings.length > 0 && (
                    <motion.aside
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="hidden xl:block mb-12"
                    >
                        <div className="sticky top-24 p-6 bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl rounded-[24px] border border-black/[0.06] dark:border-white/[0.08]">
                            <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                目录
                            </h4>
                            <nav className="flex flex-col gap-3">
                                {headings.map((h, i) => (
                                    <a
                                        key={i}
                                        href={`#${h.id}`}
                                        className={`text-[14px] font-medium transition-all hover:text-indigo-600 dark:hover:text-indigo-400 ${
                                            h.level === 3 ? 'pl-4 opacity-60' : ''
                                        }`}
                                    >
                                        {h.title}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </motion.aside>
                )}

                {/* 正文 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="prose prose-lg md:prose-xl max-w-none dark:prose-invert
                        prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-white
                        prose-h2:text-3xl md:prose-h2:text-4xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:pb-4 prose-h2:border-b prose-h2:border-slate-200/80 dark:prose-h2:border-white/10
                        prose-h3:text-2xl md:prose-h3:text-3xl prose-h3:mt-10
                        prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-[1.9] prose-p:mb-8 font-medium
                        prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-a:font-bold
                        prose-code:bg-slate-100 dark:prose-code:bg-white/10 prose-code:px-2 prose-code:py-1 prose-code:rounded-lg prose-code:text-[0.875em] prose-code:before:content-none prose-code:after:content-none
                        prose-pre:bg-[#1a1a2e] dark:prose-pre:bg-[#0d0d15] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl prose-pre:shadow-xl prose-pre:p-6 prose-pre:overflow-x-auto
                        prose-pre:prose-pre:my-10
                        prose-img:rounded-3xl prose-img:shadow-xl prose-img:my-10
                        prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-500/5 dark:prose-blockquote:bg-indigo-500/10 prose-blockquote:rounded-r-2xl prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:not-italic prose-blockquote:font-semibold
                        prose-ul:my-6 prose-li:my-2
                        prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-bold
                        prose-hr:border-slate-200/50 dark:prose-hr:border-white/10 prose-hr:my-12
                    "
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h2: ({node, ...props}) => {
                                const text = String(props.children || '');
                                const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '-');
                                return <h2 id={id} {...props} />;
                            },
                            h3: ({node, ...props}) => {
                                const text = String(props.children || '');
                                const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '-');
                                return <h3 id={id} {...props} />;
                            }
                        }}
                    >
                        {processedContent}
                    </ReactMarkdown>
                </motion.div>

                {/* 标签 */}
                {tags.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-wrap gap-3 mt-16 mb-12"
                    >
                        <Tag className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-1" />
                        {tags.map((tag, i) => (
                            <Link
                                key={i}
                                to={`/articles?q=${encodeURIComponent(tag)}`}
                                className="px-4 py-2 bg-white dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-full text-[13px] font-semibold hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                            >
                                #{tag}
                            </Link>
                        ))}
                    </motion.div>
                )}

                {/* 分享卡片 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="p-8 md:p-10 bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-fuchsia-500/5 dark:from-indigo-500/10 dark:via-violet-500/10 dark:to-fuchsia-500/10 rounded-[32px] border border-indigo-500/10 dark:border-indigo-500/20 mb-16"
                >
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                                喜欢这篇文章吗？
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                如果内容对你有帮助，欢迎分享给更多的小伙伴！
                            </p>
                        </div>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full font-bold text-[14px] shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Share2 className="w-5 h-5" />
                            分享文章
                        </button>
                    </div>
                </motion.div>

                {/* 相关阅读 */}
                {relatedArticles.length > 0 && (
                    <section className="mb-16">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                <Sparkles className="w-6 h-6 text-indigo-500" />
                                相关阅读
                            </h2>
                            <Link
                                to="/articles"
                                className="text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                                查看全部
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {relatedArticles.map((related: any, index: number) => (
                                <motion.div
                                    key={related.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.1 * index }}
                                >
                                    <Link
                                        to={`/articles/${related.slug}`}
                                        className="group block rounded-[24px] overflow-hidden bg-white dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                    >
                                        <div className="relative aspect-[16/9] overflow-hidden">
                                            <OptimizedImage
                                                src={related.cover_image || getPlaceholderCover(related.category)}
                                                alt={related.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <span className="absolute bottom-3 left-3 text-white text-[10px] font-bold uppercase tracking-wider">
                                                {related.category}
                                            </span>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {related.title}
                                            </h3>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 评论区 */}
                <section className="bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl p-8 md:p-12 rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] mb-16">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full" />
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                            评论区
                        </h2>
                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[12px] font-bold rounded-full">
                            {comments.length} 条
                        </span>
                    </div>
                    <CommentsSection
                        articleId={article.id}
                        comments={comments as any}
                    />
                </section>
            </article>

            {/* 底部导航 */}
            <footer className="border-t border-slate-200/50 dark:border-white/10 py-8">
                <div className="max-w-[800px] mx-auto px-6 text-center text-[13px] text-slate-400 dark:text-slate-500">
                    <Link
                        to="/articles"
                        className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        返回文章专栏
                    </Link>
                    <span className="mx-4">·</span>
                    <span>© 2024 A.T. Field · Ainc</span>
                </div>
            </footer>
        </div>
    );
}

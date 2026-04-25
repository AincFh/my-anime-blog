/**
 * 文章详情页 - 使用主题系统
 */

import { Link, useLoaderData } from "react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { Calendar, Eye, Heart, ArrowLeft, Share2, Tag, Clock, ArrowRight, BookOpen, Bookmark } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import { getPlaceholderCover } from "~/utils/placeholder_covers";
import { CommentsSection } from "~/components/ui/interactive/CommentsSection";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FloatingSubNav } from "~/components/layout/FloatingSubNav";
import { cn } from "~/utils/cn";
import { onLike } from "~/components/ui/system/AchievementSystem";

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

export async function loader({ request, params, context }: LoaderFunctionArgs) {
    const { getNotionArticleContent } = await import("~/services/notion.server.ts");
    const { getDB } = await import("~/utils/db");
    const db = getDB(context);
    const { slug } = params;

    let article: any = null;
    let isNotion = false;

    try {
        const notionData = await getNotionArticleContent(slug!, context);
        if (notionData) {
            article = { ...notionData.metadata, content: notionData.content };
            isNotion = true;
        }
    } catch (error) {
        console.warn("Notion detail fetch failed, falling back to D1:", error);
    }

    if (!article) {
        article = await db
            .prepare(`SELECT * FROM articles WHERE slug = ? AND (status = 'published' OR status IS NULL)`)
            .bind(slug)
            .first() as Article | null;
    }

    if (!article) {
        throw new Response("文章不存在", { status: 404 });
    }

    try {
        if (!isNotion) {
            db.prepare(`UPDATE articles SET views = views + 1 WHERE id = ?`).bind(article.id).run();
        }
        const { getSessionToken, verifySession } = await import('~/services/auth.server');
        const { updateMissionProgress } = await import('~/services/membership/mission.server');
        const token = getSessionToken(request);
        if (token) {
            const { valid, user } = await verifySession(token, db);
            if (valid && user) await updateMissionProgress(db, user.id, 'article_read');
        }
    } catch (err) {
        console.error("Non-fatal error:", err);
    }

    let relatedArticles = { results: [] };
    try {
        relatedArticles = (await db.prepare(`
            SELECT id, slug, title, cover_image, category, created_at
            FROM articles WHERE category = ? AND slug != ? AND (status = 'published' OR status IS NULL)
            ORDER BY created_at DESC LIMIT 3
        `).bind(article.category, slug).all()) as any;
    } catch (err) {
        console.error("Failed to fetch related articles:", err);
    }

    let comments = { results: [] };
    try {
        comments = (await db.prepare(`
            SELECT id, author, content, created_at, is_danmaku, avatar_style
            FROM comments WHERE article_id = ? AND status = 'approved'
            ORDER BY created_at DESC
        `).bind(article.id).all()) as any;
    } catch (err) {
        console.error("Failed to fetch comments:", err);
    }

    return { article, relatedArticles: relatedArticles.results || [], comments: comments.results || [], isNotion };
}

export function meta({ data }: { data: { article?: Article } | undefined }) {
    const article = data?.article as Article | undefined;
    if (!article) return [{ title: "文章未找到 - A.T. Field" }];

    const siteUrl = "https://anime.dog";
    const articleUrl = `${siteUrl}/articles/${article.slug}`;
    const description = article.summary || article.content?.slice(0, 160) || article.title;
    const ogImage = article.cover_image || `${siteUrl}/api/og/${article.slug}`;
    const publishedTime = article.created_at ? new Date(article.created_at * 1000).toISOString() : undefined;
    const modifiedTime = article.updated_at ? new Date(article.updated_at * 1000).toISOString() : undefined;

    // 安全解析 tags
    const parseTagsForMeta = (tagsJson: string | string[] | null | undefined): string => {
        if (!tagsJson) return "";
        if (Array.isArray(tagsJson)) return tagsJson.join(", ");
        try { return JSON.parse(tagsJson).join(", "); } catch { 
            if (typeof tagsJson === 'string') return tagsJson;
            return "";
        }
    };
    const keywords = parseTagsForMeta(article.tags as string | string[] | null);

    return [
        // 基础 Meta
        { title: `${article.title} - A.T. Field 星影小站` },
        { name: "description", content: description },
        { name: "keywords", content: keywords },
        { name: "author", content: "星影小站" },
        { name: "robots", content: "index, follow" },

        // Open Graph
        { property: "og:title", content: article.title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: articleUrl },
        { property: "og:image", content: ogImage },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:site_name", content: "A.T. Field 星影小站" },
        { property: "og:locale", content: "zh_CN" },

        // Article 特定属性
        { property: "article:published_time", content: publishedTime },
        { property: "article:modified_time", content: modifiedTime },
        { property: "article:author", content: "星影小站" },
        { property: "article:section", content: article.category },

        // Twitter Card
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: article.title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
        { name: "twitter:site", content: "@A_T_Field" },

        // 额外 SEO
        { tagName: "link", rel: "canonical", href: articleUrl },
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

    const estimateReadTime = (content: string) => Math.ceil(content.length / 500);

    const parseTags = (tagsJson: string | string[] | null | undefined): string[] => {
        if (!tagsJson) return [];
        if (Array.isArray(tagsJson)) return tagsJson;
        try { return JSON.parse(tagsJson as string); } catch { 
            // 如果不是 JSON 格式，可能是逗号分隔的字符串
            if (typeof tagsJson === 'string') return tagsJson.split(',').map(t => t.trim()).filter(Boolean);
            return [];
        }
    };

    const tags = parseTags(article.tags as string | string[] | null);
    const processedContent = (article.content || "").replace(/\\n/g, '\n');

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
            try { await navigator.share({ title: article.title, url }); } catch {}
        } else {
            await navigator.clipboard.writeText(url);
        }
    };

    const handleLike = () => {
        const newLiked = !isLiked;
        setIsLiked(newLiked);
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
        if (newLiked) onLike();
        fetch('/api/article/like', {
            method: 'POST',
            body: new URLSearchParams({ articleId: article.id.toString() })
        }).catch(() => {});
    };

    return (
        <div ref={articleRef} className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            {/* 灵动岛导航 */}
            <FloatingSubNav
                title={article.title}
                rightContent={
                    <>
                        <button
                            onClick={handleLike}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 active:scale-95',
                                isLiked
                                    ? 'bg-rose-500/20 text-rose-500'
                                    : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
                            )}
                        >
                            <Bookmark className={cn('w-4 h-4', isLiked && 'fill-current')} />
                            <span className="hidden xs:inline">{likeCount}</span>
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-semibold hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all duration-200 active:scale-95"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                    </>
                }
            />

            {/* 阅读进度条 */}
            <motion.div
                className="fixed top-14 left-0 right-0 h-[2px] z-[90] origin-left"
                style={{
                    scaleX: scrollYProgress,
                    background: 'linear-gradient(90deg, var(--color-primary-start), var(--color-primary-end))'
                }}
            />

            {/* 顶部留白（适配灵动岛导航） */}
            <div className="h-14" />

            {/* 封面 */}
            {article.cover_image && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden"
                >
                    <OptimizedImage src={article.cover_image} alt={article.title} className="w-full h-full object-cover" />
                    {/* 全覆盖渐变遮罩 - 确保完全覆盖 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/60 to-transparent" />
                </motion.div>
            )}

            {/* 文章主体 - 移除负边距，使用正常布局 */}
            <article className="max-w-[900px] mx-auto px-6 md:px-8 lg:px-0 pb-20">

                {/* 元信息 */}
                <motion.header
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <Link
                            to={`/articles?category=${article.category}`}
                            className="px-4 py-1.5 text-white text-[11px] font-black uppercase tracking-wider rounded-full border border-transparent"
                            style={{ background: 'linear-gradient(135deg, var(--color-primary-start), var(--color-primary-end))' }}
                        >
                            {article.category || '无分类'}
                        </Link>
                        <span className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                            <Clock className="w-4 h-4" />
                            {estimateReadTime(processedContent)} 分钟阅读
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-[1.1] tracking-tight">
                        {article.title}
                    </h1>

                    <div className="flex items-center justify-between py-6 border-y" style={{ borderColor: 'var(--glass-border)' }}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg" style={{ background: 'linear-gradient(135deg, var(--color-primary-start), var(--color-primary-end))' }}>
                                A
                            </div>
                            <div>
                                <div className="font-bold">Ainc</div>
                                <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                                    {formatDate(article.created_at)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
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

                {/* 目录 */}
                {headings.length > 0 && (
                    <motion.aside
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="hidden xl:block mb-12"
                    >
                        <div className="sticky top-24 p-6 rounded-2xl glass-card">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] mb-5 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                                <BookOpen className="w-4 h-4" />
                                目录
                            </h4>
                            <nav className="flex flex-col gap-3">
                                {headings.map((h, i) => (
                                    <a
                                        key={i}
                                        href={`#${h.id}`}
                                        className={`text-[14px] font-medium transition-all hover:opacity-70 ${h.level === 3 ? 'pl-4' : ''}`}
                                        style={{ color: 'var(--text-primary)' }}
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
                    className="prose prose-lg md:prose-xl max-w-none
                        prose-headings:font-black prose-headings:tracking-tight
                        prose-h2:text-3xl md:prose-h2:text-4xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:pb-4 prose-h2:border-b
                        prose-h3:text-2xl md:prose-h3:text-3xl prose-h3:mt-10
                        prose-p:leading-[1.9] prose-p:mb-8 font-medium
                        prose-code:bg-slate-100 dark:prose-code:bg-white/10 prose-code:px-2 prose-code:py-1 prose-code:rounded-lg prose-code:text-[0.875em] prose-code:before:content-none prose-code:after:content-none
                        prose-pre:bg-slate-900 dark:prose-pre:bg-black prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl prose-pre:shadow-xl prose-pre:p-6 prose-pre:overflow-x-auto
                        prose-img:rounded-3xl prose-img:shadow-xl prose-img:my-10
                        prose-blockquote:border-l-4 prose-blockquote:border-[var(--color-primary-start)] prose-blockquote:rounded-r-2xl prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:not-italic prose-blockquote:font-semibold
                        prose-ul:my-6 prose-li:my-2
                        prose-hr:border-slate-200/50 dark:prose-hr:border-white/10 prose-hr:my-12
                    "
                    style={{
                        '--tw-prose-body': 'var(--text-primary)',
                        '--tw-prose-headings': 'var(--text-primary)',
                    } as any}
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
                        <Tag className="w-5 h-5 mt-1" style={{ color: 'var(--text-secondary)' }} />
                        {tags.map((tag, i) => (
                            <Link
                                key={i}
                                to={`/articles?q=${encodeURIComponent(tag)}`}
                                className="px-4 py-2 rounded-full text-[13px] font-semibold border transition-all hover:opacity-80"
                                style={{ backgroundColor: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--glass-border)' }}
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
                    className="p-8 md:p-10 rounded-2xl border mb-16"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255, 159, 67, 0.08), rgba(255, 107, 107, 0.05))',
                        borderColor: 'var(--glass-border)'
                    }}
                >
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-2xl font-black mb-2">喜欢这篇文章吗？</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>如果内容对你有帮助，欢迎分享给更多的小伙伴！</p>
                        </div>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-3 px-8 py-4 rounded-full font-bold text-[14px] text-white transition-all hover:opacity-80"
                            style={{ background: 'linear-gradient(135deg, var(--color-primary-start), var(--color-primary-end))' }}
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
                            <h2 className="text-2xl md:text-3xl font-black flex items-center gap-3">
                                相关阅读
                            </h2>
                            <Link
                                to="/articles"
                                className="text-[13px] font-semibold flex items-center gap-1 hover:opacity-70 transition-all"
                                style={{ color: 'var(--color-primary-start)' }}
                            >
                                查看全部 <ArrowRight className="w-4 h-4" />
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
                                        className="group block rounded-2xl overflow-hidden glass-card"
                                    >
                                        <div className="relative aspect-[16/9] overflow-hidden">
                                            <OptimizedImage
                                                src={related.cover_image || getPlaceholderCover(related.category)}
                                                alt={related.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <span className="absolute bottom-3 left-3 text-white text-[10px] font-bold uppercase tracking-wider">{related.category}</span>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="font-bold line-clamp-2 group-hover:opacity-70 transition-opacity">{related.title}</h3>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 评论区 */}
                <section className="p-8 md:p-12 rounded-2xl glass-card mb-16">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-1.5 h-8 rounded-full" style={{ background: 'linear-gradient(180deg, var(--color-primary-start), var(--color-primary-end))' }} />
                        <h2 className="text-2xl md:text-3xl font-black">评论区</h2>
                        <span className="px-3 py-1 text-[12px] font-bold rounded-full" style={{ backgroundColor: 'var(--glass-bg)', color: 'var(--text-secondary)' }}>
                            {comments.length} 条
                        </span>
                    </div>
                    <CommentsSection articleId={article.id} comments={comments as any} />
                </section>
            </article>

            {/* 底部 */}
            <footer className="border-t py-8" style={{ borderColor: 'var(--glass-border)' }}>
                <div className="max-w-[800px] mx-auto px-6 text-center text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                    <span className="mx-4">·</span>
                    <span>© 2024 A.T. Field · Ainc</span>
                </div>
            </footer>
        </div>
    );
}

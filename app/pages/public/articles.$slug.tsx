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
import { getPlaceholderCover } from "~/utils/placeholder_covers";

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

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export async function loader({ request, params, context }: Route.LoaderArgs) {
    const { getNotionArticleContent } = await import("~/services/notion.server.ts");
    const { getDB } = await import("~/utils/db");
    const db = getDB(context);
    const { slug } = params;

    let article: any = null;
    let isNotion = false;

    try {
        // 1. 优先从 Notion 获取文章详情
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

    // 2. 如果 Notion 没有，降级到 D1
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

    // 增加阅读量及附属功能务必使用 try-catch 以防阻塞主文章加载
    try {
        if (!isNotion) {
            await db
                .prepare(`UPDATE articles SET views = views + 1 WHERE id = ?`)
                .bind(article.id)
                .run();
        }

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

    // 获取相关文章 (暂从 D1 获取，以保持简单)
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
        console.error("Failed to fetch comments for article:", err);
    }

    return {
        article,
        relatedArticles: relatedArticles.results || [],
        comments: comments.results || [],
        isNotion
    };
}

export default function ArticleDetailPage() {
    const loaderData = useLoaderData<typeof loader>();
    const { article, relatedArticles, comments } = loaderData;

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

    // 预处理内容：修复字面量 \n 问题
    const processedContent = (article.content || "").replace(/\\n/g, '\n');

    // 提取目录 (Extract TOC from Markdown)
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

    return (
        <div className="min-h-screen bg-[#FBFBFD] dark:bg-[#080808] pt-[70px] md:pt-20 pb-32">
            {/* 顶部阅读进度条 */}
            <motion.div 
                className="fixed top-0 left-0 right-0 h-[3px] bg-blue-600 dark:bg-blue-500 z-[100] origin-left"
                style={{ scaleX: 0 }} // 此处需配合 CSS 或 Framer Motion 的 scroll 钩子，简单起见先放占位
            />

            <div className="max-w-[1400px] mx-auto px-6 lg:px-20 relative">
                {/* 侧边返回键 - 极简悬浮 */}
                <div className="hidden xl:block absolute -left-12 top-0 h-full">
                    <div className="sticky top-32">
                        <Link
                            to="/articles"
                            className="p-3 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-white/5 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-110 active:scale-95 block"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto">
                    {/* 沉浸式头部 */}
                    <motion.header
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="mb-12 md:mb-20"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <span className="px-4 py-1.5 bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-[0.1em] rounded-full">
                                {article.category || '未分类'}
                            </span>
                            <span className="text-[13px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {estimateReadTime(processedContent)} 阅读
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-8 leading-[1.1] tracking-tight text-pretty">
                            {article.title}
                        </h1>

                        <div className="flex items-center gap-8 py-5 border-y border-slate-100 dark:border-white/5 text-[12px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">
                            <span className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 opacity-40" />
                                {formatDate(article.created_at)}
                            </span>
                            <span className="flex items-center gap-2">
                                <Eye className="w-3.5 h-3.5 opacity-40" />
                                {article.views + 1} 次阅读
                            </span>
                            <span className="flex items-center gap-2">
                                <Heart className="w-3.5 h-3.5 opacity-40" />
                                {article.likes || 0} 点赞
                            </span>
                        </div>
                    </motion.header>

                    {/* 封面图 - 宽屏包裹 */}
                    {article.cover_image && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="mb-16 md:mb-24 -mx-6 sm:mx-0 sm:rounded-[40px] overflow-hidden shadow-2xl bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-white/5"
                        >
                            <OptimizedImage
                                src={article.cover_image}
                                alt={article.title}
                                aspectRatio="video"
                                className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-1000"
                            />
                        </motion.div>
                    )}

                    <div className="flex flex-col lg:flex-row gap-12 relative">
                        {/* 目录 (TOC) - 宽屏专供悬浮 */}
                        {headings.length > 0 && (
                            <aside className="hidden lg:block lg:absolute lg:-right-[350px] lg:top-0 w-[240px]">
                                <div className="sticky top-32 p-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[32px] border border-slate-200/50 dark:border-white/5">
                                    <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">目录</h4>
                                    <nav className="flex flex-col gap-4">
                                        {headings.map((h, i) => (
                                            <a
                                                key={i}
                                                href={`#${h.id}`}
                                                className={`text-sm font-bold transition-all hover:text-blue-600 dark:hover:text-blue-400 ${h.level === 3 ? 'pl-4 opacity-60' : ''}`}
                                            >
                                                {h.title}
                                            </a>
                                        ))}
                                    </nav>
                                </div>
                            </aside>
                        )}

                        {/* 正文内容 - 高奢 Prose */}
                        <article className="flex-1 w-full prose prose-slate md:prose-xl max-w-none dark:prose-invert antialiased
                                prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-slate-900 dark:prose-headings:text-white
                                prose-h2:mt-16 prose-h2:mb-8 prose-h2:text-4xl prose-h2:pb-4 prose-h2:border-b prose-h2:border-slate-100 dark:prose-h2:border-white/5
                                prose-h3:text-2xl prose-h3:mt-10
                                prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-[2] prose-p:mb-12 prose-p:text-[17px] font-medium
                                prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-a:font-bold
                                prose-code:bg-slate-100 dark:prose-code:bg-slate-800/80 prose-code:px-2 prose-code:py-1 prose-code:rounded-lg prose-code:text-[0.9em] prose-code:before:content-none prose-code:after:content-none
                                prose-pre:bg-[#0A0A0A] dark:prose-pre:bg-[#050505] prose-pre:border prose-pre:border-slate-800 dark:prose-pre:border-white/5 prose-pre:rounded-[24px] prose-pre:shadow-2xl prose-pre:p-8
                                prose-img:rounded-[32px] prose-img:shadow-2xl prose-img:my-16
                                prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-blue-500/5 prose-blockquote:rounded-r-3xl prose-blockquote:px-8 prose-blockquote:py-4 prose-blockquote:not-italic prose-blockquote:font-bold">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h2: ({node, ...props}) => <h2 id={props.children?.toString().toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '-')} {...props} />,
                                    h3: ({node, ...props}) => <h3 id={props.children?.toString().toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '-')} {...props} />
                                }}
                            >
                                {processedContent}
                            </ReactMarkdown>
                        </article>
                    </div>

                    {/* 底部标签组 */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-20 mb-16">
                            {tags.map((tag, i) => (
                                <span
                                    key={i}
                                    className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 rounded-full text-[13px] font-black tracking-wide hover:border-blue-600 dark:hover:border-blue-500 transition-all cursor-pointer shadow-sm"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* 分享栏 - 紧凑优雅风格 */}
                    <div className="p-6 md:p-8 bg-white dark:bg-slate-900/80 rounded-[24px] border border-slate-100 dark:border-white/10 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-20">
                        <div className="text-center md:text-left">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">觉得有用就点个赞吧</h3>
                            <p className="text-sm text-slate-400 dark:text-slate-500">你的支持是我创作的动力</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={async () => {
                                    const { likeArticle } = await import('~/services/article.server');
                                    try {
                                        await likeArticle(article.id, context);
                                        toast.success('感谢你的点赞！');
                                    } catch {
                                        toast.error('点赞失败，请稍后重试');
                                    }
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-[13px] font-bold hover:scale-105 transition-all shadow-md active:scale-95"
                            >
                                <Heart className="w-4 h-4" />
                                点赞 {article.likes > 0 && <span className="ml-1">({article.likes})</span>}
                            </button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success('链接已复制到剪贴板！');
                                }}
                                className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-white/20 text-slate-600 dark:text-slate-400 rounded-full text-[13px] font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95"
                            >
                                <Share2 className="w-4 h-4" />
                                分享
                            </button>
                        </div>
                    </div>

                    {/* 相关阅读 */}
                    {relatedArticles.length > 0 && (
                        <section className="mb-16">
                            <div className="flex items-end justify-between mb-10">
                                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
                                    相关阅读
                                </h2>
                                <Link to="/articles" className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                    查看全部
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {relatedArticles.map((related: any) => {
                                    const relCover = related.cover_image || getPlaceholderCover(related.category);
                                    return (
                                        <Link
                                            key={related.id}
                                            to={`/articles/${related.slug}`}
                                            className="group relative h-[320px] rounded-[32px] overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 shadow-lg block"
                                        >
                                            <OptimizedImage
                                                src={relCover}
                                                alt={related.title}
                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-8 flex flex-col justify-end">
                                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">{related.category}</span>
                                                <h3 className="text-xl font-black text-white leading-tight line-clamp-2">
                                                    {related.title}
                                                </h3>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* 评论区 - 独立高奢岛 */}
                    <section className="bg-white/50 dark:bg-slate-950/50 backdrop-blur-3xl p-8 md:p-12 rounded-[48px] border border-slate-200 dark:border-white/5">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-1.5 h-8 bg-blue-600 dark:bg-blue-500 rounded-full" />
                            <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
                                评论区
                            </h2>
                        </div>
                        <CommentsSection articleId={article.id} comments={comments as any} />
                    </section>
                </div>
            </div>
        </div>
    );
}

/**
 * 文章列表页
 */

import { Link, useLoaderData, useSearchParams, useSubmit, Form, useNavigation } from "react-router";
import { motion } from "framer-motion";
import { Calendar, Eye, Heart, ArrowRight, Search, Loader2, MessageSquare, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import type { Route } from "./+types/articles";
import { getCategoryColor } from "~/utils/categoryColor";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import { getPlaceholderCover } from "~/utils/placeholder_covers";

// 分类对应的颜色圆点
const getCategoryDotColor = (category: string | null): string => {
  const colors: Record<string, string> = {
    '技术': 'bg-blue-500',
    '动漫': 'bg-pink-500',
    '游戏': 'bg-purple-500',
    '生活': 'bg-green-500',
  };
  return colors[category || ''] || 'bg-slate-400';
};

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
    comment_count?: number;
    created_at: number;
}

// 从content中提取简介
const getDescription = (content: string): string => {
    if (!content) return '';
    const cleaned = content
        .replace(/^#.*$/gm, '')
        .replace(/[\*\#\[\]\(\)]/g, '')
        .replace(/\n+/g, ' ')
        .trim();
    return cleaned.slice(0, 120) + (cleaned.length > 120 ? '...' : '');
};

export async function loader({ request, context }: Route.LoaderArgs) {
    const { getDB } = await import("~/utils/db");
    const db = getDB(context);

    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";
    const categoryQuery = url.searchParams.get("category") || "all";

    let articles: Article[] = [];
    let categories: string[] = ['all'];

    try {
        // 从 D1 读取已发布的文章
        let sql = `
            SELECT a.id, a.slug, a.title, a.summary as content, a.category, a.cover_image, a.tags, a.views, a.likes, a.created_at,
                   (SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id AND c.status = 'approved') as comment_count
            FROM articles a
            WHERE a.status = 'published'
        `;
        const params: any[] = [];

        // 搜索支持（使用 FTS 或 LIKE）
        if (q) {
            // 尝试 FTS 搜索
            try {
                sql = `
                    SELECT a.id, a.slug, a.title, a.summary as content, a.category, a.cover_image, a.tags, a.views, a.likes, a.created_at,
                           (SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id AND c.status = 'approved') as comment_count
                    FROM articles a
                    JOIN articles_fts f ON a.id = f.rowid
                    WHERE a.status = 'published' AND articles_fts MATCH ?
                `;
                params.push(q);
            } catch {
                // FTS 失败，回退到 LIKE
                sql = `
                    SELECT a.id, a.slug, a.title, a.summary as content, a.category, a.cover_image, a.tags, a.views, a.likes, a.created_at,
                           (SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id AND c.status = 'approved') as comment_count
                    FROM articles a
                    WHERE a.status = 'published' AND (a.title LIKE ? OR a.summary LIKE ?)
                `;
                const likeQ = `%${q}%`;
                params.push(likeQ, likeQ);
            }
        }

        // 分类过滤
        if (categoryQuery !== "all") {
            sql += ` AND a.category = ?`;
            params.push(categoryQuery);
        }

        sql += ` ORDER BY a.created_at DESC LIMIT 50`;

        const result = await db.prepare(sql).bind(...params).all();
        articles = (result.results || []) as unknown as Article[];

        // 获取所有分类
        const categoriesResult = await db
            .prepare("SELECT DISTINCT category FROM articles WHERE status = 'published' AND category IS NOT NULL AND category != '' AND category != 'null' AND category != 'undefined'")
            .all();
        categories = ['all', ...(categoriesResult.results || []).map((c: any) => c.category).filter(Boolean)];

    } catch (error) {
        console.error("Failed to fetch articles:", error);
    }

    return {
        articles,
        categories,
        q,
        category: categoryQuery
    };
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "文章列表加载失败";
  let details = "无法显示文章列表，请稍后重试";
  let stack: string | undefined;
  if (error instanceof Error) {
    details = error.message;
    if (import.meta.env.DEV) stack = error.stack;
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-red-400 mb-4">{message}</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">{details}</p>
        {stack && import.meta.env.DEV && (
          <pre className="text-xs text-left bg-slate-900 text-red-300 p-4 rounded-lg overflow-x-auto max-w-2xl">{stack}</pre>
        )}
        <a href="/articles" className="mt-4 inline-block px-6 py-2 bg-red-500 text-white rounded-lg">刷新</a>
      </div>
    </div>
  );
}

export default function ArticlesPage() {
    const { articles, categories, q, category } = useLoaderData<typeof loader>();
    const [searchParams] = useSearchParams();
    const submit = useSubmit();
    const navigation = useNavigation();

    // 本地状态用于输入框的实时反馈，实际提交是 debounce 的
    const [searchTerm, setSearchTerm] = useState(q);

    const isSearching = navigation.location && new URLSearchParams(navigation.location.search).has("q");

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Debounce search submission
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== q) {
                const isFirstSearch = q === "";
                submit(
                    { q: searchTerm, category },
                    { replace: !isFirstSearch }
                );
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, category, submit, q]);

    const handleCategoryChange = (newCategory: string) => {
        submit({ q: searchTerm, category: newCategory }, { replace: true });
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto pt-[70px] md:pt-[80px] pb-32 lg:pb-24 px-4 md:px-6 lg:px-10 xl:px-12">
            <div className="w-full">
                {/* 标题区域 - Apple HIG 纯黑白优雅字重 */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-8 md:mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-sans font-black tracking-tight text-slate-900 dark:text-white mb-3">
                        文章专栏
                    </h1>
                    <p className="text-lg md:text-xl font-medium text-slate-500 dark:text-slate-400 tracking-tight">
                        技术探索、动漫感想与生活日志
                    </p>
                </motion.div>

                {/* 搜索和筛选 - 高端磨砂极简条 */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-12"
                >
                    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                        {/* iOS 风格全局搜索框 */}
                        <div className="relative flex-1 md:max-w-md shrink-0">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            </div>
                            <input
                                type="text"
                                placeholder="搜索文章..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-100/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-[20px] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all border border-transparent dark:border-white/5"
                            />
                        </div>

                        {/* 极简胶囊分类筛选 */}
                        <div className="flex overflow-x-auto hide-scrollbar snap-x gap-2 pb-1 md:pb-0 md:flex-wrap">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryChange(cat)}
                                    className={`px-5 py-3 rounded-[20px] text-[15px] font-semibold tracking-wide transition-all duration-300 whitespace-nowrap ${category === cat
                                        ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900 dark:shadow-white/10'
                                        : 'bg-slate-100/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/80'
                                        }`}
                                >
                                    {cat === 'all' ? '全部' : cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* 文章列表 - 现代化瀑布流布局 */}
                {articles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
                        {articles.map((article, index) => {
                            const displayCover = article.cover_image || getPlaceholderCover(article.category);

                            return (
                                <motion.article
                                    key={article.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ duration: 0.7, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                                    className="group relative flex flex-col h-full bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl overflow-hidden border border-slate-200/60 dark:border-white/5 hover:border-amber-500/30 dark:hover:border-amber-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/5 hover:-translate-y-1"
                                >
                                    {/* 封面区域 */}
                                    <Link to={`/articles/${article.slug}`} className="block relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        <OptimizedImage
                                            src={displayCover}
                                            alt={article.title}
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                                        />

                                        {/* 分类标签 */}
                                        <div className="absolute top-4 left-4">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-sm border border-white/20 dark:border-slate-700/50">
                                                <span className={`w-1.5 h-1.5 rounded-full ${getCategoryDotColor(article.category)}`} />
                                                {article.category || '无分类'}
                                            </span>
                                        </div>

                                        {/* 悬浮遮罩 */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        {/* 阅读指示器 */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                                            <span className="px-5 py-2 bg-white/90 backdrop-blur-md rounded-full text-slate-900 text-[12px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-2">
                                                <BookOpen className="w-3.5 h-3.5" />
                                                阅读全文
                                            </span>
                                        </div>
                                    </Link>

                                    {/* 内容区域 */}
                                    <div className="p-6 md:p-7 flex flex-col flex-1">
                                        {/* 日期 */}
                                        <div className="flex items-center gap-2 mb-4 text-[12px] text-slate-400 dark:text-slate-500 font-medium">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(article.created_at)}
                                        </div>

                                        {/* 标题 */}
                                        <Link to={`/articles/${article.slug}`} className="block mb-3">
                                            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors line-clamp-2 leading-snug tracking-tight">
                                                {article.title}
                                            </h3>
                                        </Link>

                                        {/* 摘要 */}
                                        <p className="text-[14px] md:text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 mb-6 flex-1">
                                            {getDescription(article.content)}
                                        </p>

                                        {/* 底部元数据栏 */}
                                        <div className="pt-5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-[12px] text-slate-400 dark:text-slate-500 font-medium">
                                                <div className="flex items-center gap-1.5 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    {article.views}
                                                </div>
                                                <div className="flex items-center gap-1.5 hover:text-rose-500 transition-colors">
                                                    <Heart className="w-3.5 h-3.5" />
                                                    {article.likes}
                                                </div>
                                                <div className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    {article.comment_count || 0}
                                                </div>
                                            </div>

                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 uppercase tracking-wider">
                                                READ
                                                <ArrowRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>
                                </motion.article>
                            );
                        })}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-32 text-center"
                    >
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <Search className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-700 dark:text-white mb-2">未找到文章</h3>
                        <p className="text-slate-500 max-w-sm mb-8">
                            {q ? '未能找到符合搜索词的记录。探索一下其他领域的文章吧？' : '这里目前像宇宙一样空旷...'}
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

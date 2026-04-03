/**
 * 文章列表页
 * Apple HIG + Glassmorphism 设计风格
 */

import { Link, useLoaderData, useSearchParams, useSubmit, useNavigation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Eye, Heart, ArrowRight, Search, Loader2, Sparkles, BookOpen, Layers, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import type { Route } from "./+types/articles";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
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
    summary?: string;
}

export async function loader({ request, context }: Route.LoaderArgs) {
    const { fetchNotionArticles } = await import("~/services/notion.server.ts");
    const { getDB } = await import("~/utils/db");
    const db = getDB(context);

    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";
    const categoryQuery = url.searchParams.get("category") || "all";

    let articles: Article[] = [];
    let categories: string[] = ['all'];

    try {
        const notionArticles = await fetchNotionArticles(context);

        if (notionArticles.length > 0) {
            articles = notionArticles.map(as => ({
                id: parseInt(as.id.replace(/-/g, '').slice(0, 8), 16),
                slug: as.slug,
                title: as.title,
                content: as.summary || as.content?.slice(0, 200) || '',
                summary: as.summary,
                category: as.category,
                cover_image: as.cover_image,
                tags: JSON.stringify(as.tags),
                views: 0,
                likes: 0,
                created_at: as.created_at
            }));

            const uniqueCats = Array.from(new Set(notionArticles.map(a => a.category)));
            categories = ['all', ...uniqueCats];
        } else {
            throw new Error("No articles from Notion");
        }
    } catch (error) {
        console.warn("Falling back to D1 Database:", error);

        let sql = `
            SELECT id, slug, title, summary, content, category, cover_image, tags, views, likes, created_at
            FROM articles
        `;
        const params: any[] = [];
        const whereClauses: string[] = ["(status = 'published' OR status IS NULL)"];

        if (q) {
            sql = `
                SELECT a.id, a.slug, a.title, a.summary, a.content, a.category, a.cover_image, a.tags, a.views, a.likes, a.created_at
                FROM articles a
                JOIN articles_fts f ON a.id = f.rowid
            `;
            whereClauses.push(`articles_fts MATCH ?`);
            params.push(q);
        }

        if (categoryQuery !== "all") {
            whereClauses.push(`category = ?`);
            params.push(categoryQuery);
        }

        sql += ` WHERE ` + whereClauses.join(" AND ") + ` ORDER BY created_at DESC LIMIT 50`;
        const result = await db.prepare(sql).bind(...params).all();
        articles = (result.results || []) as unknown as Article[];

        const categoriesResult = await db.prepare("SELECT DISTINCT category FROM articles WHERE category IS NOT NULL").all();
        categories = ['all', ...(categoriesResult.results || []).map((c: any) => c.category)];
    }

    if (q && articles.length > 0) {
        const lowerQ = q.toLowerCase();
        articles = articles.filter(a =>
            a.title.toLowerCase().includes(lowerQ) ||
            (a.summary || a.content).toLowerCase().includes(lowerQ)
        );
    }

    if (categoryQuery !== 'all') {
        articles = articles.filter(a => a.category === categoryQuery);
    }

    return { articles, categories, q, category: categoryQuery };
}

const getDescription = (content: string): string => {
    if (!content) return '';
    const cleaned = content
        .replace(/^#.*$/gm, '')
        .replace(/[*#\[\]()]*/g, '')
        .replace(/\n+/g, ' ')
        .trim();
    return cleaned.slice(0, 160) + (cleaned.length > 160 ? '...' : '');
};

export function meta({ data }: Route.MetaArgs) {
    return [
        { title: data?.q ? `搜索: ${data.q} - 文章专栏` : "文章专栏 - A.T. Field" },
        { name: "description", content: "技术探索、动漫感想与生活日志 - A.T. Field 绝对领域" },
        { property: "og:title", content: "文章专栏 - A.T. Field" },
        { property: "og:type", content: "website" },
    ];
}

export default function ArticlesPage() {
    const { articles, categories, q, category } = useLoaderData<typeof loader>();
    const [searchParams] = useSearchParams();
    const submit = useSubmit();
    const navigation = useNavigation();

    const [searchTerm, setSearchTerm] = useState(q);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [activeFilter, setActiveFilter] = useState(category);
    const listRef = useRef<HTMLDivElement>(null);

    const isSearching = navigation.location && new URLSearchParams(navigation.location.search).has("q");

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const formatDateShort = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric'
        });
    };

    // Debounce search submission
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== q) {
                const isFirstSearch = q === "";
                submit(
                    { q: searchTerm, category: activeFilter },
                    { replace: !isFirstSearch }
                );
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, activeFilter, submit, q]);

    const handleCategoryChange = (newCategory: string) => {
        setActiveFilter(newCategory);
        submit({ q: searchTerm, category: newCategory }, { replace: true });
    };

    // Back to top visibility
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 600);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearSearch = () => {
        setSearchTerm("");
        submit({ q: "", category: activeFilter }, { replace: true });
    };

    const heroArticle = articles[0];
    const gridArticles = articles.slice(1);
    const hasArticles = articles.length > 0;
    const hasSearch = q !== "";

    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A]">
            {/* 动态背景 */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-radial from-indigo-500/5 via-transparent to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-gradient-radial from-violet-500/5 via-transparent to-transparent rounded-full blur-3xl" />
            </div>

            {/* 顶部导航栏 */}
            <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/[0.85] dark:bg-[#0A0A0A]/[0.85] border-b border-black/[0.06] dark:border-white/[0.06]">
                <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-16 h-16 flex items-center justify-between gap-6">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
                            <BookOpen className="w-4.5 h-4.5 text-white" />
                        </div>
                        <span className="font-black text-[15px] tracking-tight text-slate-900 dark:text-white hidden sm:block">
                            文章专栏
                        </span>
                    </Link>

                    {/* 搜索框 */}
                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500">
                                {isSearching ? (
                                    <Loader2 className="w-[18px] h-[18px] animate-spin" />
                                ) : (
                                    <Search className="w-[18px] h-[18px]" />
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder="搜索文章..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-10 py-2.5 bg-slate-100/80 dark:bg-white/[0.06] backdrop-blur-sm rounded-2xl text-[15px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-white/[0.08] transition-all border border-transparent"
                            />
                            {searchTerm && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 文章数量 */}
                    <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Layers className="w-4 h-4" />
                        <span>{articles.length} 篇</span>
                    </div>
                </div>
            </header>

            {/* 主内容区 */}
            <main ref={listRef} className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-10 lg:px-16 py-12 md:py-16">

                {/* 页面标题 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-12"
                >
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
                        {hasSearch ? (
                            <>
                                <span className="text-slate-400 dark:text-slate-500">搜索结果</span>
                            </>
                        ) : (
                            "文章专栏"
                        )}
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium">
                        {hasSearch
                            ? `找到 ${articles.length} 篇与 "${q}" 相关的文章`
                            : "技术探索、动漫感想与生活日志"}
                    </p>
                </motion.div>

                {/* 分类筛选 - 极简胶囊 */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-12 flex flex-wrap gap-2"
                >
                    <AnimatePresence mode="popLayout">
                        {categories.map((cat) => {
                            const isActive = cat === activeFilter;
                            return (
                                <motion.button
                                    key={cat}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleCategoryChange(cat)}
                                    className={`
                                        px-5 py-2.5 rounded-full text-[13px] font-bold tracking-wide transition-all duration-300
                                        ${isActive
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-900/20 dark:shadow-white/20'
                                            : 'bg-white/60 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/[0.1] border border-transparent hover:border-slate-200/50 dark:hover:border-white/10'
                                        }
                                    `}
                                >
                                    {cat === 'all' ? '全部' : cat}
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>

                {/* 文章内容 */}
                <AnimatePresence mode="wait">
                    {hasArticles ? (
                        <motion.div
                            key="articles"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-8"
                        >
                            {/* Hero 文章 - 第一篇大卡片 */}
                            {heroArticle && (
                                <motion.article
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                    className="group relative mb-12"
                                >
                                    <Link
                                        to={`/articles/${heroArticle.slug}`}
                                        className="block relative rounded-[40px] overflow-hidden bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] shadow-xl shadow-black/[0.04] dark:shadow-black/40 hover:shadow-2xl hover:shadow-black/[0.08] dark:hover:shadow-black/60 transition-all duration-500"
                                    >
                                        {/* 封面图 */}
                                        <div className="relative aspect-[21/9] md:aspect-[3/1] overflow-hidden">
                                            <OptimizedImage
                                                src={heroArticle.cover_image || getPlaceholderCover(heroArticle.category)}
                                                alt={heroArticle.title}
                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-out"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                            {/* 分类标签 */}
                                            <div className="absolute top-6 left-6 md:top-8 md:left-8">
                                                <span className="px-4 py-2 backdrop-blur-xl bg-white/20 dark:bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-full border border-white/20">
                                                    {heroArticle.category || '无分类'}
                                                </span>
                                            </div>

                                            {/* 置顶标识 */}
                                            <div className="absolute top-6 right-6 md:top-8 md:right-8">
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-xl bg-indigo-500/90 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                                                    <Sparkles className="w-3 h-3" />
                                                    最新文章
                                                </span>
                                            </div>

                                            {/* 底部信息 */}
                                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12">
                                                <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-4 md:mb-6 leading-tight tracking-tight group-hover:text-indigo-200 transition-colors">
                                                    {heroArticle.title}
                                                </h2>
                                                <p className="text-white/70 text-base md:text-lg mb-6 md:mb-8 max-w-3xl line-clamp-2 md:line-clamp-none">
                                                    {getDescription(heroArticle.summary || heroArticle.content)}
                                                </p>
                                                <div className="flex items-center gap-6 text-white/60 text-[13px] font-medium">
                                                    <span className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDate(heroArticle.created_at)}
                                                    </span>
                                                    <span className="flex items-center gap-2">
                                                        <Eye className="w-4 h-4" />
                                                        {heroArticle.views.toLocaleString()}
                                                    </span>
                                                    <span className="flex items-center gap-2">
                                                        <Heart className="w-4 h-4" />
                                                        {heroArticle.likes.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.article>
                            )}

                            {/* 文章网格 */}
                            {gridArticles.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                                    {gridArticles.map((article, index) => (
                                        <motion.article
                                            key={article.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.6,
                                                delay: 0.1 + index * 0.05,
                                                ease: [0.16, 1, 0.3, 1]
                                            }}
                                            className="group"
                                        >
                                            <Link
                                                to={`/articles/${article.slug}`}
                                                className="block h-full rounded-[28px] overflow-hidden bg-white dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] shadow-lg shadow-black/[0.03] dark:shadow-black/30 hover:shadow-xl hover:shadow-black/[0.06] dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-500"
                                            >
                                                {/* 封面 */}
                                                <div className="relative aspect-[16/10] overflow-hidden">
                                                    <OptimizedImage
                                                        src={article.cover_image || getPlaceholderCover(article.category)}
                                                        alt={article.title}
                                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                                    {/* 分类 */}
                                                    <div className="absolute top-4 left-4">
                                                        <span className="px-3 py-1 backdrop-blur-xl bg-white/20 dark:bg-black/30 text-white text-[10px] font-black uppercase tracking-[0.1em] rounded-full border border-white/20">
                                                            {article.category || '无分类'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* 内容 */}
                                                <div className="p-6 md:p-7 flex flex-col h-[calc(100%-aspect-ratio(16/10))]">
                                                    {/* 日期 */}
                                                    <div className="flex items-center gap-2 mb-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {formatDate(article.created_at)}
                                                    </div>

                                                    {/* 标题 */}
                                                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-3 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                                        {article.title}
                                                    </h3>

                                                    {/* 摘要 */}
                                                    <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed mb-6 line-clamp-3 flex-1">
                                                        {getDescription(article.summary || article.content)}
                                                    </p>

                                                    {/* 底部 */}
                                                    <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-white/[0.06]">
                                                        <div className="flex items-center gap-5 text-[12px] text-slate-400 dark:text-slate-500 font-medium">
                                                            <span className="flex items-center gap-1.5">
                                                                <Eye className="w-4 h-4 opacity-60" />
                                                                {article.views.toLocaleString()}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <Heart className="w-4 h-4 opacity-60" />
                                                                {article.likes.toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <span className="flex items-center gap-1.5 text-[12px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider group-hover:gap-2.5 transition-all">
                                                            阅读
                                                            <ArrowRight className="w-3.5 h-3.5" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.article>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        /* 空状态 */
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center py-32 md:py-40 text-center"
                        >
                            {/* 空状态图标 */}
                            <div className="relative mb-10">
                                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/[0.06] dark:to-white/[0.03] flex items-center justify-center">
                                    <Search className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-indigo-400" />
                                </div>
                            </div>

                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
                                {hasSearch ? '未找到相关文章' : '专栏空空如也'}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mb-10">
                                {hasSearch
                                    ? `没有找到与 "${q}" 相关的文章，试试其他关键词吧`
                                    : '这里还没有文章，敬请期待未来的创作吧'}
                            </p>

                            {hasSearch && (
                                <button
                                    onClick={clearSearch}
                                    className="px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-[14px] font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                                >
                                    清除搜索
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* 返回顶部按钮 */}
            <AnimatePresence>
                {showBackToTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={scrollToTop}
                        className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-black/20 dark:shadow-white/20 flex items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}

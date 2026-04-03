/**
 * 文章列表页 - 使用主题系统
 */

import { Link, useLoaderData, useSearchParams, useSubmit, useNavigation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Eye, Heart, ArrowRight, Search, Loader2, BookOpen, Layers, X } from "lucide-react";
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

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== q) {
                const isFirstSearch = q === "";
                submit({ q: searchTerm, category: activeFilter }, { replace: !isFirstSearch });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, activeFilter, submit, q]);

    const handleCategoryChange = (newCategory: string) => {
        setActiveFilter(newCategory);
        submit({ q: searchTerm, category: newCategory }, { replace: true });
    };

    useEffect(() => {
        const handleScroll = () => setShowBackToTop(window.scrollY > 600);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    const clearSearch = () => {
        setSearchTerm("");
        submit({ q: "", category: activeFilter }, { replace: true });
    };

    const heroArticle = articles[0];
    const gridArticles = articles.slice(1);
    const hasArticles = articles.length > 0;
    const hasSearch = q !== "";

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            {/* 顶部导航栏 */}
            <header className="sticky top-0 z-50 backdrop-blur-2xl border-b" style={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
                <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-16 h-16 flex items-center justify-between gap-6">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary-start), var(--color-primary-end))' }}>
                            <BookOpen className="w-4.5 h-4.5 text-white" />
                        </div>
                        <span className="font-black text-[15px] tracking-tight hidden sm:block">
                            文章专栏
                        </span>
                    </Link>

                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }}>
                                {isSearching ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Search className="w-[18px] h-[18px]" />}
                            </div>
                            <input
                                type="text"
                                placeholder="搜索文章..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-10 py-2.5 rounded-2xl text-[15px] placeholder-slate-400 focus:outline-none focus:ring-2 transition-all border"
                                style={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                            />
                            {searchTerm && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:opacity-70 transition-all"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Layers className="w-4 h-4" />
                        <span>{articles.length} 篇</span>
                    </div>
                </div>
            </header>

            {/* 主内容区 */}
            <main ref={listRef} className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-16 py-12 md:py-16">

                {/* 页面标题 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-4">
                        {hasSearch ? <span style={{ color: 'var(--text-secondary)' }}>搜索结果</span> : "文章专栏"}
                    </h1>
                    <p className="text-lg md:text-xl" style={{ color: 'var(--text-secondary)' }}>
                        {hasSearch ? `找到 ${articles.length} 篇与 "${q}" 相关的文章` : "技术探索、动漫感想与生活日志"}
                    </p>
                </motion.div>

                {/* 分类筛选 */}
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
                                    className={`px-5 py-2.5 rounded-full text-[13px] font-bold tracking-wide transition-all duration-300 border ${isActive ? 'border-[var(--color-primary-start)]' : 'border-transparent'}`}
                                    style={isActive
                                        ? { backgroundColor: 'var(--color-primary-start)', color: 'white' }
                                        : { backgroundColor: 'var(--glass-bg)', color: 'var(--text-secondary)' }
                                    }
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
                        <motion.div key="articles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                            {/* Hero 文章 */}
                            {heroArticle && (
                                <motion.article
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8 }}
                                    className="group mb-12"
                                >
                                    <Link
                                        to={`/articles/${heroArticle.slug}`}
                                        className="block rounded-[32px] overflow-hidden glass-card"
                                    >
                                        <div className="relative aspect-[21/9] md:aspect-[3/1] overflow-hidden">
                                            <OptimizedImage
                                                src={heroArticle.cover_image || getPlaceholderCover(heroArticle.category)}
                                                alt={heroArticle.title}
                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                            <div className="absolute top-6 left-6 md:top-8 md:left-8">
                                                <span className="px-4 py-2 text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-full border border-white/30 backdrop-blur-xl" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                                    {heroArticle.category || '无分类'}
                                                </span>
                                            </div>

                                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12">
                                                <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-4 md:mb-6 leading-tight tracking-tight group-hover:opacity-80 transition-opacity">
                                                    {heroArticle.title}
                                                </h2>
                                                <p className="text-white/70 text-base md:text-lg mb-6 md:mb-8 max-w-3xl line-clamp-2">
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
                                            transition={{ duration: 0.6, delay: 0.1 + index * 0.05 }}
                                            className="group"
                                        >
                                            <Link
                                                to={`/articles/${article.slug}`}
                                                className="block h-full rounded-[28px] overflow-hidden glass-card"
                                            >
                                                <div className="relative aspect-[16/10] overflow-hidden">
                                                    <OptimizedImage
                                                        src={article.cover_image || getPlaceholderCover(article.category)}
                                                        alt={article.title}
                                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                    <div className="absolute top-4 left-4">
                                                        <span className="px-3 py-1 text-white text-[10px] font-black uppercase tracking-[0.1em] rounded-full border border-white/20 backdrop-blur-xl" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                                            {article.category || '无分类'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="p-6 md:p-7 flex flex-col">
                                                    <div className="flex items-center gap-2 mb-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted, var(--text-secondary))' }}>
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {formatDate(article.created_at)}
                                                    </div>

                                                    <h3 className="text-lg md:text-xl font-black mb-3 leading-snug line-clamp-2 group-hover:opacity-70 transition-opacity">
                                                        {article.title}
                                                    </h3>

                                                    <p className="text-[14px] mb-6 leading-relaxed line-clamp-3 flex-1" style={{ color: 'var(--text-secondary)' }}>
                                                        {getDescription(article.summary || article.content)}
                                                    </p>

                                                    <div className="flex items-center justify-between pt-5 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                                                        <div className="flex items-center gap-5 text-[12px]" style={{ color: 'var(--text-muted, var(--text-secondary))' }}>
                                                            <span className="flex items-center gap-1.5">
                                                                <Eye className="w-4 h-4 opacity-60" />
                                                                {article.views.toLocaleString()}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <Heart className="w-4 h-4 opacity-60" />
                                                                {article.likes.toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider group-hover:gap-2.5 transition-all" style={{ color: 'var(--color-primary-start)' }}>
                                                            阅读 <ArrowRight className="w-3.5 h-3.5" />
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
                            <div className="w-28 h-28 rounded-full flex items-center justify-center mb-10 glass-card">
                                <Search className="w-12 h-12" style={{ color: 'var(--text-secondary)' }} />
                            </div>

                            <h3 className="text-3xl font-black mb-3">{
                                hasSearch ? '未找到相关文章' : '专栏空空如也'
                            }</h3>
                            <p className="max-w-md mb-10" style={{ color: 'var(--text-secondary)' }}>
                                {hasSearch ? `没有找到与 "${q}" 相关的文章，试试其他关键词吧` : '这里还没有文章，敬请期待未来的创作吧'}
                            </p>

                            {hasSearch && (
                                <button
                                    onClick={clearSearch}
                                    className="px-8 py-3.5 rounded-full text-[14px] font-bold transition-colors"
                                    style={{ backgroundColor: 'var(--color-primary-start)', color: 'white' }}
                                >
                                    清除搜索
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* 返回顶部 */}
            <AnimatePresence>
                {showBackToTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={scrollToTop}
                        className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-xl hover:opacity-80 transition-all"
                        style={{ backgroundColor: 'var(--color-primary-start)', color: 'white' }}
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

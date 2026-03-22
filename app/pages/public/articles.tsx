/**
 * 文章列表页
 */

import { Link, useLoaderData, useSearchParams, useSubmit, Form, useNavigation } from "react-router";
import { motion } from "framer-motion";
import { Calendar, Eye, Heart, ArrowRight, Search, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Route } from "./+types/articles";
import { getCategoryColor } from "~/utils/categoryColor";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";

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
    const category = url.searchParams.get("category") || "all";

    // 构建查询
    let sql = `
        SELECT id, slug, title, content, category, cover_image, tags, views, likes, created_at
        FROM articles 
        WHERE (status = 'published' OR status IS NULL)
    `;
    const params: any[] = [];

    if (q) {
        sql += ` AND (title LIKE ? OR content LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`);
    }

    if (category !== "all") {
        sql += ` AND category = ?`;
        params.push(category);
    }

    sql += ` ORDER BY created_at DESC LIMIT 50`; // 限制 50 篇，暂不分页以简化

    const result = await db.prepare(sql).bind(...params).all();

    //获取所有分类（用于筛选）
    const categoriesResult = await db.prepare("SELECT DISTINCT category FROM articles WHERE category IS NOT NULL").all();
    const categories = ['all', ...(categoriesResult.results || []).map((c: any) => c.category)];

    return {
        articles: (result.results || []) as unknown as Article[],
        categories,
        q,
        category
    };
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
        <div className="w-full max-w-[1400px] mx-auto pt-safe pb-24 md:pt-32 md:pb-32 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
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

                {/* 文章列表 - Apple News 阅读流排版 */}
                {articles.length > 0 ? (
                    <div className="flex flex-col gap-6 md:gap-10 max-w-4xl mx-auto">
                        {articles.map((article, index) => (
                            <motion.article
                                key={article.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.15 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                                className="group relative flex flex-col md:flex-row gap-5 md:gap-8 items-start justify-between py-6 md:py-8 border-b border-slate-200 dark:border-slate-800 last:border-0"
                            >
                                {/* 文章主信息区 */}
                                <div className="flex-1 flex flex-col w-full order-2 md:order-1 pt-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md text-white ${getCategoryColor(article.category)}`}>
                                            {article.category || '未分类'}
                                        </span>
                                        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs font-medium font-mono">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(article.created_at)}
                                        </div>
                                    </div>
                                    
                                    <Link to={`/articles/${article.slug}`} className="block">
                                        <h3 className="text-xl md:text-2xl leading-snug font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {article.title}
                                        </h3>
                                    </Link>
                                    
                                    <p className="text-sm md:text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 md:line-clamp-3 mb-5">
                                        {getDescription(article.content)}
                                    </p>

                                    <div className="flex items-center gap-5 mt-auto text-xs md:text-sm text-slate-400 dark:text-slate-500 font-medium font-mono">
                                        <div className="flex items-center gap-1.5 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                                            <Eye className="w-4 h-4" />
                                            {article.views}
                                        </div>
                                        <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                                            <Heart className="w-4 h-4" />
                                            {article.likes}
                                        </div>
                                        <Link 
                                            to={`/articles/${article.slug}`} 
                                            className="ml-auto flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold hover:gap-2 transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
                                        >
                                            阅读全文
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>

                                {/* 右侧/上方 缩略海报流 */}
                                {article.cover_image && (
                                    <Link to={`/articles/${article.slug}`} className="block w-full md:w-[280px] shrink-0 order-1 md:order-2">
                                        <div className="aspect-[16/9] md:aspect-[4/3] rounded-[20px] overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-transparent dark:border-white/5 transition-all duration-500">
                                            <OptimizedImage
                                                src={article.cover_image}
                                                alt={article.title}
                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                                            />
                                        </div>
                                    </Link>
                                )}
                            </motion.article>
                        ))}
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

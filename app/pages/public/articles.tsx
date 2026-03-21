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
                {/* 标题区域 - Apple HIG 纯黑白超大字重 */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-10 md:mb-16"
                >
                    <h1 className="text-5xl md:text-7xl font-sans font-black tracking-tight text-slate-900 dark:text-white mb-3">
                        Articles
                    </h1>
                    <p className="text-xl md:text-2xl font-medium text-slate-400 dark:text-slate-500 tracking-tight">
                        技术探索、动漫感想与生活志
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

                {/* 文章列表 - Apple 巨幕卡片流 */}
                {articles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {articles.map((article, index) => (
                            <motion.article
                                key={article.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.15 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                                className="group relative flex flex-col bg-white dark:bg-slate-900/40 rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 dark:border-white/5"
                            >
                                {/* 巨幕封套 */}
                                <div className="aspect-[4/3] relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    {article.cover_image ? (
                                        <OptimizedImage
                                            src={article.cover_image}
                                            alt={article.title}
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                                        />
                                    ) : (
                                        <div className={`w-full h-full bg-gradient-to-br ${getCategoryColor(article.category)} opacity-30 flex items-center justify-center`}>
                                            <span className="text-5xl opacity-50">📝</span>
                                        </div>
                                    )}
                                    
                                    {/* 内侧顶部磨砂暗角 */}
                                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
                                    
                                    {/* 角标 */}
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3.5 py-1.5 rounded-full text-[11px] font-bold text-white uppercase tracking-wider bg-black/30 backdrop-blur-md border border-white/10">
                                            {article.category || '未分类'}
                                        </span>
                                    </div>
                                </div>

                                {/* 纯净信息面板 */}
                                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                                    <div className="mb-4">
                                        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800 dark:text-white mb-3 line-clamp-2 leading-snug group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                                            <Link to={`/articles/${article.slug}`} className="before:absolute before:inset-0">
                                                {article.title}
                                            </Link>
                                        </h2>
                                        <p className="text-[15px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-normal">
                                            {getDescription(article.content)}
                                        </p>
                                    </div>

                                    {/* 细节点微元 */}
                                    <div className="flex items-center justify-between text-[13px] text-slate-400 font-medium">
                                        <span>{formatDate(article.created_at)}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1.5">
                                                <Eye className="w-4 h-4 opacity-70" />
                                                {article.views || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
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
                        <h3 className="text-2xl font-bold text-slate-700 dark:text-white mb-2">No Articles Found</h3>
                        <p className="text-slate-500 max-w-sm mb-8">
                            {q ? '未能找到符合搜索词的记录。探索一下其他领域的文章吧？' : '这里目前像宇宙一样空旷...'}
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

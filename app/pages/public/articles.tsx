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
        <div className="w-full md:container mx-auto md:px-4 py-8 md:py-20">
            <div className="max-w-6xl mx-auto">
                {/* 标题区域 */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12 md:mb-16 px-4 md:px-0"
                >
                    <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
                        文章归档
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">记录技术探索、动漫感想和生活随笔</p>
                </motion.div>

                {/* 搜索和筛选 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-4 rounded-none md:rounded-2xl border-x-0 md:border-x mb-8"
                >
                    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center px-4 md:px-0">
                        {/* 搜索框 */}
                        <div className="relative flex-1 shrink-0">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            </div>
                            <input
                                type="text"
                                placeholder="搜索文章..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700/50 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-start transition-all"
                            />
                        </div>

                        {/* 分类筛选 - 移动端横滑 */}
                        <div className="flex overflow-x-auto hide-scrollbar snap-x gap-2 pb-1 md:pb-0 md:flex-wrap">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryChange(cat)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${category === cat
                                        ? 'bg-primary-start text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {cat === 'all' ? '全部' : cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* 文章列表 */}
                {articles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 md:gap-8 bg-slate-200/50 dark:bg-slate-800/50 md:bg-transparent pb-4 md:pb-0">
                        {articles.map((article, index) => (
                            <motion.article
                                key={article.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + index * 0.05 }}
                                whileHover={{ y: -5 }}
                                className="glass-card rounded-none md:rounded-2xl border-x-0 md:border-x overflow-hidden group shadow-none md:shadow-lg"
                            >
                                {/* 封面图 */}
                                <div className="aspect-video relative overflow-hidden bg-slate-200 dark:bg-slate-700">
                                    {article.cover_image ? (
                                        <OptimizedImage
                                            src={article.cover_image}
                                            alt={article.title}
                                            aspectRatio="video"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className={`w-full h-full bg-gradient-to-br ${getCategoryColor(article.category)} opacity-50 flex items-center justify-center`}>
                                            <span className="text-4xl">📝</span>
                                        </div>
                                    )}
                                    {/* 分类标签 */}
                                    <div className="absolute top-3 left-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getCategoryColor(article.category)}`}>
                                            {article.category || '未分类'}
                                        </span>
                                    </div>
                                </div>

                                {/* 内容 */}
                                <div className="p-5">
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-start transition-colors">
                                        <Link to={`/articles/${article.slug}`}>
                                            {article.title}
                                        </Link>
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                                        {getDescription(article.content)}
                                    </p>

                                    {/* 元信息 */}
                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(article.created_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-3.5 h-3.5" />
                                                {article.views || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Heart className="w-3.5 h-3.5" />
                                                {article.likes || 0}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 阅读更多 */}
                                    <Link
                                        to={`/articles/${article.slug}`}
                                        className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-start hover:gap-3 transition-all"
                                    >
                                        阅读全文 <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center py-20"
                    >
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                            没有找到文章
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            {q ? '没有找到匹配的文章，换个关键词试试？' : '还没有文章发布'}
                        </p>
                        {!q && (
                            <Link
                                to="/admin/article/new"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-start text-white rounded-xl hover:bg-primary-end transition-colors"
                            >
                                创建文章 <ArrowRight className="w-4 h-4" />
                            </Link>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}

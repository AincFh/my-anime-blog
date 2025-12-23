/**
 * 文章列表页
 */

import { Link, useLoaderData } from "react-router";
import { motion } from "framer-motion";
import { Calendar, Eye, Heart, Tag, ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import type { Route } from "./+types/articles";

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
    // 移除 markdown 标题和格式
    const cleaned = content
        .replace(/^#.*$/gm, '')
        .replace(/[\*\#\[\]\(\)]/g, '')
        .replace(/\n+/g, ' ')
        .trim();
    return cleaned.slice(0, 120) + (cleaned.length > 120 ? '...' : '');
};

export async function loader({ context }: Route.LoaderArgs) {
    const db = context.cloudflare.env.anime_db;

    const result = await db
        .prepare(`
            SELECT id, slug, title, content, category, cover_image, tags, views, likes, created_at
            FROM articles 
            WHERE status = 'published' OR status IS NULL
            ORDER BY created_at DESC
        `)
        .all();

    return {
        articles: (result.results || []) as Article[],
    };
}

export default function ArticlesPage() {
    const { articles } = useLoaderData<typeof loader>();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = ['all', ...new Set(articles.map(a => a.category).filter(Boolean))];

    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.content?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            '技术': 'from-blue-500 to-cyan-500',
            '动漫': 'from-pink-500 to-rose-500',
            '游戏': 'from-purple-500 to-indigo-500',
            '随笔': 'from-amber-500 to-orange-500',
            '公告': 'from-green-500 to-emerald-500',
        };
        return colors[category] || 'from-slate-500 to-gray-500';
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* 标题区域 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">
                        文章归档
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                        记录技术探索、动漫感想和生活随笔
                    </p>
                </motion.div>

                {/* 搜索和筛选 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-4 rounded-2xl mb-8"
                >
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* 搜索框 */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="搜索文章..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700/50 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-start"
                            />
                        </div>

                        {/* 分类筛选 */}
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat
                                        ? 'bg-primary-start text-white'
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
                {filteredArticles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredArticles.map((article, index) => (
                            <motion.article
                                key={article.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + index * 0.05 }}
                                whileHover={{ y: -5 }}
                                className="glass-card rounded-2xl overflow-hidden group"
                            >
                                {/* 封面图 */}
                                <div className="aspect-video relative overflow-hidden bg-slate-200 dark:bg-slate-700">
                                    {article.cover_image ? (
                                        <img
                                            src={article.cover_image}
                                            alt={article.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
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
                            还没有文章
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            {searchTerm ? '没有找到匹配的文章' : '去后台创建第一篇文章吧！'}
                        </p>
                        {!searchTerm && (
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

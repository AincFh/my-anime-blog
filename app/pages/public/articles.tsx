/**
 * 文章列表页
 */

import { Link, useLoaderData, useSearchParams, useSubmit, Form, useNavigation } from "react-router";
import { motion } from "framer-motion";
import { Calendar, Eye, Heart, ArrowRight, Search, Loader2, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import type { Route } from "./+types/articles";
import { getCategoryColor } from "~/utils/categoryColor";
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
    const { fetchNotionArticles } = await import("~/services/notion.server.ts");
    const { getDB } = await import("~/utils/db");
    const db = getDB(context);

    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";
    const categoryQuery = url.searchParams.get("category") || "all";

    let articles: Article[] = [];
    let categories: string[] = ['all'];

    try {
        // 1. 尝试从 Notion 获取数据
        const notionArticles = await fetchNotionArticles(context);
        
        if (notionArticles.length > 0) {
            // 转换为内部接口结构
            articles = notionArticles.map(as => ({
                id: parseInt(as.id.replace(/-/g, '').slice(0, 8), 16), // 临时转换 ID
                slug: as.slug,
                title: as.title,
                content: as.summary, // 列表页显示摘要
                category: as.category,
                cover_image: as.cover_image,
                tags: JSON.stringify(as.tags),
                views: 0, // Notion 暂无原生点击量，设为 0
                likes: 0,
                created_at: as.created_at
            }));

            // 提取分类 (过滤空值)
            const uniqueCats = Array.from(new Set(notionArticles.map(a => a.category).filter(Boolean)));
            categories = ['all', ...uniqueCats];
        } else {
            throw new Error("No articles from Notion");
        }
    } catch (error) {
        console.warn("Falling back to D1 Database:", error);
        
        // 2. 降级逻辑：从 D1 读取 (含评论数)
        let sql = `
            SELECT a.id, a.slug, a.title, a.summary as content, a.category, a.cover_image, a.tags, a.views, a.likes, a.created_at,
                   (SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id AND c.status = 'approved') as comment_count
            FROM articles a
        `;
        const params: any[] = [];
        const whereClauses: string[] = ["(a.status = 'published' OR a.status IS NULL)"];

        if (q) {
            sql = `
                SELECT a.id, a.slug, a.title, a.summary as content, a.category, a.cover_image, a.tags, a.views, a.likes, a.created_at,
                       (SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id AND c.status = 'approved') as comment_count
                FROM articles a
                JOIN articles_fts f ON a.id = f.rowid
            `;
            whereClauses.push(`articles_fts MATCH ?`);
            params.push(q);
        }

        if (categoryQuery !== "all") {
            whereClauses.push(`a.category = ?`);
            params.push(categoryQuery);
        }

        sql += ` WHERE ` + whereClauses.join(" AND ") + ` ORDER BY a.created_at DESC LIMIT 50`;
        const result = await db.prepare(sql).bind(...params).all();
        articles = (result.results || []) as unknown as Article[];

        const categoriesResult = await db.prepare("SELECT DISTINCT category FROM articles WHERE category IS NOT NULL AND category != '' AND category != 'null' AND category != 'undefined'").all();
        categories = ['all', ...(categoriesResult.results || []).map((c: any) => c.category).filter(Boolean)];
    }

    // 处理搜索过滤 (如果是从 Notion 获取的全量，需要在内存中过滤)
    if (q && articles.length > 0) {
        const lowerQ = q.toLowerCase();
        articles = articles.filter(a => 
            a.title.toLowerCase().includes(lowerQ) || 
            a.content.toLowerCase().includes(lowerQ)
        );
    }

    // 处理分类过滤
    if (categoryQuery !== 'all') {
        articles = articles.filter(a => a.category === categoryQuery);
    }

    return {
        articles,
        categories,
        q,
        category: categoryQuery
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

                {/* 文章列表 - 高奢非对称网格 (Asymmetric Premium Grid) */}
                {articles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                        {articles.map((article, index) => {
                            const displayCover = article.cover_image || getPlaceholderCover(article.category);
                            
                            return (
                                <motion.article
                                    key={article.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ duration: 0.8, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                                    className="group relative flex flex-col bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[32px] overflow-hidden border border-slate-200/50 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500"
                                >
                                    {/* 封面容器 - 沉浸式超大圆角 */}
                                    <Link to={`/articles/${article.slug}`} className="block relative aspect-[16/10] overflow-hidden">
                                        <OptimizedImage
                                            src={displayCover}
                                            alt={article.title}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000 ease-out"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        
                                        {/* 分类标签毛玻璃化 */}
                                        <div className="absolute top-4 left-4">
                                            <span className={`px-3 py-1.5 backdrop-blur-md bg-white/20 dark:bg-black/20 text-[10px] font-black uppercase tracking-[0.1em] rounded-full text-white border border-white/20`}>
                                                {article.category || '无分类'}
                                            </span>
                                        </div>
                                    </Link>

                                    {/* 内容区 - 呼吸感排版 */}
                                    <div className="p-6 md:p-8 flex flex-col flex-1">
                                        <div className="flex items-center gap-2 mb-4 text-slate-400 dark:text-slate-500 text-[11px] font-black tracking-widest uppercase">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(article.created_at)}
                                        </div>

                                        <Link to={`/articles/${article.slug}`} className="block mb-4">
                                            <h3 className="text-xl md:text-2xl leading-[1.3] font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                                {article.title}
                                            </h3>
                                        </Link>

                                        <p className="text-sm md:text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 mb-6 font-medium">
                                            {getDescription(article.content)}
                                        </p>

                                        {/* 底部元数据 */}
                                        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-[12px] text-slate-400 dark:text-slate-500 font-black tracking-tighter">
                                                <div className="flex items-center gap-1.5">
                                                    <Eye className="w-4 h-4 opacity-50" />
                                                    {article.views}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Heart className="w-4 h-4 opacity-50" />
                                                    {article.likes}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <MessageSquare className="w-4 h-4 opacity-50" />
                                                    {article.comment_count || 0}
                                                </div>
                                            </div>

                                            <Link 
                                                to={`/articles/${article.slug}`} 
                                                className="group/btn flex items-center gap-1 text-[13px] text-slate-900 dark:text-white font-black antialiased uppercase tracking-widest"
                                            >
                                                READ
                                                <ArrowRight className="w-4 h-4 ml-0.5 group-hover/btn:translate-x-1 transition-transform" />
                                            </Link>
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

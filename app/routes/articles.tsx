
import { ResponsiveContainer } from "~/components/ui/ResponsiveComponents";
import { motion } from "framer-motion";
import { Link } from "react-router";

// 模拟文章数据
const MOCK_ARTICLES = [
    {
        id: 1,
        title: "新世纪福音战士：终 - 终结与新生",
        excerpt: "再见了，所有的福音战士。这部跨越25年的神作终于迎来了它的终章...",
        cover: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800",
        date: "2023-12-01",
        category: "影评",
        tags: ["EVA", "动漫", "神作"]
    },
    {
        id: 2,
        title: "赛博朋克边缘行者：夜之城的悲歌",
        excerpt: "在夜之城，没有活着的传奇。大卫·马丁内斯的故事让我们看到了赛博朋克世界...",
        cover: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=800",
        date: "2023-11-25",
        category: "推荐",
        tags: ["Cyberpunk", "Netflix", "扳机社"]
    },
    {
        id: 3,
        title: "葬送的芙莉莲：时间与记忆的旅程",
        excerpt: "勇者逝去后的世界，精灵魔法使芙莉莲重新踏上旅途，去了解人类...",
        cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
        date: "2023-11-15",
        category: "感悟",
        tags: ["治愈", "奇幻", "冒险"]
    },
    {
        id: 4,
        title: "进击的巨人：自由的代价",
        excerpt: "海的那边是敌人。艾伦·耶格尔为了追寻自由，最终付出了怎样的代价...",
        cover: "https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=800",
        date: "2023-11-05",
        category: "深度",
        tags: ["巨人", "热血", "战争"]
    },
    {
        id: 5,
        title: "鬼灭之刃：无限列车篇",
        excerpt: "大哥没有输！炼狱杏寿郎用生命守护了整列火车的乘客...",
        cover: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800",
        date: "2023-10-28",
        category: "热血",
        tags: ["鬼灭", "ufotable", "战斗"]
    },
    {
        id: 6,
        title: "间谍过家家：优雅的谎言",
        excerpt: "为了世界和平，间谍、杀手和超能力者组成了临时家庭...",
        cover: "https://images.unsplash.com/photo-1620503374956-c942862f0372?q=80&w=800",
        date: "2023-10-15",
        category: "日常",
        tags: ["搞笑", "家庭", "治愈"]
    }
];

export default function Articles() {
    return (
        <ResponsiveContainer maxWidth="lg" className="py-4 md:py-8">
            {/* 页面标题区 */}
            <div className="mb-12 text-center">
                <motion.h1
                    className="text-4xl md:text-5xl font-display font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary-start to-primary-end"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    文章列表
                </motion.h1>
                <motion.p
                    className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    记录动漫观看心得，分享二次元生活点滴。这里有深度解析，也有随笔吐槽。
                </motion.p>
            </div>

            {/* 文章网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {MOCK_ARTICLES.map((article, index) => (
                    <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Link to={`/articles/${article.id}`} className="block h-full group">
                            <div className="glass-card h-full flex flex-col overflow-hidden hover:shadow-2xl transition-all duration-300 border border-white/20 dark:border-white/10">
                                {/* 封面图 */}
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={article.cover}
                                        alt={article.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 text-xs font-bold text-white bg-black/50 backdrop-blur-md rounded-full border border-white/20">
                                            {article.category}
                                        </span>
                                    </div>
                                </div>

                                {/* 内容区 */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                                        <span>{article.date}</span>
                                        <span>•</span>
                                        <div className="flex gap-1">
                                            {article.tags.map(tag => (
                                                <span key={tag} className="text-primary-start">#{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold mb-3 text-slate-800 dark:text-white group-hover:text-primary-start transition-colors line-clamp-2">
                                        {article.title}
                                    </h2>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 mb-4 flex-1">
                                        {article.excerpt}
                                    </p>
                                    <div className="flex items-center text-primary-start text-sm font-medium group-hover:translate-x-1 transition-transform">
                                        阅读全文 <span className="ml-1">→</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </ResponsiveContainer>
    );
}
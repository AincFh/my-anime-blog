import { motion } from "framer-motion";
import { GlassCard } from "~/components/ui/layout/GlassCard";

interface AnimeCardProps {
    id: number;
    title: string;
    cover_url?: string;
    status: "watching" | "completed" | "dropped" | "plan";
    progress?: string;
    rating?: number;
    review?: string;
}

const statusConfig = {
    watching: { label: "在看", color: "text-blue-400", bgColor: "bg-blue-500/20" },
    completed: { label: "看过", color: "text-green-400", bgColor: "bg-green-500/20" },
    dropped: { label: "弃番", color: "text-gray-400", bgColor: "bg-gray-500/20" },
    plan: { label: "想看", color: "text-purple-400", bgColor: "bg-purple-500/20" },
};

export function AnimeCard({ title, cover_url, status, progress, rating, review }: AnimeCardProps) {
    const config = statusConfig[status];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.3 }}
        >
            <GlassCard className="overflow-hidden group">
                {/* 封面图片 */}
                <div className="relative h-64 bg-gradient-to-br from-purple-900/30 to-pink-900/30 overflow-hidden">
                    {cover_url ? (
                        <img
                            src={cover_url}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">
                            🎬
                        </div>
                    )}

                    {/* 状态标签 */}
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full ${config.bgColor} backdrop-blur-sm`}>
                        <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
                    </div>

                    {/* 评分（如果有） */}
                    {rating && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-yellow-500/20 backdrop-blur-sm px-3 py-1 rounded-full">
                            <span className="text-yellow-400 text-sm">★</span>
                            <span className="text-yellow-400 text-sm font-bold">{rating}/10</span>
                        </div>
                    )}
                </div>

                {/* 内容区 */}
                <div className="p-5">
                    <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-pink-400 transition-colors">
                        {title}
                    </h3>

                    {progress && (
                        <p className="text-sm text-gray-400 mb-2">
                            进度: <span className="text-white">{progress}</span>
                        </p>
                    )}

                    {review && (
                        <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">
                            {review}
                        </p>
                    )}
                </div>
            </GlassCard>
        </motion.div>
    );
}

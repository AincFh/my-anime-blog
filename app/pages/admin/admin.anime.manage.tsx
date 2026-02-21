import { useLoaderData, Form, useNavigation, useActionData, useSubmit, redirect } from "react-router";
import type { Route } from "./+types/admin.anime.manage";
import { motion, AnimatePresence } from "framer-motion";
import { getSessionId } from "~/utils/auth";
import { useState, useEffect, useCallback } from "react";
import { RadarChart } from "~/components/system/RadarChart";
import { QuickSyncButton } from "~/components/admin/QuickSyncButton";
import { Plus, Search, Edit2, Trash2, X, Link as LinkIcon, Star, Filter, Heart, PlayCircle, Clock, Loader2, Calendar, Film } from "lucide-react";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import { toast } from "~/components/ui/Toast";
import { confirmModal } from "~/components/ui/Modal";

// Bangumi 搜索结果类型
interface BangumiResult {
    id: number;
    name: string;
    name_cn: string;
    images?: {
        large?: string;
        common?: string;
        medium?: string;
        small?: string;
    };
    summary?: string;
    air_date?: string;
    rating?: {
        score: number;
        total: number;
        rank?: number;
    };
    eps_count?: number;
}

export async function loader({ request, context }: Route.LoaderArgs) {
    const sessionId = getSessionId(request);
    if (!sessionId) {
        throw redirect("/admin/login");
    }

    const { anime_db } = context.cloudflare.env;

    try {
        const { results } = await anime_db
            .prepare("SELECT * FROM animes ORDER BY created_at DESC")
            .all();

        return { animes: results || [] };
    } catch (error) {
        console.error("Failed to fetch animes:", error);
        return { animes: [] };
    }
}

export async function action({ request, context }: Route.ActionArgs) {
    const sessionId = getSessionId(request);
    if (!sessionId) {
        throw redirect("/admin/login");
    }

    const { anime_db } = context.cloudflare.env;

    try {
        const formData = await request.formData();
        const action = formData.get("_action") as string;

        if (action === "create") {
            const title = formData.get("title") as string;
            const cover_url = formData.get("cover_url") as string;
            const status = formData.get("status") as string;
            const progress = formData.get("progress") as string;
            const rating = formData.get("rating") ? parseInt(formData.get("rating") as string) : null;
            const review = formData.get("review") as string;
            const rating_radar = formData.get("rating_radar") as string;
            const radarData = rating_radar ? JSON.parse(rating_radar) : null;

            // Bangumi 扩展字段
            const bangumi_id = formData.get("bangumi_id") ? parseInt(formData.get("bangumi_id") as string) : null;
            const name_cn = formData.get("name_cn") as string;
            const name_jp = formData.get("name_jp") as string;
            const summary = formData.get("summary") as string;
            const air_date = formData.get("air_date") as string;
            const total_episodes = formData.get("total_episodes") ? parseInt(formData.get("total_episodes") as string) : null;
            const bangumi_score = formData.get("bangumi_score") ? parseFloat(formData.get("bangumi_score") as string) : null;
            const studio = formData.get("studio") as string;

            await anime_db
                .prepare(
                    `INSERT INTO animes (title, cover_url, status, progress, rating, rating_radar, review,
                     bangumi_id, name_cn, name_jp, summary, air_date, total_episodes, bangumi_score, studio)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                )
                .bind(
                    title,
                    cover_url || null,
                    status,
                    progress || null,
                    rating,
                    radarData ? JSON.stringify(radarData) : null,
                    review || null,
                    bangumi_id,
                    name_cn || null,
                    name_jp || null,
                    summary || null,
                    air_date || null,
                    total_episodes,
                    bangumi_score,
                    studio || null
                )
                .run();

            return { success: true };
        } else if (action === "delete") {
            const id = formData.get("id") as string;
            await anime_db
                .prepare("DELETE FROM animes WHERE id = ?")
                .bind(id)
                .run();

            return { success: true };
        }

        return { success: false };
    } catch (error) {
        console.error("Anime action error:", error);
        return { success: false, error: "操作失败" };
    }
}

export default function AnimeManage({ loaderData }: Route.ComponentProps) {
    const { animes } = loaderData;
    const [showForm, setShowForm] = useState(false);
    const [selectedAnime, setSelectedAnime] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const actionData = useActionData<{ success?: boolean; error?: string }>();
    const submit = useSubmit();

    // Bangumi 搜索状态
    const [bangumiQuery, setBangumiQuery] = useState("");
    const [bangumiResults, setBangumiResults] = useState<BangumiResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedBangumi, setSelectedBangumi] = useState<BangumiResult | null>(null);
    const [showBangumiDropdown, setShowBangumiDropdown] = useState(false);

    // 表单数据
    const [formData, setFormData] = useState({
        title: "",
        cover_url: "",
        name_cn: "",
        name_jp: "",
        summary: "",
        air_date: "",
        total_episodes: "",
        bangumi_score: "",
        bangumi_id: "",
        studio: "",
        status: "plan",
        progress: "",
        rating: "",
        review: "",
    });

    const statusLabels: Record<string, string> = {
        watching: "在看",
        completed: "看过",
        plan: "想看",
        dropped: "弃番",
    };

    const statusColors: Record<string, string> = {
        watching: "bg-blue-100 text-blue-700 border-blue-200",
        completed: "bg-green-100 text-green-700 border-green-200",
        plan: "bg-purple-100 text-purple-700 border-purple-200",
        dropped: "bg-gray-100 text-gray-700 border-gray-200",
    };

    const defaultRadarData = {
        plot: 8,
        animation: 8,
        voice: 8,
        music: 8,
        character: 8,
        passion: 8,
    };

    const [radarData, setRadarData] = useState(defaultRadarData);

    // Bangumi 搜索防抖
    const searchBangumi = useCallback(async (query: string) => {
        if (!query.trim()) {
            setBangumiResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/bangumi/search?q=${encodeURIComponent(query)}`);
            const data = await response.json() as any;
            setBangumiResults(data.results || []);
            setShowBangumiDropdown(true);
        } catch (error) {
            console.error("Bangumi search error:", error);
            setBangumiResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // 防抖搜索
    useEffect(() => {
        const timer = setTimeout(() => {
            if (bangumiQuery.trim()) {
                searchBangumi(bangumiQuery);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [bangumiQuery, searchBangumi]);

    // 选择 Bangumi 条目后自动填充
    const handleSelectBangumi = async (item: BangumiResult) => {
        setSelectedBangumi(item);
        setShowBangumiDropdown(false);
        setBangumiQuery(item.name_cn || item.name);

        // 获取详细信息
        try {
            const response = await fetch(`/api/bangumi/detail?id=${item.id}`);
            const detail = await response.json() as any;

            setFormData({
                ...formData,
                title: detail.name_cn || detail.name || item.name_cn || item.name,
                cover_url: detail.images?.large || item.images?.large || "",
                name_cn: detail.name_cn || item.name_cn || "",
                name_jp: detail.name || item.name || "",
                summary: detail.summary || item.summary || "",
                air_date: detail.date || item.air_date || "",
                total_episodes: String(detail.eps || detail.total_episodes || item.eps_count || ""),
                bangumi_score: String(detail.rating?.score || item.rating?.score || ""),
                bangumi_id: String(item.id),
                studio: detail.production?.studio || "",
            });
        } catch (error) {
            console.error("Failed to fetch Bangumi detail:", error);
            // 使用搜索结果的基本信息
            setFormData({
                ...formData,
                title: item.name_cn || item.name,
                cover_url: item.images?.large || "",
                name_cn: item.name_cn || "",
                name_jp: item.name || "",
                summary: item.summary || "",
                air_date: item.air_date || "",
                total_episodes: String(item.eps_count || ""),
                bangumi_score: String(item.rating?.score || ""),
                bangumi_id: String(item.id),
            });
        }
    };

    // 重置表单
    const resetForm = () => {
        setFormData({
            title: "",
            cover_url: "",
            name_cn: "",
            name_jp: "",
            summary: "",
            air_date: "",
            total_episodes: "",
            bangumi_score: "",
            bangumi_id: "",
            studio: "",
            status: "plan",
            progress: "",
            rating: "",
            review: "",
        });
        setSelectedBangumi(null);
        setBangumiQuery("");
        setBangumiResults([]);
    };

    return (
        <div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">番剧记录</h1>
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            placeholder="🔍 搜索番剧..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                        />
                        <motion.button
                            onClick={() => {
                                setShowForm(!showForm);
                                if (!showForm) resetForm();
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            + 录入新番
                        </motion.button>
                    </div>
                </div>

                {/* 添加新番剧表单 - 增强版 */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-800">录入新番</h2>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Bangumi 搜索框 */}
                            <div className="mb-6 relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    从 Bangumi 搜索（输入番剧名称自动填充）
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={bangumiQuery}
                                        onChange={(e) => setBangumiQuery(e.target.value)}
                                        onFocus={() => bangumiResults.length > 0 && setShowBangumiDropdown(true)}
                                        placeholder="搜索 Bangumi 番剧..."
                                        className="w-full pl-10 pr-10 py-3 bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                                    />
                                    {isSearching && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-400 animate-spin" size={18} />
                                    )}
                                </div>

                                {/* 搜索结果下拉 */}
                                {showBangumiDropdown && bangumiResults.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-80 overflow-y-auto"
                                    >
                                        {bangumiResults.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleSelectBangumi(item)}
                                                className="flex items-center gap-3 p-3 hover:bg-pink-50 cursor-pointer border-b border-gray-100 last:border-0"
                                            >
                                                {item.images?.small ? (
                                                    <img
                                                        src={item.images.small}
                                                        alt={item.name_cn || item.name}
                                                        className="w-12 h-16 object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <Film size={20} className="text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-800 truncate">
                                                        {item.name_cn || item.name}
                                                    </p>
                                                    {item.name_cn && item.name !== item.name_cn && (
                                                        <p className="text-xs text-gray-500 truncate">{item.name}</p>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                        {item.air_date && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={12} />
                                                                {item.air_date}
                                                            </span>
                                                        )}
                                                        {item.rating?.score && (
                                                            <span className="flex items-center gap-1 text-yellow-600">
                                                                <Star size={12} fill="currentColor" />
                                                                {item.rating.score.toFixed(1)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </div>

                            {/* 选中的番剧预览 */}
                            {selectedBangumi && (
                                <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200">
                                    <div className="flex items-start gap-4">
                                        {formData.cover_url && (
                                            <img
                                                src={formData.cover_url}
                                                alt={formData.title}
                                                className="w-24 h-32 object-cover rounded-lg shadow-md"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-gray-800">{formData.title}</h3>
                                            {formData.name_jp && formData.name_jp !== formData.title && (
                                                <p className="text-sm text-gray-500">{formData.name_jp}</p>
                                            )}
                                            <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                                {formData.air_date && (
                                                    <span className="px-2 py-1 bg-white rounded-full text-gray-600">
                                                        📅 {formData.air_date}
                                                    </span>
                                                )}
                                                {formData.total_episodes && (
                                                    <span className="px-2 py-1 bg-white rounded-full text-gray-600">
                                                        🎬 {formData.total_episodes} 集
                                                    </span>
                                                )}
                                                {formData.bangumi_score && (
                                                    <span className="px-2 py-1 bg-yellow-100 rounded-full text-yellow-700">
                                                        ★ {formData.bangumi_score}
                                                    </span>
                                                )}
                                                {formData.studio && (
                                                    <span className="px-2 py-1 bg-blue-100 rounded-full text-blue-700">
                                                        🏢 {formData.studio}
                                                    </span>
                                                )}
                                            </div>
                                            {formData.summary && (
                                                <p className="mt-2 text-sm text-gray-600 line-clamp-3">{formData.summary}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={resetForm}
                                            className="p-1 hover:bg-white rounded-full"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <Form method="post" className="space-y-4">
                                <input type="hidden" name="_action" value="create" />
                                <input type="hidden" name="bangumi_id" value={formData.bangumi_id} />
                                <input type="hidden" name="cover_url" value={formData.cover_url} />
                                <input type="hidden" name="name_cn" value={formData.name_cn} />
                                <input type="hidden" name="name_jp" value={formData.name_jp} />
                                <input type="hidden" name="summary" value={formData.summary} />
                                <input type="hidden" name="air_date" value={formData.air_date} />
                                <input type="hidden" name="total_episodes" value={formData.total_episodes} />
                                <input type="hidden" name="bangumi_score" value={formData.bangumi_score} />
                                <input type="hidden" name="studio" value={formData.studio} />

                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="番剧名称"
                                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                                    />
                                    <select
                                        name="status"
                                        required
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                                    >
                                        <option value="watching">在看</option>
                                        <option value="completed">看过</option>
                                        <option value="plan">想看</option>
                                        <option value="dropped">弃番</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <input
                                        type="text"
                                        name="progress"
                                        value={formData.progress}
                                        onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                                        placeholder={`进度 (如: 0/${formData.total_episodes || "24"})`}
                                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                                    />
                                    <input
                                        type="number"
                                        name="rating"
                                        min="1"
                                        max="10"
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                        placeholder="我的评分 (1-10)"
                                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                                    />
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        {formData.bangumi_score && (
                                            <span className="flex items-center gap-1">
                                                Bangumi: <Star size={14} className="text-yellow-500" fill="currentColor" />
                                                {formData.bangumi_score}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <textarea
                                    name="review"
                                    rows={2}
                                    value={formData.review}
                                    onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                                    placeholder="短评..."
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                                />
                                <div className="flex gap-3">
                                    <motion.button
                                        type="submit"
                                        className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowForm(false)}
                                    >
                                        添加番剧
                                    </motion.button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-6 py-2 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200"
                                    >
                                        取消
                                    </button>
                                </div>
                            </Form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 海报墙模式 */}
                <div>
                    <h2 className="text-xl font-bold mb-6 text-gray-800">我的收藏架</h2>
                    {animes && animes.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {animes
                                .filter((anime: any) =>
                                    anime.title.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((anime: any, index: number) => (
                                    <motion.div
                                        key={anime.id}
                                        className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer group"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ y: -8 }}
                                        onClick={() => {
                                            setSelectedAnime(anime);
                                            if (anime.rating_radar) {
                                                setRadarData(JSON.parse(anime.rating_radar));
                                            } else {
                                                setRadarData(defaultRadarData);
                                            }
                                        }}
                                    >
                                        {/* 封面 */}
                                        <div className="aspect-[3/4] bg-gray-100 overflow-hidden relative">
                                            {anime.cover_url ? (
                                                <OptimizedImage
                                                    src={anime.cover_url}
                                                    alt={anime.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                    width={300}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    🎬
                                                </div>
                                            )}
                                            {/* Bangumi 评分 */}
                                            {anime.bangumi_score && (
                                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white flex items-center gap-1">
                                                    <Star size={12} fill="currentColor" className="text-yellow-400" />
                                                    {anime.bangumi_score}
                                                </div>
                                            )}
                                            {/* 状态标签 */}
                                            <div className="absolute top-2 right-2">
                                                <span
                                                    className={`px-2 py-1 rounded-lg text-xs font-bold border ${statusColors[anime.status] || statusColors.plan}`}
                                                >
                                                    {statusLabels[anime.status] || "未知"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 信息 */}
                                        <div className="p-4">
                                            <h3 className="font-bold text-gray-800 mb-1 line-clamp-2">
                                                {anime.title}
                                            </h3>
                                            <div className="flex items-center justify-between text-sm text-gray-500">
                                                {anime.rating && (
                                                    <span className="text-yellow-500 font-mono">
                                                        ★ {anime.rating}/10
                                                    </span>
                                                )}
                                                {anime.progress && (
                                                    <span className="font-mono">{anime.progress}</span>
                                                )}
                                            </div>
                                            {anime.studio && (
                                                <p className="text-xs text-gray-400 mt-1 truncate">{anime.studio}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-16 bg-white rounded-2xl border border-gray-100">
                            <p className="text-lg mb-2">收藏架还是空的</p>
                            <p className="text-sm">点击"录入新番"开始收藏吧！</p>
                        </div>
                    )}
                </div>

                {/* 侧滑编辑抽屉 */}
                <AnimatePresence>
                    {selectedAnime && (
                        <>
                            {/* 遮罩层 */}
                            <motion.div
                                className="fixed inset-0 bg-black/50 z-40"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedAnime(null)}
                            />
                            {/* 抽屉 */}
                            <motion.div
                                className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto"
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800">番剧详情</h2>
                                        <motion.button
                                            onClick={() => setSelectedAnime(null)}
                                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            ✕
                                        </motion.button>
                                    </div>

                                    {selectedAnime.cover_url && (
                                        <div className="w-full rounded-xl mb-6 overflow-hidden">
                                            <OptimizedImage
                                                src={selectedAnime.cover_url}
                                                alt={selectedAnime.title}
                                                className="w-full"
                                                width={400}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{selectedAnime.title}</h3>
                                            {selectedAnime.name_jp && selectedAnime.name_jp !== selectedAnime.title && (
                                                <p className="text-sm text-gray-500">{selectedAnime.name_jp}</p>
                                            )}
                                        </div>

                                        {/* Bangumi 信息 */}
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            {selectedAnime.air_date && (
                                                <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                                                    📅 {selectedAnime.air_date}
                                                </span>
                                            )}
                                            {selectedAnime.total_episodes && (
                                                <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                                                    🎬 {selectedAnime.total_episodes} 集
                                                </span>
                                            )}
                                            {selectedAnime.bangumi_score && (
                                                <span className="px-2 py-1 bg-yellow-100 rounded-full text-yellow-700">
                                                    ★ Bangumi {selectedAnime.bangumi_score}
                                                </span>
                                            )}
                                            {selectedAnime.studio && (
                                                <span className="px-2 py-1 bg-blue-100 rounded-full text-blue-700">
                                                    🏢 {selectedAnime.studio}
                                                </span>
                                            )}
                                        </div>

                                        {selectedAnime.summary && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">简介</label>
                                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                                                    {selectedAnime.summary}
                                                </p>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                                            <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${statusColors[selectedAnime.status]}`}>
                                                {statusLabels[selectedAnime.status]}
                                            </span>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">进度</label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-mono">{selectedAnime.progress || "0/?"}</span>
                                                {selectedAnime.status === "watching" && selectedAnime.progress && (
                                                    <QuickSyncButton
                                                        animeId={selectedAnime.id}
                                                        currentProgress={selectedAnime.progress}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {selectedAnime.rating && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">我的评分</label>
                                                <span className="text-2xl font-bold text-yellow-500">★ {selectedAnime.rating}/10</span>
                                            </div>
                                        )}

                                        {/* 雷达图评测 */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-4">
                                                雷达图评测
                                            </label>
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <RadarChart data={radarData} size={200} />
                                            </div>
                                        </div>

                                        {selectedAnime.review && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">短评</label>
                                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl italic">
                                                    "{selectedAnime.review}"
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex gap-3 pt-4">
                                            <Form method="post">
                                                <input type="hidden" name="_action" value="delete" />
                                                <input type="hidden" name="id" value={selectedAnime.id} />
                                                <motion.button
                                                    type="submit"
                                                    className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        const res = await confirmModal({ title: "危险操作", message: "确定要删除这部番剧吗？" });
                                                        if (res) {
                                                            setSelectedAnime(null);
                                                            const formData = new FormData();
                                                            formData.append("_action", "delete");
                                                            formData.append("id", selectedAnime.id.toString());
                                                            submit(formData, { method: "post" });
                                                        }
                                                    }}
                                                >
                                                    删除
                                                </motion.button>
                                            </Form>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

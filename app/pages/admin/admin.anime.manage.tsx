import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { requireAdmin } from "~/utils/auth";
import { useState, useEffect, useCallback } from "react";
import { RadarChart } from "~/components/ui/system/RadarChart";
import { QuickSyncButton } from "~/components/admin/QuickSyncButton";
import { Plus, Search, Edit2, Trash2, X, Link as LinkIcon, Star, Filter, Heart, PlayCircle, Clock, Loader2, Calendar, Film, Settings, Building } from "lucide-react";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import { toast } from "~/components/ui/Toast";
import { confirmModal } from "~/components/ui/Modal";
import { IconEmoji } from "~/components/ui/IconEmoji";

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

// 数据库 Anime 记录类型
interface AnimeRecord {
    id: number;
    title: string;
    cover_url: string | null;
    name_cn: string | null;
    name_jp: string | null;
    status: string;
    progress: string | null;
    rating: number | null;
    rating_radar: string | null;
    review: string | null;
    bangumi_id: number | null;
    bangumi_score: number | null;
    studio: string | null;
    air_date: string | null;
    total_episodes: number | null;
    summary: string | null;
    created_at: number;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
    const { anime_db } = context.cloudflare.env as { anime_db: import('~/services/db.server').Database };
    const session = await requireAdmin(request, anime_db);
    if (!session) throw redirect("/panel/login");

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

export async function action({ request, context }: ActionFunctionArgs) {
    const { anime_db } = context.cloudflare.env as { anime_db: import('~/services/db.server').Database };
    const session = await requireAdmin(request, anime_db);
    if (!session) throw redirect("/panel/login");

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
        } else if (action === "update") {
            const id = formData.get("id") as string;
            const status = formData.get("status") as string;
            const progress = formData.get("progress") as string;
            const rating = formData.get("rating") ? parseInt(formData.get("rating") as string) : null;
            const review = formData.get("review") as string;

            await anime_db
                .prepare("UPDATE animes SET status = ?, progress = ?, rating = ?, review = ? WHERE id = ?")
                .bind(status, progress || null, rating, review || null, id)
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

export default function AnimeManage() {
    const loaderData = useLoaderData<typeof loader>();
    const { animes } = loaderData;
    const [showForm, setShowForm] = useState(false);
    const [selectedAnime, setSelectedAnime] = useState<Record<string, unknown> | null>(null);
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
        dropped: "bg-white/10 text-white/80 font-bold border-white/10",
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
            const data = await response.json() as { results?: BangumiResult[] };
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
            const detail = await response.json() as Record<string, unknown>;

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
                    <h1 className="text-3xl font-bold text-white font-bold">番剧记录</h1>
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            placeholder={<><IconEmoji emoji="🔍" size={16} /> 搜索番剧...</>}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-bold placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
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
                            className="bg-[#0f111a] rounded-2xl p-6 mb-8 shadow-sm border border-white/5"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white font-bold">录入新番</h2>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="p-2 hover:bg-white/10 rounded-full"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Bangumi 搜索框 */}
                            <div className="mb-6 relative">
                                <label className="block text-sm font-medium text-white/80 font-bold mb-2">
                                    从 Bangumi 搜索（输入番剧名称自动填充）
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                                    <input
                                        type="text"
                                        value={bangumiQuery}
                                        onChange={(e) => setBangumiQuery(e.target.value)}
                                        onFocus={() => bangumiResults.length > 0 && setShowBangumiDropdown(true)}
                                        placeholder="搜索 Bangumi 番剧..."
                                        className="w-full pl-10 pr-10 py-3 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-2 border-violet-500/20 rounded-xl text-white font-bold focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
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
                                        className="absolute z-50 w-full mt-2 bg-[#0f111a] rounded-xl shadow-xl border border-white/10 max-h-80 overflow-y-auto"
                                    >
                                        {bangumiResults.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleSelectBangumi(item)}
                                                className="flex items-center gap-3 p-3 hover:bg-pink-50 cursor-pointer border-b border-white/5 last:border-0"
                                            >
                                                {item.images?.small ? (
                                                    <img
                                                        src={item.images.small}
                                                        alt={item.name_cn || item.name}
                                                        className="w-12 h-16 object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                                                        <Film size={20} className="text-white/30" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-white font-bold truncate">
                                                        {item.name_cn || item.name}
                                                    </p>
                                                    {item.name_cn && item.name !== item.name_cn && (
                                                        <p className="text-xs text-white/40 truncate">{item.name}</p>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
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
                                <div className="mb-6 p-4 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-xl border border-violet-500/20">
                                    <div className="flex items-start gap-4">
                                        {formData.cover_url && (
                                            <img
                                                src={formData.cover_url}
                                                alt={formData.title}
                                                className="w-24 h-32 object-cover rounded-lg shadow-md"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-white font-bold">{formData.title}</h3>
                                            {formData.name_jp && formData.name_jp !== formData.title && (
                                                <p className="text-sm text-white/40">{formData.name_jp}</p>
                                            )}
                                            <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                                {formData.air_date && (
                                                    <span className="px-2 py-1 bg-[#0f111a] rounded-full text-white/60 flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        {formData.air_date}
                                                    </span>
                                                )}
                                                {formData.total_episodes && (
                                                    <span className="px-2 py-1 bg-[#0f111a] rounded-full text-white/60 flex items-center gap-1">
                                                        <Film size={14} />
                                                        {formData.total_episodes} 集
                                                    </span>
                                                )}
                                                {formData.bangumi_score && (
                                                    <span className="px-2 py-1 bg-yellow-100 rounded-full text-yellow-700 flex items-center gap-1">
                                                        <Star size={14} className="text-yellow-500" />
                                                        {formData.bangumi_score}
                                                    </span>
                                                )}
                                                {formData.studio && (
                                                    <span className="px-2 py-1 bg-blue-100 rounded-full text-blue-700 flex items-center gap-1">
                                                        <Building size={14} className="text-blue-500" />
                                                        {formData.studio}
                                                    </span>
                                                )}
                                            </div>
                                            {formData.summary && (
                                                <p className="mt-2 text-sm text-white/60 line-clamp-3">{formData.summary}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={resetForm}
                                            className="p-1 hover:bg-[#0f111a] rounded-full"
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
                                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                                    />
                                    <select
                                        name="status"
                                        required
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                                    >
                                        <option value="watching">在看</option>
                                        <option value="completed">看过</option>
                                        <option value="plan">想看</option>
                                        <option value="dropped">弃番</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input
                                        type="text"
                                        name="progress"
                                        value={formData.progress}
                                        onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                                        placeholder={`进度 (如: 0/${formData.total_episodes || "24"})`}
                                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                                    />
                                    <input
                                        type="number"
                                        name="rating"
                                        min="1"
                                        max="10"
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                        placeholder="我的评分 (1-10)"
                                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                                    />
                                    <div className="flex items-center gap-2 text-sm text-white/40">
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
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
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
                                        className="px-6 py-2 bg-white/10 text-white/60 rounded-xl font-medium hover:bg-white/20"
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
                    <h2 className="text-xl font-bold mb-6 text-white font-bold">我的收藏架</h2>
                    {animes && animes.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {animes
                                .filter((anime: AnimeRecord) =>
                                    anime.title.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((anime: AnimeRecord, index: number) => (
                                    <motion.div
                                        key={anime.id}
                                        className="bg-[#0f111a] rounded-2xl overflow-hidden shadow-sm border border-white/5 cursor-pointer group"
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
                                        <div className="aspect-[3/4] bg-white/10 overflow-hidden relative">
                                            {anime.cover_url ? (
                                                <OptimizedImage
                                                    src={anime.cover_url}
                                                    alt={anime.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                    width={300}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/30">
                                                    <Film size={24} />
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
                                            <h3 className="font-bold text-white font-bold mb-1 line-clamp-2">
                                                {anime.title}
                                            </h3>
                                            <div className="flex items-center justify-between text-sm text-white/40">
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
                                                <p className="text-xs text-white/30 mt-1 truncate">{anime.studio}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                        </div>
                    ) : (
                        <div className="text-center text-white/40 py-16 bg-[#0f111a] rounded-2xl border border-white/5">
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
                                className="fixed right-0 top-0 h-full w-full md:w-96 bg-[#0f111a] border-l border-white/10 backdrop-blur-3xl shadow-2xl z-50 overflow-y-auto"
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-white font-bold">番剧详情</h2>
                                        <motion.button
                                            onClick={() => setSelectedAnime(null)}
                                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <X size={16} />
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
                                            <h3 className="text-xl font-bold text-white font-bold">{selectedAnime.title}</h3>
                                            {selectedAnime.name_jp && selectedAnime.name_jp !== selectedAnime.title && (
                                                <p className="text-sm text-white/40">{selectedAnime.name_jp}</p>
                                            )}
                                        </div>

                                        {/* Bangumi 信息 */}
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            {selectedAnime.air_date && (
                                                <span className="px-2 py-1 bg-white/10 rounded-full text-white/60 flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {selectedAnime.air_date}
                                                </span>
                                            )}
                                            {selectedAnime.total_episodes && (
                                                <span className="px-2 py-1 bg-white/10 rounded-full text-white/60 flex items-center gap-1">
                                                    <Film size={14} />
                                                    {selectedAnime.total_episodes} 集
                                                </span>
                                            )}
                                            {selectedAnime.bangumi_score && (
                                                <span className="px-2 py-1 bg-yellow-500/20 rounded-full text-yellow-400 border border-yellow-500/30">
                                                    ★ Bangumi {selectedAnime.bangumi_score}
                                                </span>
                                            )}
                                            {selectedAnime.studio && (
                                                <span className="px-2 py-1 bg-blue-500/20 rounded-full text-blue-400 border border-blue-500/30 flex items-center gap-1">
                                                    <Building size={14} className="text-blue-300" />
                                                    {selectedAnime.studio}
                                                </span>
                                            )}
                                        </div>

                                        {selectedAnime.summary && (
                                            <div>
                                                <label className="block text-sm font-medium text-white/80 font-bold mb-2">简介</label>
                                                <p className="text-sm text-white/60 bg-white/5 p-3 rounded-xl">
                                                    {selectedAnime.summary}
                                                </p>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-white/80 font-bold mb-2">状态</label>
                                            <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${statusColors[selectedAnime.status]}`}>
                                                {statusLabels[selectedAnime.status]}
                                            </span>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-white/80 font-bold mb-2">进度</label>
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
                                                <label className="block text-sm font-medium text-white/80 font-bold mb-2">我的评分</label>
                                                <span className="text-2xl font-bold text-yellow-500">★ {selectedAnime.rating}/10</span>
                                            </div>
                                        )}

                                        {/* 雷达图评测 */}
                                        <div>
                                            <label className="block text-sm font-medium text-white/80 font-bold mb-4">
                                                雷达图评测
                                            </label>
                                            <div className="bg-white/5 rounded-xl p-4">
                                                <RadarChart data={radarData} size={200} />
                                            </div>
                                        </div>

                                        {selectedAnime.review && (
                                            <div>
                                                <label className="block text-sm font-medium text-white/80 font-bold mb-2">短评</label>
                                                <p className="text-sm text-white/60 bg-white/5 p-3 rounded-xl italic">
                                                    "{selectedAnime.review}"
                                                </p>
                                            </div>
                                        )}

                                        {/* 编辑表单 */}
                                        <Form method="post" className="space-y-4 pt-4 border-t border-white/10">
                                            <input type="hidden" name="_action" value="update" />
                                            <input type="hidden" name="id" value={selectedAnime.id} />

                                            <div>
                                                <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5">观看状态</label>
                                                <select
                                                    name="status"
                                                    defaultValue={selectedAnime.status}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-violet-500/50 outline-none transition-all appearance-none"
                                                >
                                                    <option value="watching" className="bg-[#0f111a]">在看</option>
                                                    <option value="completed" className="bg-[#0f111a]">已看</option>
                                                    <option value="planned" className="bg-[#0f111a]">想看</option>
                                                    <option value="dropped" className="bg-[#0f111a]">抛弃</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5">观看进度</label>
                                                <input
                                                    name="progress"
                                                    defaultValue={selectedAnime.progress || ""}
                                                    placeholder="例如 6/12"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-violet-500/50 outline-none transition-all"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5">我的评分 (1-10)</label>
                                                <input
                                                    name="rating"
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    defaultValue={selectedAnime.rating || ""}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-yellow-400 font-bold text-sm focus:border-yellow-500/50 outline-none transition-all"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5">短评</label>
                                                <textarea
                                                    name="review"
                                                    defaultValue={selectedAnime.review || ""}
                                                    rows={2}
                                                    placeholder="写点什么..."
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-violet-500/50 outline-none transition-all resize-none"
                                                />
                                            </div>

                                            <motion.button
                                                type="submit"
                                                className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all"
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                保存修改
                                            </motion.button>
                                        </Form>

                                        <div className="flex gap-3 pt-2">
                                            <motion.button
                                                className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-medium text-sm"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={async () => {
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
                                                删除番剧
                                            </motion.button>
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

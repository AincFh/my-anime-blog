import { motion, AnimatePresence } from "framer-motion";
import { useLoaderData, useNavigate, useFetcher } from "react-router";
import { GameDashboardLayout } from "~/components/dashboard/game/GameDashboardLayout";
import { StatusHUD } from "~/components/dashboard/game/StatusHUD";
import { NavMenu } from "~/components/dashboard/game/NavMenu";
import { ClientOnly } from "~/components/common/ClientOnly";
import { getSessionToken, verifySession } from "~/services/auth.server";
import { getUserCoins } from "~/services/membership/coins.server";
import { useState } from "react";
import { Package, Search, Filter } from "lucide-react";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import { toast } from "~/components/ui/Toast";
import { useEffect } from "react";

export async function loader({ request, context }: { request: Request; context: any }) {
    const { anime_db } = context.cloudflare.env;
    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return {
            loggedIn: false,
            user: null,
            stats: { coins: 0, level: 1, exp: 0, maxExp: 100 },
            inventory: []
        };
    }

    const coins = await getUserCoins(anime_db, user.id);

    // 获取背包物品
    const inventory = await anime_db
        .prepare(`
          SELECT si.*, up.purchased_at 
          FROM user_purchases up
          JOIN shop_items si ON up.item_id = si.id
          WHERE up.user_id = ?
          ORDER BY up.purchased_at DESC
      `)
        .bind(user.id)
        .all();

    let prefs = {};
    try {
        prefs = JSON.parse(user.preferences || '{}');
    } catch (e) { }

    return {
        loggedIn: true,
        user: {
            ...user,
            prefs,
            avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
        },
        stats: {
            coins,
            level: user.level || 1,
            exp: user.exp || 0,
            maxExp: (user.level || 1) * 100,
        },
        inventory: inventory.results || []
    };
}

export async function action({ request, context }: { request: Request; context: any }) {
    const { anime_db } = context.cloudflare.env;
    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return { success: false, error: "未授权或登录已失效" };
    }

    const formData = await request.formData();
    const itemId = formData.get("itemId");

    if (!itemId) return { success: false, error: "缺失关键维拉指令" };

    const purchase = await anime_db.prepare(`
        SELECT * FROM user_purchases WHERE user_id = ? AND item_id = ?
    `).bind(user.id, itemId).first();

    if (!purchase) {
        return { success: false, error: "尚未解锁该维度的物品" };
    }

    const item = await anime_db.prepare(`
        SELECT * FROM shop_items WHERE id = ?
    `).bind(itemId).first();

    if (!item) {
        return { success: false, error: "物质残片已损坏" };
    }

    let prefs: any = {};
    try {
        prefs = JSON.parse(user.preferences || '{}');
    } catch (e) { }

    const isEquipped = item.type === 'avatar_frame' ? prefs.equipped_avatar_frame === item.image_url :
        item.type === 'theme' ? prefs.equipped_theme === item.image_url : false;

    if (isEquipped) {
        if (item.type === 'avatar_frame') delete prefs.equipped_avatar_frame;
        if (item.type === 'theme') delete prefs.equipped_theme;
    } else {
        if (item.type === 'avatar_frame') prefs.equipped_avatar_frame = item.image_url;
        if (item.type === 'theme') prefs.equipped_theme = item.image_url;
    }

    await anime_db.prepare(`
        UPDATE users SET preferences = ? WHERE id = ?
    `).bind(JSON.stringify(prefs), user.id).run();

    return { success: true, message: isEquipped ? "已取消装备" : "装备成功！" };
}

export default function UserInventory() {
    const { loggedIn, user, stats, inventory } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const [filter, setFilter] = useState("all");
    const [selectedItem, setSelectedItem] = useState<any>(null);

    useEffect(() => {
        if (fetcher.data?.success) {
            toast.success(fetcher.data.message);
        } else if (fetcher.data?.error) {
            toast.error(fetcher.data.error);
        }
    }, [fetcher.data]);

    if (!loggedIn) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">ACCESS DENIED</h1>
                    <button onClick={() => navigate("/login")} className="mt-4 px-6 py-2 bg-primary-500 rounded-full">登录</button>
                </div>
            </div>
        );
    }

    const filteredInventory = inventory.filter((item: any) => {
        if (filter === "all") return true;
        return item.type === filter;
    });

    const userData = {
        avatar: user?.avatar_url,
        uid: user ? `UID-${user.id.toString().padStart(6, '0')}` : "UID-000000",
        level: stats.level || 1,
        name: user?.username || "Traveler",
        exp: stats.exp || 0,
        maxExp: stats.maxExp || 100,
    };

    return (
        <>
            <ClientOnly>
                {() => <StatusHUD user={userData} stats={{ coins: stats.coins }} />}
            </ClientOnly>
            <NavMenu />

            <div className="absolute inset-0 flex items-center justify-center pl-24 pr-8 pt-24 pb-8 pointer-events-none">
                <div className="w-full h-full max-w-6xl flex gap-8 pointer-events-auto">

                    {/* 左侧：物品网格 */}
                    <div className="flex-1 flex flex-col gap-6">
                        {/* 过滤器 */}
                        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-2 rounded-full w-fit border border-white/10">
                            {['all', 'avatar_frame', 'theme', 'emoji'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilter(type)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${filter === type ? "bg-white text-slate-900" : "text-white/60 hover:text-white hover:bg-white/10"
                                        }`}
                                >
                                    {type === 'all' ? '全部' : type === 'avatar_frame' ? '头像框' : type === 'theme' ? '主题' : '表情包'}
                                </button>
                            ))}
                        </div>

                        {/* 网格 */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            {filteredInventory.length > 0 ? (
                                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                    {filteredInventory.map((item: any) => (
                                        <motion.div
                                            key={item.id}
                                            layoutId={`item-${item.id}`}
                                            onClick={() => setSelectedItem(item)}
                                            className={`
                                        aspect-square rounded-xl border-2 cursor-pointer relative group overflow-hidden
                                        ${selectedItem?.id === item.id
                                                    ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_20px_rgba(250,204,21,0.3)]"
                                                    : "border-white/10 bg-black/40 hover:border-white/40 hover:bg-white/5"
                                                }
                                    `}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <OptimizedImage src={item.image_url} alt={item.name} className="w-full h-full object-cover p-2" width={100} />
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-center">
                                                <span className="text-[10px] text-white/80 truncate block">{item.name}</span>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* 填充空位 */}
                                    {Array.from({ length: Math.max(0, 24 - filteredInventory.length) }).map((_, i) => (
                                        <div key={`empty-${i}`} className="aspect-square rounded-xl border border-white/5 bg-black/20 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white/5 rounded-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-white/40">
                                    <Package size={64} className="mb-4 opacity-50" />
                                    <p className="text-lg font-bold">背包是空的</p>
                                    <p className="text-sm mt-2">去商城看看吧！</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 右侧：详情面板 */}
                    <div className="w-80 flex flex-col">
                        <AnimatePresence mode="wait">
                            {selectedItem ? (
                                <motion.div
                                    key={selectedItem.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="h-full bg-black/60 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col rounded-r-3xl"
                                >
                                    <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 flex items-center justify-center mb-6 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-[url('/grid.png')] opacity-20" />
                                        <motion.div
                                            className="w-3/4 h-3/4 z-10 drop-shadow-2xl relative"
                                            initial={{ scale: 0.8, rotate: -10 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: "spring" }}
                                        >
                                            <OptimizedImage
                                                src={selectedItem.image_url}
                                                alt={selectedItem.name}
                                                className="w-full h-full object-contain"
                                                width={300}
                                            />
                                        </motion.div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    <h2 className="text-2xl font-bold text-white mb-2">{selectedItem.name}</h2>
                                    <div className="flex gap-2 mb-4">
                                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded border border-yellow-500/30">
                                            {selectedItem.type === 'avatar_frame' ? '稀有' : '普通'}
                                        </span>
                                        <span className="px-2 py-0.5 bg-white/10 text-white/60 text-xs rounded">
                                            已拥有
                                        </span>
                                    </div>

                                    <p className="text-white/60 text-sm leading-relaxed mb-8 flex-1">
                                        {selectedItem.description || "暂无描述..."}
                                    </p>

                                    <fetcher.Form method="post">
                                        <input type="hidden" name="itemId" value={selectedItem.id} />
                                        <button
                                            type="submit"
                                            className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-lg shadow-white/10"
                                            disabled={fetcher.state !== 'idle'}
                                        >
                                            {fetcher.state !== 'idle' ? "正在共鸣请求..." : (
                                                (selectedItem.type === 'avatar_frame' && (user?.prefs as any)?.equipped_avatar_frame === selectedItem.image_url) ||
                                                    (selectedItem.type === 'theme' && (user?.prefs as any)?.equipped_theme === selectedItem.image_url)
                                                    ? "卸下装备" : "装备 / 使用"
                                            )}
                                        </button>
                                    </fetcher.Form>
                                </motion.div>
                            ) : (
                                <div className="h-full bg-black/60 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col items-center justify-center text-white/30 rounded-r-3xl">
                                    <Package className="w-16 h-16 mb-4 opacity-50" />
                                    <p>选择一个物品查看详情</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </>
    );
}

export function ErrorBoundary({ error }: { error: Error }) {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
            <div className="text-center p-8 bg-red-900/20 border border-red-500/50 rounded-2xl max-w-md">
                <h1 className="text-2xl font-bold mb-4 text-red-500">SYSTEM ERROR</h1>
                <p className="text-white/80 mb-4">无法加载背包数据。</p>
                <div className="bg-black/50 p-4 rounded text-left text-xs font-mono text-red-300 overflow-auto max-h-32 mb-6">
                    {error instanceof Error ? error.message : "Unknown Error"}
                </div>
                <a href="/user/dashboard" className="px-6 py-2 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-200 transition-colors">
                    返回指挥中心
                </a>
            </div>
        </div>
    );
}

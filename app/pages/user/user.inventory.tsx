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
                {() => <>
                    <StatusHUD user={userData} stats={{ coins: stats.coins }} />
                    <div className="fixed inset-0 z-[-1] bg-black/20 backdrop-blur-3xl" />
                </>}
            </ClientOnly>
            <NavMenu />

            <div className="w-full h-screen overflow-y-auto pt-[calc(env(safe-area-inset-top)+6.5rem)] md:pt-[calc(env(safe-area-inset-top)+7.5rem)] pb-[calc(env(safe-area-inset-bottom)+8rem)] px-4 md:px-12 flex flex-col md:flex-row gap-8 scroll-smooth">
                {/* 左侧：物品网格 */}
                <div className="flex-1 flex flex-col gap-6 min-w-0">
                    {/* 过滤器 */}
                    <div className="flex items-center gap-2 md:gap-4 bg-black/40 backdrop-blur-md p-1.5 rounded-full w-fit border border-white/10 overflow-x-auto no-scrollbar max-w-full">
                        {['all', 'avatar_frame', 'theme', 'emoji'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap ${filter === type ? "bg-white text-slate-900 shadow-lg" : "text-white/60 hover:text-white hover:bg-white/10"
                                    }`}
                            >
                                {type === 'all' ? '全部' : type === 'avatar_frame' ? '头像框' : type === 'theme' ? '主题' : '表情包'}
                            </button>
                        ))}
                    </div>

                    {/* 网格 */}
                    <div className="flex-1 overflow-y-visible">
                        {filteredInventory.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4 pb-12">
                                {filteredInventory.map((item: any) => (
                                    <motion.div
                                        key={item.id}
                                        layoutId={`item-${item.id}`}
                                        onClick={() => setSelectedItem(item)}
                                        className={`
                                            aspect-square rounded-2xl border-2 cursor-pointer relative group overflow-hidden transition-all duration-300
                                            ${selectedItem?.id === item.id
                                                ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_25px_rgba(250,204,21,0.2)] scale-[1.02]"
                                                : "border-white/5 bg-black/40 hover:border-white/20 hover:bg-white/5"
                                            }
                                        `}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <div className="w-full h-full p-2.5 flex items-center justify-center">
                                            <OptimizedImage
                                                src={item.image_url}
                                                alt={item.name}
                                                className="w-full h-full object-contain drop-shadow-xl"
                                                width={120}
                                            />
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] text-white/90 text-center truncate block font-medium">{item.name}</span>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* 填充空位 - 仅在桌面端显示 */}
                                {Array.from({ length: Math.max(0, 16 - filteredInventory.length) }).map((_, i) => (
                                    <div key={`empty-${i}`} className="hidden md:flex aspect-square rounded-2xl border border-white/[0.03] bg-white/[0.02] items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-white/5 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[50vh] flex flex-col items-center justify-center text-white/30">
                                <Package size={56} className="mb-4 opacity-20" strokeWidth={1.5} />
                                <p className="text-lg font-display font-medium">维度口袋是空的</p>
                                <p className="text-sm mt-1 text-white/20">去星尘集市探索吧</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 右侧：详情面板 (Responsive Drawer) */}
                <div className="w-full md:w-80 lg:w-96 shrink-0 h-fit md:h-auto">
                    <AnimatePresence mode="wait">
                        {selectedItem ? (
                            <motion.div
                                key={selectedItem.id}
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-black/40 backdrop-blur-3xl border border-white/10 p-6 md:p-8 flex flex-col rounded-[32px] md:sticky md:top-32"
                            >
                                <div className="aspect-square bg-gradient-to-br from-white/5 to-white/[0.02] rounded-3xl border border-white/10 flex items-center justify-center mb-8 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(white,transparent_85%)]" />
                                    
                                    {/* 动态光效反馈 */}
                                    <motion.div 
                                        className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                                        animate={{ opacity: [0, 0.1, 0] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                    />

                                    <motion.div
                                        className="w-4/5 h-4/5 z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative"
                                        initial={{ rotate: -5 }}
                                        animate={{ rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 200 }}
                                    >
                                        <OptimizedImage
                                            src={selectedItem.image_url}
                                            alt={selectedItem.name}
                                            className="w-full h-full object-contain"
                                            width={400}
                                        />
                                    </motion.div>
                                </div>

                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">{selectedItem.name}</h2>
                                        <span className="px-3 py-1 bg-yellow-400/10 text-yellow-500 text-[10px] font-black rounded-full border border-yellow-400/20 uppercase tracking-tighter">
                                            {selectedItem.type === 'avatar_frame' ? 'Super Rare' : 'Regular'}
                                        </span>
                                    </div>
                                    
                                    <p className="text-white/50 text-sm leading-relaxed font-light">
                                        {selectedItem.description || "在该物质被同步前，暂无更多核心数据描述。"}
                                    </p>
                                    
                                    <div className="pt-4 space-y-3">
                                        <div className="flex justify-between text-[11px] font-mono text-white/30 uppercase tracking-widest">
                                            <span>Origin Date</span>
                                            <span>{new Date(selectedItem.purchased_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                    </div>
                                </div>

                                <div className="mt-10">
                                    <fetcher.Form method="post">
                                        <input type="hidden" name="itemId" value={selectedItem.id} />
                                        <button
                                            type="submit"
                                            className={`
                                                w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-500
                                                ${(selectedItem.type === 'avatar_frame' && (user?.prefs as any)?.equipped_avatar_frame === selectedItem.image_url) ||
                                                  (selectedItem.type === 'theme' && (user?.prefs as any)?.equipped_theme === selectedItem.image_url)
                                                    ? "bg-white/10 text-white border border-white/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
                                                    : "bg-white text-slate-900 shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:scale-[1.02] hover:shadow-[0_25px_50px_rgba(255,255,255,0.15)]"
                                                }
                                                disabled:opacity-50 disabled:scale-100
                                            `}
                                            disabled={fetcher.state !== 'idle'}
                                        >
                                            {fetcher.state !== 'idle' ? (
                                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                (selectedItem.type === 'avatar_frame' && (user?.prefs as any)?.equipped_avatar_frame === selectedItem.image_url) ||
                                                (selectedItem.type === 'theme' && (user?.prefs as any)?.equipped_theme === selectedItem.image_url)
                                                    ? "卸下当前装备" : "立即同步装备"
                                            )}
                                        </button>
                                    </fetcher.Form>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="hidden md:flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-[32px] text-white/20 bg-white/[0.01]">
                                <div className="w-12 h-12 rounded-full border border-current flex items-center justify-center mb-4 opacity-30">
                                    <Filter size={20} />
                                </div>
                                <p className="text-sm font-medium">选择物品以开始量子共鸣</p>
                            </div>
                        )}
                    </AnimatePresence>
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

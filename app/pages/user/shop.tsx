import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, CreditCard, Crown, Star, Shield, Zap, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLoaderData, useFetcher, useSearchParams, Form } from "react-router";
import { NavMenu } from "~/components/dashboard/game/NavMenu";
import { StatusHUD } from "~/components/dashboard/game/StatusHUD";
import { ClientOnly } from "~/components/common/ClientOnly";
import { MockPaymentModal } from "~/components/payment/MockPaymentModal";
import { useUser } from "~/hooks/useUser";
import { getSessionToken, verifySession } from "~/services/auth.server";
import { getUserCoins } from "~/services/membership/coins.server";
import { getAllTiers } from "~/services/membership/tier.server";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import { RECHARGE_PACKAGES } from "~/config/game";
import { confirmModal } from "~/components/ui/Modal";
import { toast } from "~/components/ui/Toast";

// Loader: Fetch Shop Data
export async function loader({ request, context }: { request: Request; context: any }) {
    const { anime_db } = context.cloudflare.env;

    // 商品和会员档位 — 无论是否登录都加载
    const [shopItems, tiers] = await Promise.all([
        anime_db.prepare("SELECT * FROM shop_items WHERE is_active = 1 ORDER BY sort_order").all(),
        getAllTiers(anime_db)
    ]);

    const rechargePackages = RECHARGE_PACKAGES;

    // 登录态 — 额外获取余额
    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return {
            loggedIn: false,
            user: null,
            stats: { coins: 0 },
            shopItems: shopItems.results,
            tiers,
            rechargePackages,
        };
    }

    const coins = await getUserCoins(anime_db, user.id);

    // 获取详细会员信息
    const { getUserMembershipTier } = await import("~/services/membership/tier.server");
    const { tier } = await getUserMembershipTier(anime_db, user.id);

    return {
        loggedIn: true,
        user: { ...user, avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}` },
        tier: tier ? {
            name: tier.name,
            display_name: tier.display_name,
            badge_color: tier.badge_color,
            privileges: JSON.parse(tier.privileges || '{}')
        } : null,
        stats: { coins },
        shopItems: shopItems.results,
        tiers,
        rechargePackages
    };
}

export default function ShopPage() {
    const loaderData = useLoaderData<typeof loader>();
    const { user: clientUser } = useUser();
    const [searchParams] = useSearchParams();
    const fetcher = useFetcher();

    const user = loaderData.user || clientUser;
    const stats = {
        coins: loaderData.stats.coins, // Use server data for accuracy
        level: user?.level || 1,
        exp: user?.exp || 0,
        maxExp: (user?.level || 1) * 100,
    };

    const [activeTab, setActiveTab] = useState<"goods" | "recharge" | "membership">(() => {
        const tabParam = searchParams.get("tab");
        if (tabParam === "recharge" || tabParam === "membership") return tabParam;
        return "goods";
    });
    const [filterCategory, setFilterCategory] = useState("all");
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const CATEGORY_MAP: Record<string, string> = {
        all: "全部",
        avatar_frame: "头像框",
        theme: "主题皮肤",
        emoji: "表情包",
        badge: "徽章",
        prop: "功能道具",
        effect: "入场特效",
        coupon: "兑换券",
    };

    const filteredItems = filterCategory === "all"
        ? loaderData.shopItems
        : loaderData.shopItems.filter((item: any) => item.type === filterCategory);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentStep, setPaymentStep] = useState<"confirm" | "processing" | "success">("confirm");
    const [payUrl, setPayUrl] = useState("");
    const [orderNo, setOrderNo] = useState("");
    const [orderAmount, setOrderAmount] = useState(0);
    const [orderProductName, setOrderProductName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const lastFetcherData = useRef<any>(null);

    // Handle Payment/Purchase
    const handlePurchase = (item: any, type: "goods" | "recharge" | "membership") => {
        // Check if user is logged in
        if (!loaderData.loggedIn) {
            confirmModal({
                title: "需要登录",
                message: "您需要登录才能进行购买。是否前往登录页面？",
                confirmText: "去登录",
                cancelText: "再看看"
            }).then(confirmed => {
                if (confirmed) {
                    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
                }
            });
            return;
        }

        setSelectedItem({ ...item, type });

        if (type === "goods") {
            // For goods, show the old confirmation modal (payment with coins)
            setPaymentStep("confirm");
            setPaymentModalOpen(true);
        } else if (type === "recharge") {
            // For recharge, directly call API to get order and payUrl
            fetcher.submit(
                { packageId: item.id },
                { method: "post", action: "/api/wallet/recharge" }
            );
        } else if (type === "membership") {
            // For membership, directly call API to get order and payUrl
            fetcher.submit(
                { action: "subscribe", tierId: item.id, period: "monthly" },
                { method: "post", action: "/api/subscription" }
            );
        }
    };

    const confirmPayment = () => {
        setPaymentStep("processing");

        if (selectedItem.type === "goods") {
            // Direct purchase with coins
            fetcher.submit(
                { itemId: selectedItem.id },
                { method: "post", action: "/api/shop/purchase" }
            );
        }
        // Note: recharge and membership are handled directly in handlePurchase now
    };

    // Watch for fetcher response
    useEffect(() => {
        // Only process if fetcher is idle and data is new
        if (fetcher.state === "idle" && fetcher.data && fetcher.data !== lastFetcherData.current) {
            lastFetcherData.current = fetcher.data;
            setIsSubmitting(false);

            if (fetcher.data.success) {
                if (selectedItem?.type === "goods") {
                    setPaymentStep("success");
                    setTimeout(() => {
                        setPaymentModalOpen(false);
                        window.location.reload(); // Refresh to update coin balance
                    }, 2000);
                } else if (fetcher.data.payUrl && fetcher.data.order) {
                    // Store order info and show MockPaymentModal
                    setPayUrl(fetcher.data.payUrl);
                    setOrderNo(fetcher.data.order.order_no);
                    setOrderAmount(fetcher.data.order.amount);
                    setOrderProductName(fetcher.data.order.product_name);
                    setPaymentModalOpen(true);
                    setPaymentStep("confirm");
                }
            } else if (fetcher.data.error) {
                toast.error(fetcher.data.error);
                setPaymentModalOpen(false);
            }
        }
    }, [fetcher.state, fetcher.data, selectedItem?.type]);

    // Success Message from Redirect
    const showSuccess = searchParams.get("status") === "success";

    return (
        <>
            <ClientOnly>
                {() => <StatusHUD user={{
                    avatar: user?.avatar_url,
                    uid: user ? `UID-${user.id.toString().padStart(6, '0')}` : "UID-000000",
                    level: stats.level,
                    name: user?.username || "Traveler",
                    exp: stats.exp,
                    maxExp: stats.maxExp,
                    tier: loaderData.tier
                }} stats={{ coins: stats.coins }} />}
            </ClientOnly>
            <NavMenu />

            <div className="absolute inset-0 flex items-center justify-center pl-24 pr-8 pt-24 pb-8 pointer-events-none">
                <div className="w-full h-full max-w-6xl pointer-events-auto flex flex-col gap-6">

                    {/* Header & Tabs */}
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-white font-display tracking-wider flex items-center gap-3">
                            <ShoppingBag className="text-yellow-500" />
                            SUPPLY DEPOT
                        </h1>
                        <div className="flex bg-black/40 backdrop-blur-md rounded-xl p-1 border border-white/10">
                            {[
                                { id: "goods", label: "道具商店", icon: Star },
                                { id: "recharge", label: "星尘充值", icon: Zap },
                                { id: "membership", label: "会员订阅", icon: Crown },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`
                                        flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all
                                        ${activeTab === tab.id
                                            ? "bg-white text-slate-900 shadow-lg"
                                            : "text-white/80 hover:text-white hover:bg-white/10"
                                        }
                                    `}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Success Notification */}
                    <AnimatePresence>
                        {showSuccess && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl flex items-center gap-3 font-bold"
                            >
                                <CheckCircle size={20} />
                                支付成功！物品已发放至您的账户。
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Content Area */}
                    <div className="flex-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-y-auto custom-scrollbar">
                        <AnimatePresence mode="wait">

                            {/* GOODS TAB */}
                            {activeTab === "goods" && (
                                <motion.div
                                    key="goods"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {/* 分类筛选标签 */}
                                    <div className="flex gap-2 flex-wrap">
                                        {Object.entries(CATEGORY_MAP).map(([key, label]) => (
                                            <button
                                                key={key}
                                                onClick={() => setFilterCategory(key)}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterCategory === key
                                                    ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-lg shadow-pink-500/20"
                                                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* 商品网格 */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                        {filteredItems.map((item: any) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="group bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all hover:border-white/30 flex flex-col relative"
                                            >
                                                {/* HOT 标签 */}
                                                {item.is_featured === 1 && (
                                                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full z-10 shadow-lg">HOT</div>
                                                )}
                                                {/* 折扣标签 */}
                                                {item.original_price && item.original_price > item.price_coins && (
                                                    <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                                                        {Math.round((1 - item.price_coins / item.original_price) * 100)}% OFF
                                                    </div>
                                                )}

                                                <div className="aspect-square rounded-xl bg-black/40 mb-3 flex items-center justify-center overflow-hidden relative group/img">
                                                    {item.image_url ? (
                                                        <OptimizedImage
                                                            src={item.image_url}
                                                            alt={item.name}
                                                            aspectRatio="square"
                                                            className="w-full h-full object-contain group-hover/img:scale-110 transition-transform duration-500 p-4"
                                                        />
                                                    ) : (
                                                        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br transition-all duration-500
                                                            ${item.type === 'avatar_frame' ? 'from-purple-500/20 to-pink-500/20' :
                                                                item.type === 'theme' ? 'from-blue-500/20 to-cyan-500/20' :
                                                                    'from-yellow-500/20 to-orange-500/20'}
                                                        `}>
                                                            <div className="relative">
                                                                <Star size={40} className="text-white/20 animate-pulse" />
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <span className="text-xl opacity-80">
                                                                        {item.type === 'avatar_frame' ? '🖼️' : item.type === 'theme' ? '🎨' : '📦'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* Shine Effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover/img:translate-x-full transition-transform duration-1000" />
                                                </div>

                                                {/* 分类小标签 */}
                                                <div className="mb-2">
                                                    <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                                                        {CATEGORY_MAP[item.type] || item.type}
                                                    </span>
                                                </div>

                                                <h3 className="font-bold text-white text-sm mb-1 line-clamp-1">{item.name}</h3>
                                                <p className="text-[11px] text-white/50 mb-3 line-clamp-2 flex-1">{item.description}</p>

                                                <button
                                                    onClick={() => handlePurchase(item, "goods")}
                                                    className="w-full py-2 bg-white/10 hover:bg-gradient-to-r hover:from-pink-500 hover:to-violet-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                                >
                                                    {item.original_price && item.original_price > item.price_coins && (
                                                        <span className="line-through text-white/30 text-xs">{item.original_price}</span>
                                                    )}
                                                    <span>{item.price_coins}</span>
                                                    <Star size={12} className="fill-current text-yellow-400" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* RECHARGE TAB */}
                            {activeTab === "recharge" && (
                                <motion.div
                                    key="recharge"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="grid grid-cols-3 md:grid-cols-3 gap-5"
                                >
                                    {loaderData.rechargePackages.map((pkg: any) => (
                                        <div key={pkg.id} className="group bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 rounded-2xl p-6 hover:border-yellow-500/50 transition-all flex flex-col items-center text-center relative overflow-hidden">
                                            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            {/* Tag 标签 */}
                                            {pkg.tag && (
                                                <div className={`absolute top-2 right-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full z-10 ${pkg.tag === '至尊' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black'
                                                    : pkg.tag === '巨量' ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white'
                                                        : pkg.tag === '超值' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                                                            : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                                                    }`}>
                                                    {pkg.tag}
                                                </div>
                                            )}
                                            <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center mb-3 text-yellow-400 group-hover:scale-110 transition-transform relative z-10">
                                                <Zap size={28} />
                                            </div>
                                            <h3 className="text-2xl font-bold text-white mb-0.5 font-mono relative z-10">{pkg.coins}</h3>
                                            {pkg.bonus > 0 ? (
                                                <p className="text-xs text-yellow-500/80 mb-4 font-bold relative z-10">+ {pkg.bonus} 赠送</p>
                                            ) : (
                                                <p className="text-xs text-white/30 mb-4 relative z-10">基础包</p>
                                            )}
                                            <button
                                                onClick={() => handlePurchase(pkg, "recharge")}
                                                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold transition-colors relative z-10"
                                            >
                                                {pkg.label}
                                            </button>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {/* MEMBERSHIP TAB */}
                            {activeTab === "membership" && (
                                <motion.div
                                    key="membership"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                                >
                                    {loaderData.tiers.filter((t: any) => t.name !== 'free').map((tier: any) => (
                                        <div key={tier.id} className={`
                                            relative rounded-3xl p-8 border flex flex-col
                                            ${tier.name === 'svip'
                                                ? "bg-gradient-to-b from-slate-900 to-black border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.1)]"
                                                : "bg-black/40 border-white/10"
                                            }
                                        `}>
                                            {tier.name === 'svip' && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-white/5 to-orange-500/10 opacity-30 animate-shimmer pointer-events-none" />
                                            )}
                                            {tier.name === 'svip' && (
                                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black text-xs font-black px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.5)] flex items-center gap-1 z-20">
                                                    <Crown size={12} className="animate-bounce" /> COMMANDER'S CHOICE
                                                </div>
                                            )}

                                            <div className="text-center mb-8">
                                                <h3 className={`text-2xl font-bold mb-2 ${tier.name === 'svip' ? "text-yellow-400" : "text-white"}`}>
                                                    {tier.display_name}
                                                </h3>
                                                <div className="text-3xl font-bold text-white font-mono">
                                                    ¥{(tier.price_monthly / 100).toFixed(0)}<span className="text-sm text-white/40 font-normal">/mo</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4 flex-1 mb-8">
                                                {/* Parse privileges JSON if needed, or hardcode for demo */}
                                                <div className="flex items-center gap-3 text-sm text-white/80">
                                                    <CheckCircle size={16} className="text-green-400" />
                                                    <span>{tier.name === 'svip' ? "无限" : "50次"} AI 对话</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-white/80">
                                                    <CheckCircle size={16} className="text-green-400" />
                                                    <span>{tier.name === 'svip' ? "2.0x" : "1.5x"} 积分倍率</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-white/80">
                                                    <CheckCircle size={16} className="text-green-400" />
                                                    <span>专属身份徽章</span>
                                                </div>
                                                {tier.name === 'svip' && (
                                                    <div className="flex items-center gap-3 text-sm text-white/80">
                                                        <CheckCircle size={16} className="text-green-400" />
                                                        <span>优先技术支持</span>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handlePurchase(tier, "membership")}
                                                className={`
                                                    w-full py-4 rounded-xl font-bold transition-all
                                                    ${tier.name === 'svip'
                                                        ? "bg-gradient-to-r from-yellow-600 to-yellow-400 text-black hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                                                        : "bg-white text-black hover:bg-white/90"
                                                    }
                                                `}
                                            >
                                                立即开通
                                            </button>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Payment Confirmation Modal - Only for GOODS purchases with coins */}
            <AnimatePresence>
                {paymentModalOpen && selectedItem?.type === "goods" && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPaymentModalOpen(false)}
                        />
                        <motion.div
                            className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md relative z-10 shadow-2xl"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <CreditCard className="text-blue-400" />
                                {paymentStep === "confirm" ? "确认订单" : paymentStep === "processing" ? "处理中..." : "支付成功"}
                            </h2>

                            {paymentStep === "confirm" && selectedItem && (
                                <div className="space-y-6">
                                    <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
                                        <div className="w-16 h-16 bg-black/40 rounded-lg flex items-center justify-center overflow-hidden">
                                            {selectedItem.image_url ? (
                                                <OptimizedImage src={selectedItem.image_url} alt={selectedItem.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Zap className="text-yellow-500" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{selectedItem.name || selectedItem.display_name || `充值 ${selectedItem.coins} 星尘`}</div>
                                            <div className="text-sm text-white/80">{selectedItem.description || "即时到账"}</div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm text-white/80 py-4 border-y border-white/10">
                                        <span>应付金额</span>
                                        <span className="text-xl font-bold text-white">
                                            {selectedItem.type === "goods"
                                                ? `${selectedItem.price_coins} 积分`
                                                : `¥ ${(selectedItem.price || selectedItem.price_monthly) / 100}`
                                            }
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setPaymentModalOpen(false)}
                                            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors"
                                        >
                                            取消
                                        </button>
                                        <button
                                            onClick={confirmPayment}
                                            className="py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition-colors shadow-lg shadow-blue-500/20"
                                        >
                                            确认支付
                                        </button>
                                    </div>
                                </div>
                            )}

                            {paymentStep === "processing" && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
                                    <p className="text-white/60">正在连接支付网关...</p>
                                </div>
                            )}

                            {paymentStep === "success" && (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mb-4">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">购买成功!</h3>
                                    <p className="text-white/80 text-center mb-6">物品已发送至您的账户</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Mock Payment Modal for Recharge/Membership */}
            {payUrl && (
                <MockPaymentModal
                    isOpen={paymentModalOpen && (selectedItem?.type === "recharge" || selectedItem?.type === "membership")}
                    onClose={() => {
                        setPaymentModalOpen(false);
                        setPayUrl("");
                    }}
                    orderNo={orderNo}
                    amount={orderAmount}
                    productName={orderProductName}
                    payUrl={payUrl}
                />
            )}
        </>
    );
}

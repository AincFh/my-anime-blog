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

            <div className="w-full max-w-[1400px] mx-auto pt-24 md:pt-32 pb-32 px-4 md:pl-[120px] md:pr-8 flex flex-col gap-8 min-h-screen">
                <div className="w-full h-full flex flex-col gap-8">
                    {/* Header & Tabs - iOS 风格净化 */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-sans font-black tracking-tight text-white mb-2">
                                星尘集市
                            </h1>
                            <p className="text-lg text-white/50 font-medium">选购数字资产与权限</p>
                        </div>
                        
                        {/* iOS Segmented Control */}
                        <div className="inline-flex bg-[#1A1A1A]/80 backdrop-blur-xl rounded-full p-1.5 border border-white/5">
                            {[
                                { id: "goods", label: "道具商店" },
                                { id: "recharge", label: "星尘充值" },
                                { id: "membership", label: "会员订阅" },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`
                                        relative px-6 py-2 rounded-full text-[14px] font-bold transition-all duration-300
                                        ${activeTab === tab.id
                                            ? "text-black"
                                            : "text-white/60 hover:text-white"
                                        }
                                    `}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="shopTabs"
                                            className="absolute inset-0 bg-white rounded-full"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        {tab.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Success Notification */}
                    <AnimatePresence>
                        {showSuccess && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-[#1A1A1A] border border-white/10 text-white px-6 py-4 rounded-2xl flex items-center gap-3 font-medium shadow-2xl"
                            >
                                <CheckCircle size={20} className="text-white" />
                                支付成功！物品已发放至您的账户。
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Content Area - 深空极简画廊 */}
                    <div className="flex-1 pt-4 pb-12">
                        <AnimatePresence mode="wait">
                            {/* GOODS TAB */}
                            {activeTab === "goods" && (
                                <motion.div
                                    key="goods"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    className="space-y-8"
                                >
                                    {/* 优雅分类 */}
                                    <div className="flex gap-2 flex-wrap">
                                        {Object.entries(CATEGORY_MAP).map(([key, label]) => (
                                            <button
                                                key={key}
                                                onClick={() => setFilterCategory(key)}
                                                className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all duration-300 ${filterCategory === key
                                                    ? "bg-white text-black shadow-lg"
                                                    : "bg-[#1A1A1A] text-white/50 hover:bg-[#2A2A2A] hover:text-white border border-white/5"
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                        {filteredItems.map((item: any, index: number) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                                className="group bg-[#0A0A0A] rounded-[28px] p-5 hover:bg-[#121212] transition-colors duration-500 border border-white/5 hover:border-white/10 flex flex-col relative"
                                            >
                                                {/* 极简角标 */}
                                                {item.is_featured === 1 && (
                                                    <div className="absolute top-4 left-4 bg-white text-black text-[10px] font-black px-3 py-1 rounded-full z-10 shadow-lg tracking-wider">FEATURED</div>
                                                )}
                                                {item.original_price && item.original_price > item.price_coins && (
                                                    <div className="absolute top-4 right-4 bg-[#1A1A1A] text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 z-10">
                                                        -{Math.round((1 - item.price_coins / item.original_price) * 100)}%
                                                    </div>
                                                )}

                                                <div className="aspect-square rounded-[20px] bg-[#141414] mb-5 flex items-center justify-center overflow-hidden relative group/img">
                                                    {item.image_url ? (
                                                        <OptimizedImage
                                                            src={item.image_url}
                                                            alt={item.name}
                                                            aspectRatio="square"
                                                            className="w-[70%] h-[70%] object-contain group-hover/img:scale-110 transition-transform duration-700 ease-out"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white/10 group-hover/img:text-white/30 transition-colors duration-500">
                                                            <Star size={48} strokeWidth={1} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mb-3">
                                                    <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
                                                        {CATEGORY_MAP[item.type] || item.type}
                                                    </span>
                                                </div>

                                                <h3 className="font-bold text-white text-base mb-2 line-clamp-1">{item.name}</h3>
                                                <p className="text-[13px] text-white/40 mb-6 line-clamp-2 flex-1 leading-relaxed">{item.description}</p>

                                                <button
                                                    onClick={() => handlePurchase(item, "goods")}
                                                    className="w-full py-3.5 bg-[#1A1A1A] hover:bg-white text-white hover:text-black rounded-full font-bold text-[14px] transition-all duration-300 flex items-center justify-center gap-2 border border-white/5 hover:border-transparent"
                                                >
                                                    {item.original_price && item.original_price > item.price_coins && (
                                                        <span className="line-through opacity-40 text-xs px-1">{item.original_price}</span>
                                                    )}
                                                    <span>{item.price_coins} 星尘</span>
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                    {filteredItems.length === 0 && (
                                         <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <div className="w-20 h-20 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-6 border border-white/5">
                                                <ShoppingBag className="text-white/20" size={32} />
                                            </div>
                                            <p className="text-white/40 font-medium text-lg">该分类下暂无商品</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* RECHARGE TAB */}
                            {activeTab === "recharge" && (
                                <motion.div
                                    key="recharge"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                >
                                    {loaderData.rechargePackages.map((pkg: any, index: number) => (
                                        <div key={pkg.id} className="group bg-[#0A0A0A] border border-white/5 hover:border-white/20 rounded-[32px] p-8 transition-all duration-500 flex flex-col items-center text-center relative overflow-hidden">
                                            {/* 钛金质感极简 Tag */}
                                            {pkg.tag && (
                                                <div className="absolute top-5 right-5 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full z-10 bg-[#1A1A1A] text-white border border-white/10">
                                                    {pkg.tag}
                                                </div>
                                            )}
                                            
                                            <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform duration-500 ease-out border border-white/5">
                                                <Zap size={24} strokeWidth={1.5} />
                                            </div>
                                            <h3 className="text-4xl font-sans font-black tracking-tight text-white mb-2">{pkg.coins}</h3>
                                            
                                            {pkg.bonus > 0 ? (
                                                <p className="text-[13px] text-white/60 mb-8 font-medium bg-[#1A1A1A] px-3 py-1 rounded-full">+ {pkg.bonus} 额外星尘</p>
                                            ) : (
                                                <p className="text-[13px] text-white/30 mb-8 font-medium px-3 py-1">基础包</p>
                                            )}
                                            
                                            <button
                                                onClick={() => handlePurchase(pkg, "recharge")}
                                                className="w-full py-4 bg-white hover:bg-white/90 text-black rounded-full font-bold text-[15px] transition-colors"
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
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    className="grid grid-cols-1 lg:grid-cols-2 lg:max-w-4xl mx-auto gap-8"
                                >
                                    {loaderData.tiers.filter((t: any) => t.name !== 'free').map((tier: any) => (
                                        <div key={tier.id} className={`
                                            relative rounded-[40px] p-10 flex flex-col transition-all duration-500
                                            ${tier.name === 'svip'
                                                ? "bg-white text-black scale-100 lg:scale-105 shadow-2xl z-10"
                                                : "bg-[#0A0A0A] text-white border border-white/10"
                                            }
                                        `}>
                                            {tier.name === 'svip' && (
                                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white text-[11px] font-black tracking-widest px-4 py-2 rounded-full uppercase">
                                                    典藏版
                                                </div>
                                            )}

                                            <div className="text-center mb-10">
                                                <h3 className={`text-2xl font-black tracking-tight mb-4 ${tier.name === 'svip' ? "text-black" : "text-white"}`}>
                                                    {tier.display_name}
                                                </h3>
                                                <div className="flex items-baseline justify-center gap-1">
                                                    <span className="text-2xl font-bold opacity-50">¥</span>
                                                    <span className="text-6xl font-sans font-black tracking-tighter">{(tier.price_monthly / 100).toFixed(0)}</span>
                                                    <span className={`text-base font-medium ${tier.name === 'svip' ? "text-black/50" : "text-white/40"}`}>/mo</span>
                                                </div>
                                            </div>

                                            <div className="space-y-5 flex-1 mb-10">
                                                <div className="flex items-center gap-4 text-[15px] font-medium opacity-80">
                                                    <CheckCircle size={20} strokeWidth={1.5} className={tier.name === 'svip' ? "text-black" : "text-white"} />
                                                    <span>{tier.name === 'svip' ? "无限次" : "50次"} AI 对话额度</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-[15px] font-medium opacity-80">
                                                    <CheckCircle size={20} strokeWidth={1.5} className={tier.name === 'svip' ? "text-black" : "text-white"} />
                                                    <span>{tier.name === 'svip' ? "2.0x" : "1.5x"} 全局积分加成</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-[15px] font-medium opacity-80">
                                                    <CheckCircle size={20} strokeWidth={1.5} className={tier.name === 'svip' ? "text-black" : "text-white"} />
                                                    <span>稀有身份徽章展示</span>
                                                </div>
                                                {tier.name === 'svip' && (
                                                    <div className="flex items-center gap-4 text-[15px] font-medium opacity-80">
                                                        <CheckCircle size={20} strokeWidth={1.5} className="text-black" />
                                                        <span>优先技术支持与特权</span>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handlePurchase(tier, "membership")}
                                                className={`
                                                    w-full py-4 rounded-full font-bold text-[16px] transition-all duration-300
                                                    ${tier.name === 'svip'
                                                        ? "bg-black text-white hover:bg-black/90"
                                                        : "bg-[#1A1A1A] text-white hover:bg-white hover:text-black border border-white/10 hover:border-transparent"
                                                    }
                                                `}
                                            >
                                                立即订阅
                                            </button>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Payment Confirmation Modal - 极简弹窗 */}
            <AnimatePresence>
                {paymentModalOpen && selectedItem?.type === "goods" && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPaymentModalOpen(false)}
                        />
                        <motion.div
                            className="bg-[#121212] border border-white/10 rounded-[40px] p-10 w-full max-w-sm relative z-10 shadow-2xl"
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
                        >
                            <h2 className="text-2xl font-black text-white mb-8 tracking-tight text-center">
                                {paymentStep === "confirm" ? "确认订单" : paymentStep === "processing" ? "处理中..." : "支付成功"}
                            </h2>

                            {paymentStep === "confirm" && selectedItem && (
                                <div className="space-y-8">
                                    <div className="flex flex-col items-center gap-4 text-center">
                                        <div className="w-24 h-24 bg-[#1A1A1A] rounded-[24px] flex items-center justify-center overflow-hidden border border-white/5">
                                            {selectedItem.image_url ? (
                                                <OptimizedImage src={selectedItem.image_url} alt={selectedItem.name} className="w-[70%] h-[70%] object-contain" />
                                            ) : (
                                                <Star className="text-white/40 mb-1" size={32} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-lg">{selectedItem.name || selectedItem.display_name}</div>
                                            <div className="text-sm text-white/50">{selectedItem.description || "数字商品"}</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center py-6 border-y border-white/5">
                                        <span className="text-sm text-white/50 font-medium mb-1">总计</span>
                                        <span className="text-4xl font-black tracking-tight text-white">
                                            {selectedItem.price_coins} <span className="text-xl font-bold opacity-50 font-sans">星尘</span>
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <button
                                            onClick={confirmPayment}
                                            className="w-full py-4 rounded-full bg-white text-black font-bold text-[15px] transition-colors hover:bg-white/90"
                                        >
                                            立即支付
                                        </button>
                                        <button
                                            onClick={() => setPaymentModalOpen(false)}
                                            className="w-full py-4 rounded-full bg-transparent text-white/60 font-bold text-[15px] transition-colors hover:bg-white/5"
                                        >
                                            取消
                                        </button>
                                    </div>
                                </div>
                            )}

                            {paymentStep === "processing" && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 size={40} strokeWidth={1.5} className="text-white animate-spin mb-6" />
                                    <p className="text-white/50 font-medium">正在校验交易...</p>
                                </div>
                            )}

                            {paymentStep === "success" && (
                                <div className="flex flex-col items-center justify-center py-10">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black mb-6">
                                        <CheckCircle size={36} strokeWidth={2} />
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tight text-white mb-2">交易完成</h3>
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

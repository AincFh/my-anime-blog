import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, CreditCard, Crown, Star, Shield, Zap, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLoaderData, useFetcher, useSearchParams, Form, type LoaderFunctionArgs } from "react-router";
import { NavMenu } from "~/components/dashboard/game/NavMenu";
import { StatusHUD } from "~/components/dashboard/game/StatusHUD";
import { ClientOnly } from "~/components/ui/common/ClientOnly";
import { MockPaymentModal } from "~/components/payment/MockPaymentModal";
import { useUser } from "~/hooks/useUser";
import { getSessionToken, verifySession } from "~/services/auth.server";
import { getUserCoins } from "~/services/membership/coins.server";
import { membershipService } from "~/services/membership/membership.server";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import { RECHARGE_PACKAGES } from "~/services/membership/game-config";
import { confirmModal } from "~/components/ui/Modal";
import { toast } from "~/components/ui/Toast";
import { FloatingSubNav } from "~/components/layout/FloatingSubNav";

function isMissingShopSchemaError(e: unknown): boolean {
    const msg = e instanceof Error ? e.message : String(e);
    return msg.includes("no such table");
}

// Loader: Fetch Shop Data
export async function loader({ request, context }: LoaderFunctionArgs) {
    const { anime_db } = context.cloudflare.env as { anime_db: import('~/services/db.server').Database };

    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    let shopItems: Record<string, unknown>[] = [];
    let tiers: Record<string, unknown>[] = [];
    let schemaIncomplete = false;

    try {
        const [shopItemsRes, tiersRes] = await Promise.all([
            anime_db.prepare("SELECT * FROM shop_items WHERE is_active = 1 ORDER BY id DESC").all(),
            membershipService.getAllTiers(anime_db),
        ]);
        shopItems = shopItemsRes?.results || [];
        // 转换 tiers 为兼容格式
        tiers = tiersRes.map((t) => ({
          id: t.tier_id,
          tier_id: t.tier_id,
          tier_level: t.tier_level,
          tier_name: t.tier_name,
          tier_name_en: t.tier_name_en,
          name: t.tier_name,
          display_name: t.tier_name,
          monthly_price_cents: t.monthly_price_cents,
          yearly_price_cents: t.yearly_price_cents,
          price_monthly: t.monthly_price_cents,
          price_yearly: t.yearly_price_cents,
          description: t.description,
          features: JSON.stringify(t.features),
          color_hex: t.color_hex,
          badge_color: t.color_hex,
        }));
    } catch (e) {
        if (isMissingShopSchemaError(e)) {
            schemaIncomplete = true;
            console.warn(
                "[shop] D1 缺少商城/会员表。本地执行: npx wrangler d1 execute YOUR_DB_NAME --local --file=database/migration_006_membership_shop_if_missing.sql"
            );
        } else {
            throw e;
        }
    }

    const rechargePackages = RECHARGE_PACKAGES;

    if (!valid || !user) {
        return {
            loggedIn: false,
            user: null,
            stats: { coins: 0 },
            shopItems,
            tiers,
            rechargePackages,
            schemaIncomplete,
        };
    }

    const coins = await getUserCoins(anime_db, user.id);

    let tierSummary: {
        name: string;
        display_name: string;
        badge_color: string | null;
        privileges: Record<string, unknown>;
    } | null = null;

    try {
        const userMembership = await membershipService.getUserMembership(anime_db, user.id);
        if (userMembership) {
            tierSummary = {
                name: userMembership.tier_name,
                display_name: userMembership.tier_name,
                badge_color: userMembership.color_hex,
                privileges: {},
            };
        }
    } catch (e) {
        if (isMissingShopSchemaError(e)) {
            schemaIncomplete = true;
        } else {
            throw e;
        }
    }

    return {
        loggedIn: true,
        user: {
            ...user,
            avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
        },
        tier: tierSummary,
        stats: { coins },
        shopItems,
        tiers,
        rechargePackages,
        schemaIncomplete,
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

    const [selectedItem, setSelectedItem] = useState<Record<string, unknown> | null>(null);
    type TabId = "goods" | "recharge" | "membership";
    const [activeTab, setActiveTab] = useState<TabId>(() => {
        const tabParam = searchParams.get("tab");
        if (tabParam === "recharge" || tabParam === "membership") return tabParam;
        return "goods";
    });
    const [filterCategory, setFilterCategory] = useState("all");

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
        : loaderData.shopItems.filter((item: Record<string, unknown>) => item.type === filterCategory);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentStep, setPaymentStep] = useState<"confirm" | "processing" | "success">("confirm");
    const [payUrl, setPayUrl] = useState("");
    const [orderNo, setOrderNo] = useState("");
    const [orderAmount, setOrderAmount] = useState(0);
    const [orderProductName, setOrderProductName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const lastFetcherData = useRef<Record<string, unknown> | null>(null);

    // Handle Payment/Purchase
    const handlePurchase = (item: Record<string, unknown>, type: "goods" | "recharge" | "membership") => {
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
            {/* 灵动岛导航 */}
            <FloatingSubNav
                title="星尘集市"
                rightContent={
                    <button className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-all active:scale-95">
                        <ShoppingBag className="w-5 h-5" />
                    </button>
                }
            />

            <ClientOnly>
                                    {() => <div className="fixed inset-0 z-[-1] bg-slate-900/60 backdrop-blur-xl" />}
            </ClientOnly>

            <div className="w-full h-screen overflow-y-auto pt-20 md:pt-24 pb-[calc(env(safe-area-inset-bottom)+8rem)] px-4 md:px-12 flex flex-col gap-8 scroll-smooth">
                <div className="w-full h-full flex flex-col gap-8">
                    {/* Header & Tabs - iOS 风格净化 */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-sans font-black tracking-tight bg-gradient-to-br from-white via-white/90 to-white/40 bg-clip-text text-transparent mb-2">
                                星尘集市
                            </h1>
                            <p className="text-lg text-white/50 font-medium">选购数字资产与尊享权限</p>
                        </div>
                        
                        {/* iOS Segmented Control */}
                        <div className="w-full md:w-auto overflow-x-auto hide-scrollbar pb-2 md:pb-0">
                            <div className="inline-flex shrink-0 bg-white/[0.03] backdrop-blur-2xl rounded-full p-1.5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                                {[
                                    { id: "goods", label: "道具商店" },
                                { id: "recharge", label: "星尘充值" },
                                { id: "membership", label: "会员订阅" },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabId)}
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
                                    <span className="relative z-10 flex items-center gap-2 shrink-0">
                                        {tab.label}
                                    </span>
                                </button>
                            ))}
                            </div>
                        </div>
                    </div>

                    {loaderData.schemaIncomplete && (
                        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90 flex items-start gap-3">
                            <AlertCircle className="shrink-0 mt-0.5" size={18} />
                            <div>
                                <p className="font-semibold text-amber-50">商城数据库表尚未初始化</p>
                                <p className="text-amber-100/70 mt-1">
                                    本地请在项目根目录执行：
                                    <code className="mx-1 rounded bg-black/30 px-1.5 py-0.5 text-xs">
                                        npx wrangler d1 execute YOUR_DB_NAME --local --file=database/migration_006_membership_shop_if_missing.sql
                                    </code>
                                </p>
                            </div>
                        </div>
                    )}

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
                                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                                        {Object.entries(CATEGORY_MAP).map(([key, label]) => (
                                            <button
                                                key={key}
                                                onClick={() => setFilterCategory(key)}
                                                className={`shrink-0 px-5 py-2.5 rounded-full text-[13px] font-bold transition-all duration-300 ${filterCategory === key
                                                    ? "bg-white text-black shadow-lg"
                                                    : "bg-[#1A1A1A] text-white/50 hover:bg-[#2A2A2A] hover:text-white border border-white/5"
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                        {filteredItems.map((item: Record<string, unknown>, index: number) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                                className="group bg-white/15 backdrop-blur-xl rounded-2xl p-5 hover:bg-white/[0.06] transition-all duration-500 border border-white/20 hover:border-white/[0.15] hover:shadow-[0_0_40px_rgba(255,255,255,0.05)] hover:-translate-y-1 flex flex-col relative overflow-hidden"
                                            >
                                                {/* 极简角标 */}
                                                {item.is_featured === 1 && (
                                                    <div className="absolute top-4 left-4 bg-white text-black text-[10px] font-black px-3 py-1 rounded-full z-10 shadow-lg tracking-wider">FEATURED</div>
                                                )}
                                                {item.original_price && item.original_price > item.price_coins && (
                                                    <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20 z-10 shadow-lg">
                                                        -{Math.round((1 - item.price_coins / item.original_price) * 100)}%
                                                    </div>
                                                )}

                                                <div className="aspect-square rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent mb-5 flex items-center justify-center overflow-hidden relative group/img border border-white/10 shadow-inner">
                                                    {item.image_url ? (
                                                        <OptimizedImage
                                                            src={item.image_url}
                                                            alt={item.name}
                                                            aspectRatio="square"
                                                            className="w-[70%] h-[70%] object-contain group-hover/img:scale-110 group-hover/img:rotate-1 transition-transform duration-700 ease-out drop-shadow-2xl"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white/10 group-hover/img:text-white/30 transition-colors duration-500">
                                                            <Star size={48} strokeWidth={1} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mb-3">
                                                    <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                                                        {CATEGORY_MAP[item.type] || item.type}
                                                    </span>
                                                </div>

                                                <h3 className="font-bold text-white text-base mb-2 line-clamp-1">{item.name}</h3>
                                                <p className="text-[13px] text-white/60 mb-6 line-clamp-2 flex-1 leading-relaxed">{item.description}</p>

                                                <button
                                                    onClick={() => handlePurchase(item, "goods")}
                                                    className="w-full py-4 bg-white/5 hover:bg-white text-white hover:text-black rounded-full font-bold text-[14px] transition-all duration-300 flex items-center justify-center gap-2 border border-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98]"
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
                                    {loaderData.rechargePackages.map((pkg: Record<string, unknown>, index: number) => (
                                        <div key={pkg.id} className="group bg-white/15 border border-white/20 hover:border-white/30 backdrop-blur-xl rounded-2xl p-8 transition-all duration-500 hover:shadow-[0_0_50px_rgba(255,255,255,0.05)] hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden">
                                            {/* Ambient Glow */}
                                            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                            {/* 钛金质感极简 Tag */}
                                            {pkg.tag && (
                                                <div className="absolute top-5 right-5 text-[10px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full z-10 bg-white/20 backdrop-blur-xl text-white border border-white/30 shadow-xl">
                                                    {pkg.tag}
                                                </div>
                                            )}
                                            
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md flex items-center justify-center mb-6 text-white group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500 ease-out border border-white/20 shadow-inner relative z-10">
                                                <Zap size={24} strokeWidth={1.5} />
                                            </div>
                                            <h3 className="text-4xl font-sans font-black tracking-tight text-white mb-2 relative z-10">{pkg.coins}</h3>
                                            
                                            {pkg.bonus > 0 ? (
                                                <p className="text-[13px] text-emerald-400 mb-8 font-bold bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full relative z-10">+ {pkg.bonus} 额外星尘</p>
                                            ) : (
                                                <p className="text-[13px] text-white/90 mb-8 font-medium px-3 py-1 relative z-10">基础包</p>
                                            )}
                                            
                                            <button
                                                onClick={() => handlePurchase(pkg, "recharge")}
                                                className="w-full py-4 bg-white/10 hover:bg-white text-white hover:text-black rounded-full font-bold text-[15px] transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] border border-white/20 relative z-10"
                                            >
                                                {pkg.label}
                                            </button>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {/* MEMBERSHIP TAB - 新四级会员体系 */}
                            {activeTab === "membership" && (
                                <motion.div
                                    key="membership"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    {/* 页面标题 */}
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-white mb-2">星际会员</h3>
                                        <p className="text-white/60">选择最适合您的会员等级</p>
                                    </div>

                                    {/* 会员等级卡片网格 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {loaderData.tiers
                                            .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.tier_level ?? a.sort_order ?? 0) - (b.tier_level ?? b.sort_order ?? 0))
                                            .map((tier: Record<string, unknown>) => {
                                                const tierLevel = tier.tier_level ?? tier.sort_order ?? 0;
                                                const tierName = tier.tier_name ?? tier.display_name ?? tier.name ?? "";
                                                const tierNameEn = tier.tier_name_en ?? "";
                                                const monthlyPrice = tier.monthly_price_cents ?? tier.price_monthly ?? 0;
                                                const yearlyPrice = tier.yearly_price_cents ?? tier.price_yearly ?? 0;
                                                const description = tier.description ?? "";
                                                const colorHex = tier.color_hex ?? tier.badge_color ?? "#6B7280";

                                                // 解析 features
                                                let features: string[] = [];
                                                if (tier.features) {
                                                    try {
                                                        features = JSON.parse(tier.features);
                                                    } catch {
                                                        if (typeof tier.features === "string" && tier.features.includes(",")) {
                                                            features = tier.features.split(",");
                                                        }
                                                    }
                                                } else if (tier.privileges) {
                                                    try {
                                                        const privs = JSON.parse(tier.privileges);
                                                        features = Object.entries(privs)
                                                            .filter(([_, v]) => v !== false && v !== 0)
                                                            .map(([k]) => k);
                                                    } catch {
                                                        features = [];
                                                    }
                                                }

                                                const isPopular = tierLevel === 2;
                                                const isFree = tierLevel === 0 || tierName === "free";

                                                // 获取等级图标
                                                const icons = [Star, Moon, Zap, Crown];
                                                const Icon = icons[tierLevel] || Star;

                                                return (
                                                    <div
                                                        key={tier.id ?? tier.tier_id}
                                                        className={`
                                                            relative rounded-2xl backdrop-blur-xl border transition-all duration-300 overflow-hidden
                                                            ${isPopular
                                                                ? `bg-gradient-to-b from-blue-500/20 to-purple-500/10 border-yellow-500/40 scale-105 shadow-[0_0_40px_rgba(245,158,11,0.15)] z-10`
                                                                : isFree
                                                                    ? "bg-white/5 border-white/10"
                                                                    : "bg-white/10 border-white/20 hover:border-white/30"
                                                            }
                                                        `}
                                                    >
                                                        {/* 推荐标记 */}
                                                        {isPopular && (
                                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full text-xs font-bold text-black shadow-lg z-20">
                                                                推荐
                                                            </div>
                                                        )}

                                                        {/* 等级图标 */}
                                                        <div className="flex justify-center pt-8 pb-4">
                                                            <div
                                                                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                                                style={{ backgroundColor: `${colorHex}20` }}
                                                            >
                                                                <Icon size={32} style={{ color: colorHex }} />
                                                            </div>
                                                        </div>

                                                        {/* 等级名称 */}
                                                        <div className="text-center mb-4 px-4">
                                                            <h4 className="text-xl font-bold text-white mb-1">{tierName}</h4>
                                                            {tierNameEn && (
                                                                <p className="text-sm text-white/50">{tierNameEn}</p>
                                                            )}
                                                        </div>

                                                        {/* 价格 */}
                                                        <div className="text-center mb-4 px-4">
                                                            {isFree ? (
                                                                <div className="text-2xl font-bold text-white">免费</div>
                                                            ) : (
                                                                <>
                                                                    <div className="flex items-baseline justify-center gap-1">
                                                                        <span className="text-2xl font-bold text-white">¥{(monthlyPrice / 100).toFixed(0)}</span>
                                                                        <span className="text-white/60">/月</span>
                                                                    </div>
                                                                    {yearlyPrice > 0 && (
                                                                        <p className="text-xs text-white/40 mt-1">
                                                                            或 ¥{(yearlyPrice / 100).toFixed(0)}/年
                                                                        </p>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* 简介 */}
                                                        {description && (
                                                            <p className="text-sm text-white/70 text-center mb-4 px-4">
                                                                {description}
                                                            </p>
                                                        )}

                                                        {/* 功能列表 */}
                                                        {features.length > 0 && (
                                                            <ul className="space-y-2 mb-6 px-4 text-sm">
                                                                {features.slice(0, 4).map((feature: string, idx: number) => (
                                                                    <li key={idx} className="flex items-start gap-2">
                                                                        <CheckCircle
                                                                            size={16}
                                                                            className="mt-0.5 flex-shrink-0"
                                                                            style={{ color: colorHex }}
                                                                        />
                                                                        <span className="text-white/80">{feature}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}

                                                        {/* 操作按钮 */}
                                                        <div className="px-4 pb-6">
                                                            <button
                                                                onClick={() => handlePurchase({ ...tier, type: "membership" }, "membership")}
                                                                className={`
                                                                    w-full py-3 rounded-xl font-bold transition-all duration-300
                                                                    ${isFree
                                                                        ? "bg-white/10 text-white/60 hover:bg-white/15 cursor-default"
                                                                        : `text-white hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]`
                                                                    }
                                                                `}
                                                                style={
                                                                    !isFree
                                                                        ? { background: `linear-gradient(to right, ${colorHex}, ${colorHex}cc)` }
                                                                        : undefined
                                                                }
                                                            >
                                                                {isFree ? "免费体验" : "立即订阅"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>

                                    {/* 会员特权对比 */}
                                    <div className="mt-12 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                                        <h4 className="text-lg font-bold text-white mb-4 text-center">会员特权对比</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-white/10">
                                                        <th className="text-left py-3 px-4 text-white/60 font-medium">特权</th>
                                                        <th className="text-center py-3 px-4 text-white/60 font-medium">旅行者</th>
                                                        <th className="text-center py-3 px-4 text-purple-400 font-medium">月之子</th>
                                                        <th className="text-center py-3 px-4 text-blue-400 font-medium">星之守护者</th>
                                                        <th className="text-center py-3 px-4 text-yellow-400 font-medium">银河领主</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="border-b border-white/5">
                                                        <td className="py-3 px-4 text-white/80">无广告</td>
                                                        <td className="py-3 px-4 text-center text-white/40">—</td>
                                                        <td className="py-3 px-4 text-center"><CheckCircle size={16} className="inline text-green-400" /></td>
                                                        <td className="py-3 px-4 text-center"><CheckCircle size={16} className="inline text-green-400" /></td>
                                                        <td className="py-3 px-4 text-center"><CheckCircle size={16} className="inline text-green-400" /></td>
                                                    </tr>
                                                    <tr className="border-b border-white/5">
                                                        <td className="py-3 px-4 text-white/80">云端收藏夹</td>
                                                        <td className="py-3 px-4 text-center text-white/40">50条</td>
                                                        <td className="py-3 px-4 text-center text-white/80">200条</td>
                                                        <td className="py-3 px-4 text-center text-white/80">500条</td>
                                                        <td className="py-3 px-4 text-center text-yellow-400">无限</td>
                                                    </tr>
                                                    <tr className="border-b border-white/5">
                                                        <td className="py-3 px-4 text-white/80">星尘倍率</td>
                                                        <td className="py-3 px-4 text-center text-white/40">1x</td>
                                                        <td className="py-3 px-4 text-center text-white/80">2x</td>
                                                        <td className="py-3 px-4 text-center text-white/80">3x</td>
                                                        <td className="py-3 px-4 text-center text-yellow-400">5x</td>
                                                    </tr>
                                                    <tr className="border-b border-white/5">
                                                        <td className="py-3 px-4 text-white/80">付费内容</td>
                                                        <td className="py-3 px-4 text-center text-white/40">—</td>
                                                        <td className="py-3 px-4 text-center text-white/40">—</td>
                                                        <td className="py-3 px-4 text-center text-white/80">抢先看</td>
                                                        <td className="py-3 px-4 text-center text-yellow-400">完全解锁</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-3 px-4 text-white/80">专属头像框</td>
                                                        <td className="py-3 px-4 text-center text-white/40">—</td>
                                                        <td className="py-3 px-4 text-center text-white/80">基础</td>
                                                        <td className="py-3 px-4 text-center text-white/80">高级</td>
                                                        <td className="py-3 px-4 text-center text-yellow-400">限定</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
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
                            className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 w-full max-w-sm relative z-10 shadow-[0_0_100px_rgba(255,255,255,0.05)] overflow-hidden"
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
                        >
                            {/* Noise texture overlay */}
                            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />

                            <h2 className="text-2xl font-black text-white mb-8 tracking-tight text-center relative z-10">
                                {paymentStep === "confirm" ? "确认订单" : paymentStep === "processing" ? "处理中..." : "支付成功"}
                            </h2>

                            {paymentStep === "confirm" && selectedItem && (
                                <div className="space-y-8 relative z-10">
                                    <div className="flex flex-col items-center gap-4 text-center">
                                        <div className="w-24 h-24 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
                                            {selectedItem.image_url ? (
                                                <OptimizedImage src={selectedItem.image_url} alt={selectedItem.name} className="w-[75%] h-[75%] object-contain drop-shadow-2xl" />
                                            ) : (
                                                <Star className="text-white/40 mb-1" size={32} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-lg">{selectedItem.name || selectedItem.display_name}</div>
                                            <div className="text-sm text-white/50">{selectedItem.description || "数字商品"}</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center py-6 border-y border-white/10">
                                        <span className="text-sm text-white/50 font-medium mb-1">总计</span>
                                        <span className="text-5xl font-black tracking-tight text-white mb-2">
                                            {selectedItem.price_coins} <span className="text-xl font-bold opacity-50 font-sans">星尘</span>
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <button
                                            onClick={confirmPayment}
                                            className="w-full py-4 rounded-full bg-white text-black font-bold text-[15px] transition-all duration-300 hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/20"
                                        >
                                            通过余额支付
                                        </button>
                                        <button
                                            onClick={() => setPaymentModalOpen(false)}
                                            className="w-full py-4 rounded-full bg-transparent text-white/60 font-bold text-[15px] transition-colors hover:bg-white/10"
                                        >
                                            放弃操作
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

export function ErrorBoundary({ error }: { error?: unknown }) {
  let message = "商店加载失败";
  let details = "无法显示商店内容，请稍后重试";
  let stack: string | undefined;

  if (error instanceof Error) {
    details = error.message;
    if (import.meta.env.DEV) {
      stack = error.stack;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-red-400 mb-4">{message}</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">{details}</p>
        {stack && import.meta.env.DEV && (
          <pre className="text-xs text-left bg-slate-900 text-red-300 p-4 rounded-lg overflow-x-auto max-w-2xl">{stack}</pre>
        )}
        <a href="/shop" className="mt-4 inline-block px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
          刷新商店
        </a>
      </div>
    </div>
  );
}

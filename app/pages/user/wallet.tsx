/**
 * 钱包充值页面
 * 展示用户余额、交易记录和充值档位
 */

import type { Route } from "./+types/wallet";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Sparkles, ArrowUp, ArrowDown, Clock, Gift, ChevronRight, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { RECHARGE_PACKAGES } from "~/config/game";
import { toast } from "~/components/ui/Toast";

// ==================== 数据加载 ====================

export async function loader({ request, context }: Route.LoaderArgs) {
    const { getSessionToken, verifySession } = await import("~/services/auth.server");
    const { getUserCoins, getCoinTransactionHistory } = await import("~/services/membership/coins.server");

    const env = (context as any).cloudflare.env;
    const { anime_db } = env;

    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        throw new Response(null, { status: 302, headers: { Location: "/login" } });
    }

    const balance = await getUserCoins(anime_db, user.id);
    const transactions = await getCoinTransactionHistory(anime_db, user.id, 30, 0);

    return { balance, transactions, packages: RECHARGE_PACKAGES };
}

// ==================== 充值下单 ====================

export async function action({ request, context }: Route.ActionArgs) {
    const { getSessionToken, verifySession } = await import("~/services/auth.server");
    const { createPaymentOrder } = await import("~/services/payment/gateway.server");
    const { generateSecurePayUrl } = await import("~/services/payment/signature.server");

    const env = (context as any).cloudflare.env;
    const { anime_db } = env;

    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return Response.json({ success: false, error: "请先登录" }, { status: 401 });
    }

    const formData = await request.formData();
    const packageId = formData.get("packageId") as string;

    const pkg = RECHARGE_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
        return Response.json({ success: false, error: "无效的充值档位" }, { status: 400 });
    }

    const totalCoins = pkg.coins + pkg.bonus;
    const clientIp = request.headers.get("CF-Connecting-IP") || undefined;
    const userAgent = request.headers.get("User-Agent") || undefined;

    const orderResult = await createPaymentOrder(anime_db, {
        userId: user.id,
        amount: pkg.price,
        productType: "coins",
        productId: String(totalCoins),
        productName: `星尘充值 ${totalCoins} (含赠送${pkg.bonus})`,
        paymentMethod: "mock",
        clientIp,
        userAgent,
    });

    if (!orderResult.success) {
        return Response.json({ success: false, error: orderResult.error }, { status: 500 });
    }

    const secretKey = env.PAYMENT_SECRET || "dev-secret-key";
    const payUrl = await generateSecurePayUrl(
        "/api/payment/mock-complete",
        orderResult.order!.order_no,
        pkg.price,
        user.id,
        secretKey
    );

    return Response.json({ success: true, payUrl });
}

// ==================== 界面组件 ====================

const SOURCE_LABELS: Record<string, string> = {
    daily_signin: "每日签到",
    daily_login: "登录奖励",
    purchase: "充值",
    shop: "商城购买",
    activity: "活动奖励",
    referral: "邀请好友",
    achievement: "成就奖励",
    admin: "管理员操作",
    refund: "退款",
};

export default function WalletPage({ loaderData }: Route.ComponentProps) {
    const { balance, transactions, packages } = loaderData;
    const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<"recharge" | "history">("recharge");
    const navigate = useNavigate();

    async function handleRecharge() {
        if (!selectedPkg || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const form = new FormData();
            form.append("packageId", selectedPkg);
            const resp = await fetch("/wallet", { method: "POST", body: form });
            const data = (await resp.json()) as any;
            if (data.success && data.payUrl) {
                window.location.href = data.payUrl;
            } else {
                toast.error(data.error || "充值失败，请稍后再试");
            }
        } catch {
            toast.error("网络错误，请稍后再试");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-8">

                {/* 余额卡片 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-8 text-white shadow-2xl shadow-orange-500/30"
                >
                    <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -left-4 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1 text-white/80 text-sm font-medium">
                            <Wallet className="w-4 h-4" />
                            我的星尘余额
                        </div>
                        <div className="flex items-end gap-3 mb-6">
                            <span className="text-6xl font-black tracking-tight tabular-nums">
                                {balance.toLocaleString()}
                            </span>
                            <span className="text-lg text-white/70 mb-2">✦ 星尘</span>
                        </div>
                        <p className="text-xs text-white/60">
                            星尘为站内虚拟货币，充值后不支持退款。可在积分商城兑换头像框、主题皮肤等。
                        </p>
                    </div>
                </motion.div>

                {/* 标签切换 */}
                <div className="flex gap-1 bg-white/5 border border-white/10 rounded-2xl p-1">
                    {[
                        { key: "recharge" as const, label: "充值星尘", icon: Zap },
                        { key: "history" as const, label: "交易记录", icon: Clock },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key
                                ? "bg-white/10 text-white shadow-lg"
                                : "text-white/40 hover:text-white/60"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "recharge" ? (
                        <motion.div
                            key="recharge"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {/* 充值档位 */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {packages.map((pkg: any) => {
                                    const isSelected = selectedPkg === pkg.id;
                                    return (
                                        <motion.button
                                            key={pkg.id}
                                            onClick={() => setSelectedPkg(pkg.id)}
                                            whileTap={{ scale: 0.95 }}
                                            className={`relative p-4 rounded-2xl border-2 transition-all text-center ${isSelected
                                                ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-500/20"
                                                : "border-white/10 bg-white/5 hover:border-white/20"
                                                }`}
                                        >
                                            {pkg.bonus > 0 && (
                                                <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                                    <Gift className="w-3 h-3" />
                                                    送{pkg.bonus}
                                                </div>
                                            )}
                                            <div className="text-2xl font-black text-white mb-1">
                                                {pkg.coins}
                                            </div>
                                            <div className="text-xs text-white/40 mb-3">星尘</div>
                                            <div className="text-sm font-bold text-amber-400">
                                                ¥{(pkg.price / 100).toFixed(0)}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* 充值按钮 */}
                            <motion.button
                                onClick={handleRecharge}
                                disabled={!selectedPkg || isSubmitting}
                                whileTap={{ scale: 0.97 }}
                                className={`w-full py-4 rounded-2xl text-lg font-black transition-all flex items-center justify-center gap-2 ${selectedPkg
                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl"
                                    : "bg-white/5 text-white/20 cursor-not-allowed"
                                    }`}
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        {selectedPkg ? "立即充值" : "请选择充值档位"}
                                    </>
                                )}
                            </motion.button>

                            <p className="text-center text-xs text-white/30">
                                充值即表示同意《虚拟货币服务条款》，充值后不支持退款
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-3"
                        >
                            {transactions.length === 0 ? (
                                <div className="text-center py-16 text-white/30">
                                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                    <p>暂无交易记录</p>
                                </div>
                            ) : (
                                transactions.map((tx: any, idx: number) => {
                                    const isEarn = tx.type === "earn" || tx.type === "refund";
                                    return (
                                        <motion.div
                                            key={tx.id || idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEarn ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                                    }`}>
                                                    {isEarn ? <ArrowDown className="w-5 h-5" /> : <ArrowUp className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white/90">
                                                        {SOURCE_LABELS[tx.source] || tx.source}
                                                    </p>
                                                    <p className="text-xs text-white/30">
                                                        {tx.description || tx.created_at}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`text-lg font-bold tabular-nums ${isEarn ? "text-emerald-400" : "text-rose-400"
                                                }`}>
                                                {isEarn ? "+" : "-"}{Math.abs(tx.amount)}
                                            </span>
                                        </motion.div>
                                    );
                                })
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

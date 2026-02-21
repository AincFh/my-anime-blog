import { motion } from "framer-motion";
import { Crown, Calendar, CreditCard, RefreshCw, XCircle, CheckCircle, Clock, ChevronRight, ShieldCheck, History } from "lucide-react";
import { useState, useEffect } from "react";
import { useLoaderData, useFetcher, Link } from "react-router";
import { NavMenu } from "~/components/dashboard/game/NavMenu";
import { StatusHUD } from "~/components/dashboard/game/StatusHUD";
import { ClientOnly } from "~/components/common/ClientOnly";
import { PrivilegeComparisonTable } from "~/components/membership/PrivilegeComparisonTable";
import { useUser } from "~/hooks/useUser";
import { getSessionToken, verifySession } from "~/services/auth.server";
import { getUserCoins } from "~/services/membership/coins.server";
import { getUserSubscription } from "~/services/membership/subscription.server";
import { getAllTiers } from "~/services/membership/tier.server";

export async function loader({ request, context }: { request: Request; context: any }) {
    const { anime_db } = context.cloudflare.env;

    // 会员等级对所有人可见
    const tiers = await getAllTiers(anime_db);

    // 登录态 — 额外获取订阅状态和支付历史
    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
        return { loggedIn: false, user: null, stats: { coins: 0 }, subscription: null, tiers, paymentHistory: [] };
    }

    const [coins, subscription, paymentHistoryResult] = await Promise.all([
        getUserCoins(anime_db, user.id),
        getUserSubscription(anime_db, user.id),
        anime_db.prepare(`
            SELECT order_no, amount, product_name, status, paid_at, created_at 
            FROM payment_orders 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 10
        `).bind(user.id).all()
    ]);

    return {
        loggedIn: true,
        user: { ...user, avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}` },
        stats: { coins },
        subscription,
        tiers,
        paymentHistory: paymentHistoryResult.results || []
    };
}

export default function MembershipPage() {
    const loaderData = useLoaderData<typeof loader>();
    const { user: clientUser } = useUser();
    const fetcher = useFetcher();

    const user = loaderData.user || clientUser;
    const stats = {
        coins: loaderData.stats.coins,
        level: user?.level || 1,
        exp: user?.exp || 0,
        maxExp: (user?.level || 1) * 100,
    };

    const subscription = loaderData.subscription;
    const isSubscribed = subscription && subscription.status === "active";

    // Format date from Unix timestamp
    const formatDate = (ts: number) => {
        if (!ts) return "N/A";
        return new Date(ts * 1000).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
    };

    // Days remaining
    const daysRemaining = subscription?.end_date
        ? Math.max(0, Math.ceil((subscription.end_date * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

    // Handle cancel
    const handleCancelAutoRenew = () => {
        if (!confirm("确定要取消自动续费吗？您的会员权益将在到期后失效。")) return;
        fetcher.submit(
            { action: "cancel", reason: "用户主动取消" },
            { method: "post", action: "/api/subscription" }
        );
    };

    // Handle resume
    const handleResumeAutoRenew = () => {
        fetcher.submit(
            { action: "resume" },
            { method: "post", action: "/api/subscription" }
        );
    };

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
                }} stats={{ coins: stats.coins }} />}
            </ClientOnly>
            <NavMenu />

            <div className="absolute inset-0 flex items-center justify-center pl-24 pr-8 pt-24 pb-8 pointer-events-none">
                <div className="w-full h-full max-w-6xl pointer-events-auto flex flex-col gap-6 overflow-y-auto custom-scrollbar">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-white font-display tracking-wider flex items-center gap-3">
                            <Crown className="text-yellow-500" />
                            会员中心
                        </h1>
                        <Link
                            to="/shop?tab=membership"
                            className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all flex items-center gap-2"
                        >
                            {isSubscribed ? "升级/续费" : "立即开通"}
                            <ChevronRight size={16} />
                        </Link>
                    </div>

                    {/* Current Status Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`
                            rounded-3xl p-8 border relative overflow-hidden
                            ${isSubscribed
                                ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-yellow-500/30"
                                : "bg-black/40 border-white/10"
                            }
                        `}
                    >
                        {/* Background Decoration */}
                        {isSubscribed && (
                            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
                        )}

                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Tier Info */}
                            <div className="flex items-center gap-6">
                                <div className={`
                                    w-20 h-20 rounded-2xl flex items-center justify-center
                                    ${isSubscribed ? "bg-yellow-500/20 text-yellow-400" : "bg-white/10 text-white/40"}
                                `}>
                                    <Crown size={40} />
                                </div>
                                <div>
                                    <div className="text-sm text-white/60 mb-1">当前等级</div>
                                    <div className={`text-2xl font-bold ${isSubscribed ? "text-yellow-400" : "text-white"}`}>
                                        {subscription?.display_name || "普通用户"}
                                    </div>
                                </div>
                            </div>

                            {/* Expiry Info */}
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-white/40">
                                    <Calendar size={32} />
                                </div>
                                <div>
                                    <div className="text-sm text-white/60 mb-1">到期时间</div>
                                    <div className="text-xl font-bold text-white">
                                        {isSubscribed ? formatDate(subscription.end_date) : "—"}
                                    </div>
                                    {isSubscribed && (
                                        <div className={`text-xs mt-1 ${daysRemaining <= 7 ? "text-red-400" : "text-white/40"}`}>
                                            剩余 {daysRemaining} 天
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Auto Renew */}
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-white/40">
                                    <RefreshCw size={32} />
                                </div>
                                <div>
                                    <div className="text-sm text-white/60 mb-1">自动续费</div>
                                    {isSubscribed ? (
                                        subscription.auto_renew ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-400 font-bold flex items-center gap-1"><CheckCircle size={16} /> 已开启</span>
                                                <button
                                                    onClick={handleCancelAutoRenew}
                                                    className="text-xs text-white/40 hover:text-red-400 underline ml-2"
                                                >
                                                    取消
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-white/40 font-bold flex items-center gap-1"><XCircle size={16} /> 已关闭</span>
                                                <button
                                                    onClick={handleResumeAutoRenew}
                                                    className="text-xs text-yellow-400 hover:text-yellow-300 underline ml-2"
                                                >
                                                    恢复
                                                </button>
                                            </div>
                                        )
                                    ) : (
                                        <div className="text-white/40">—</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Privilege Comparison */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
                    >
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <ShieldCheck className="text-blue-400" />
                            权益对比
                        </h2>
                        <PrivilegeComparisonTable />
                    </motion.div>

                    {/* Payment History */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
                    >
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <History className="text-purple-400" />
                            支付历史
                        </h2>
                        {loaderData.paymentHistory.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10 text-white/60">
                                            <th className="text-left py-3 px-4">订单号</th>
                                            <th className="text-left py-3 px-4">商品</th>
                                            <th className="text-right py-3 px-4">金额</th>
                                            <th className="text-center py-3 px-4">状态</th>
                                            <th className="text-right py-3 px-4">时间</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loaderData.paymentHistory.map((order: any) => (
                                            <tr key={order.order_no} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="py-3 px-4 font-mono text-xs text-white/60">{order.order_no}</td>
                                                <td className="py-3 px-4 text-white">{order.product_name}</td>
                                                <td className="py-3 px-4 text-right text-white font-bold">¥{(order.amount / 100).toFixed(2)}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`
                                                        px-2 py-0.5 rounded-full text-xs font-bold
                                                        ${order.status === "paid" ? "bg-green-500/20 text-green-400" : ""}
                                                        ${order.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : ""}
                                                        ${order.status === "failed" ? "bg-red-500/20 text-red-400" : ""}
                                                    `}>
                                                        {order.status === "paid" ? "已支付" : order.status === "pending" ? "待支付" : order.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right text-white/40 text-xs">
                                                    {formatDate(order.paid_at || order.created_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-white/40">
                                <CreditCard size={48} className="mx-auto mb-4 opacity-20" />
                                <p>暂无支付记录</p>
                            </div>
                        )}
                    </motion.div>

                </div>
            </div>
        </>
    );
}

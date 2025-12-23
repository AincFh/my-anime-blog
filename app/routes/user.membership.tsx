/**
 * 会员中心页面
 * 显示会员状态、订阅管理、积分余额
 */

import { useState } from "react";
import { useLoaderData, useFetcher, Link } from "react-router";
import type { Route } from "./+types/user.membership";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Sparkles, Clock, CreditCard, Gift, History, ChevronRight, Check, AlertCircle } from "lucide-react";

export async function loader({ request, context }: Route.LoaderArgs) {
    const { verifySession, getSessionToken } = await import("~/services/auth.server");
    const { getAllTiers, getUserMembershipTier, parsePrivileges } = await import("~/services/membership/tier.server");
    const { getUserSubscription, getUserSubscriptionHistory } = await import("~/services/membership/subscription.server");
    const { getUserCoins, getCoinTransactionHistory } = await import("~/services/membership/coins.server");

    const db = context.cloudflare.env.anime_db;
    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, db);

    if (!valid || !user) {
        throw new Response("Unauthorized", { status: 401 });
    }

    const [tiers, { tier: currentTier }, subscription, coins, coinHistory, subscriptionHistory] = await Promise.all([
        getAllTiers(db),
        getUserMembershipTier(db, user.id),
        getUserSubscription(db, user.id),
        getUserCoins(db, user.id),
        getCoinTransactionHistory(db, user.id, 10),
        getUserSubscriptionHistory(db, user.id, 5),
    ]);

    return {
        user,
        tiers,
        currentTier,
        currentPrivileges: parsePrivileges(currentTier),
        subscription,
        coins,
        coinHistory,
        subscriptionHistory,
    };
}

export async function action({ request, context }: Route.ActionArgs) {
    const { verifySession, getSessionToken } = await import("~/services/auth.server");
    const db = context.cloudflare.env.anime_db;
    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, db);

    if (!valid || !user) {
        return { success: false, error: "请先登录" };
    }

    const formData = await request.formData();
    const action = formData.get("_action");

    if (action === "cancel_subscription") {
        const { cancelSubscription } = await import("~/services/membership/subscription.server");
        const reason = formData.get("reason") as string;
        return cancelSubscription(db, user.id, reason);
    }

    if (action === "resume_auto_renew") {
        const { resumeAutoRenew } = await import("~/services/membership/subscription.server");
        return resumeAutoRenew(db, user.id);
    }

    if (action === "claim_daily") {
        const { claimDailyLoginReward } = await import("~/services/membership/coins.server");
        const { getUserPrivilegeValue } = await import("~/services/membership/tier.server");
        const multiplier = await getUserPrivilegeValue(db, user.id, "coinMultiplier");
        return claimDailyLoginReward(db, user.id, multiplier);
    }

    return { success: false, error: "未知操作" };
}

export default function MembershipPage() {
    const { user, tiers, currentTier, currentPrivileges, subscription, coins, coinHistory, subscriptionHistory } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('zh-CN');
    };

    const formatPrice = (cents: number) => {
        return (cents / 100).toFixed(2);
    };

    return (
        <div className="min-h-screen pt-20 pb-12 px-4">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* 顶部状态卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 当前会员状态 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6 rounded-2xl col-span-1 md:col-span-2"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                    style={{
                                        background: currentTier?.badge_color
                                            ? `linear-gradient(135deg, ${currentTier.badge_color}, ${currentTier.badge_color}88)`
                                            : 'linear-gradient(135deg, #64748b, #64748b88)'
                                    }}
                                >
                                    {currentTier?.name === 'svip' ? (
                                        <Crown className="w-8 h-8 text-white" />
                                    ) : currentTier?.name === 'vip' ? (
                                        <Sparkles className="w-8 h-8 text-white" />
                                    ) : (
                                        <span className="text-2xl">👤</span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                                        {currentTier?.display_name || '普通用户'}
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {subscription
                                            ? `有效期至 ${formatDate(subscription.end_date)}`
                                            : '暂无有效订阅'
                                        }
                                    </p>
                                </div>
                            </div>
                            {subscription && (
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${subscription.auto_renew
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                    {subscription.auto_renew ? '自动续费' : '到期后停止'}
                                </div>
                            )}
                        </div>

                        {/* 权限概览 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: 'AI聊天', value: currentPrivileges.aiChatPerDay === -1 ? '无限' : `${currentPrivileges.aiChatPerDay}次/天` },
                                { label: '积分倍率', value: `${currentPrivileges.coinMultiplier}x` },
                                { label: '去广告', value: currentPrivileges.adFree ? '✓' : '✗' },
                                { label: '优先支持', value: currentPrivileges.prioritySupport ? '✓' : '✗' },
                            ].map((item, i) => (
                                <div key={i} className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* 积分卡片 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-6 rounded-2xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">我的积分</h3>
                            <Gift className="w-5 h-5 text-amber-500" />
                        </div>
                        <p className="text-4xl font-bold text-amber-500 mb-4">{coins.toLocaleString()}</p>
                        <fetcher.Form method="post">
                            <input type="hidden" name="_action" value="claim_daily" />
                            <button
                                type="submit"
                                disabled={fetcher.state !== 'idle'}
                                className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                            >
                                {fetcher.state !== 'idle' ? '领取中...' : '领取每日奖励'}
                            </button>
                        </fetcher.Form>
                        <Link
                            to="/shop"
                            className="block text-center text-sm text-amber-600 dark:text-amber-400 mt-3 hover:underline"
                        >
                            前往积分商城 →
                        </Link>
                    </motion.div>
                </div>

                {/* 会员等级选择 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 rounded-2xl"
                >
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">选择会员等级</h3>

                    {/* 周期选择 */}
                    <div className="flex gap-2 mb-6">
                        {[
                            { key: 'monthly', label: '月付' },
                            { key: 'quarterly', label: '季付', badge: '省15%' },
                            { key: 'yearly', label: '年付', badge: '省30%' },
                        ].map((period) => (
                            <button
                                key={period.key}
                                onClick={() => setSelectedPeriod(period.key as any)}
                                className={`px-4 py-2 rounded-xl font-medium transition-all relative ${selectedPeriod === period.key
                                        ? 'bg-primary-start text-white'
                                        : 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {period.label}
                                {period.badge && (
                                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] rounded-full">
                                        {period.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* 等级卡片 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {tiers.filter(t => t.name !== 'free').map((tier) => {
                            const price = selectedPeriod === 'monthly'
                                ? tier.price_monthly
                                : selectedPeriod === 'quarterly'
                                    ? tier.price_quarterly
                                    : tier.price_yearly;
                            const isCurrentTier = currentTier?.id === tier.id;
                            const privileges = JSON.parse(tier.privileges || '{}');

                            return (
                                <motion.div
                                    key={tier.id}
                                    whileHover={{ scale: 1.02 }}
                                    className={`relative p-6 rounded-2xl border-2 transition-all ${isCurrentTier
                                            ? 'border-primary-start bg-primary-start/5'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-primary-start/50'
                                        }`}
                                >
                                    {tier.name === 'svip' && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                                            推荐
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 mb-4">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: tier.badge_color || '#64748b' }}
                                        >
                                            {tier.name === 'svip' ? (
                                                <Crown className="w-6 h-6 text-white" />
                                            ) : (
                                                <Sparkles className="w-6 h-6 text-white" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-white">{tier.display_name}</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{tier.description}</p>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <span className="text-3xl font-bold text-slate-800 dark:text-white">¥{formatPrice(price)}</span>
                                        <span className="text-sm text-slate-500 dark:text-slate-400">
                                            /{selectedPeriod === 'monthly' ? '月' : selectedPeriod === 'quarterly' ? '季' : '年'}
                                        </span>
                                    </div>

                                    <ul className="space-y-2 mb-6">
                                        {privileges.aiChatPerDay && (
                                            <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                <Check className="w-4 h-4 text-green-500" />
                                                AI聊天 {privileges.aiChatPerDay === -1 ? '无限' : `${privileges.aiChatPerDay}次/天`}
                                            </li>
                                        )}
                                        {privileges.adFree && (
                                            <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                <Check className="w-4 h-4 text-green-500" />
                                                去除广告
                                            </li>
                                        )}
                                        {privileges.download && (
                                            <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                <Check className="w-4 h-4 text-green-500" />
                                                高清下载
                                            </li>
                                        )}
                                        {privileges.exclusiveEffect && (
                                            <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                <Check className="w-4 h-4 text-green-500" />
                                                专属特效
                                            </li>
                                        )}
                                    </ul>

                                    <Link
                                        to={`/payment?tier=${tier.name}&period=${selectedPeriod}`}
                                        className={`block w-full py-3 text-center rounded-xl font-medium transition-colors ${isCurrentTier
                                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                                                : 'bg-primary-start hover:bg-primary-end text-white'
                                            }`}
                                        onClick={(e) => isCurrentTier && e.preventDefault()}
                                    >
                                        {isCurrentTier ? '当前等级' : '立即开通'}
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* 订阅管理 */}
                {subscription && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card p-6 rounded-2xl"
                    >
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">订阅管理</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-600 dark:text-slate-300">
                                    {subscription.auto_renew
                                        ? `将于 ${formatDate(subscription.end_date)} 自动续费`
                                        : `将于 ${formatDate(subscription.end_date)} 到期，届时将恢复为普通用户`
                                    }
                                </p>
                            </div>
                            <fetcher.Form method="post">
                                <input type="hidden" name="_action" value={subscription.auto_renew ? "cancel_subscription" : "resume_auto_renew"} />
                                <button
                                    type="submit"
                                    className={`px-4 py-2 rounded-xl font-medium transition-colors ${subscription.auto_renew
                                            ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                                            : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                        }`}
                                >
                                    {subscription.auto_renew ? '取消自动续费' : '恢复自动续费'}
                                </button>
                            </fetcher.Form>
                        </div>
                    </motion.div>
                )}

                {/* 法律条款提示 */}
                <div className="text-center text-sm text-slate-500 dark:text-slate-400 space-x-4">
                    <Link to="/legal/sponsor" className="hover:underline">赞助条款</Link>
                    <span>·</span>
                    <Link to="/legal/privacy" className="hover:underline">隐私政策</Link>
                    <span>·</span>
                    <Link to="/legal/terms" className="hover:underline">用户协议</Link>
                </div>
            </div>
        </div>
    );
}

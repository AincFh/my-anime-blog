import { motion, AnimatePresence } from "framer-motion";
import { Crown, Calendar, CreditCard, RefreshCw, XCircle, CheckCircle, History, Sparkles, Star, Zap, Moon, Orbit } from "lucide-react";
import { useState } from "react";
import { useLoaderData, useFetcher, Link } from "react-router";
import { ClientOnly } from "~/components/ui/common/ClientOnly";
import { MembershipTierCard, MembershipTierList } from "~/components/membership/MembershipTierCard";
import { useUser } from "~/hooks/useUser";
import { getSessionToken, verifySession } from "~/services/auth.server";
import { getUserCoins } from "~/services/membership/coins.server";
import { membershipService } from "~/services/membership/membership.server";
import { confirmModal } from "~/components/ui/Modal";
import { toast } from "~/components/ui/Toast";

interface Tier {
  tier_id: number;
  tier_name: string;
  tier_name_en: string;
  tier_level: number;
  monthly_price_cents: number;
  yearly_price_cents: number;
  description: string;
  features: string[];
  color_hex: string;
}

interface LoaderData {
  loggedIn: boolean;
  user: { id: number; username: string; avatar_url: string } | null;
  stats: { coins: number };
  tiers: Tier[];
  userMembership: {
    tier_level: number;
    started_at: string;
    expires_at: string;
    auto_renew: number;
    status: string;
  } | null;
  paymentHistory: Array<{
    order_no: string;
    amount: number;
    product_name: string;
    status: string;
    paid_at: number;
    created_at: number;
  }>;
}

export async function loader({ request, context }: { request: Request; context: any }) {
  const { anime_db } = context.cloudflare.env;

  // 获取所有会员等级
  const tiers = await membershipService.getAllTiers(anime_db);

  // 登录态 — 额外获取订阅状态和支付历史
  const token = getSessionToken(request);
  const { valid, user } = await verifySession(token, anime_db);

  if (!valid || !user) {
    return {
      loggedIn: false,
      user: null,
      stats: { coins: 0 },
      tiers,
      userMembership: null,
      paymentHistory: [],
    } as LoaderData;
  }

  const [coins, userMembership, paymentHistoryResult] = await Promise.all([
    getUserCoins(anime_db, user.id),
    membershipService.getUserMembership(anime_db, user.id),
    anime_db
      .prepare(`
        SELECT order_no, amount, product_name, status, paid_at, created_at
        FROM payment_orders
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `)
      .bind(user.id)
      .all(),
  ]);

  // 转换数据格式
  const transformedTiers: Tier[] = tiers.map((t) => ({
    tier_id: t.tier_id,
    tier_name: t.tier_name,
    tier_name_en: t.tier_name_en,
    tier_level: t.tier_level,
    monthly_price_cents: t.monthly_price_cents,
    yearly_price_cents: t.yearly_price_cents,
    description: t.description ?? "",
    features: t.features,
    color_hex: t.color_hex ?? "#6B7280",
  }));

  return {
    loggedIn: true,
    user: {
      ...user,
      avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
    },
    stats: { coins },
    tiers: transformedTiers,
    userMembership: userMembership
      ? {
          tier_level: userMembership.tier_level,
          started_at: userMembership.started_at,
          expires_at: userMembership.expires_at,
          auto_renew: userMembership.auto_renew,
          status: userMembership.status,
        }
      : null,
    paymentHistory: (paymentHistoryResult.results || []) as LoaderData["paymentHistory"],
  };
}

// 解析 features 字段
function parseFeatures(input: string | null | undefined): string[] {
  if (!input) return [];
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // 如果是字符串但不是 JSON，可能是逗号分隔的列表
    if (typeof input === "string" && input.includes(",")) {
      return input.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }
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

  const userMembership = loaderData.userMembership;
  const currentLevel = userMembership?.tier_level ?? 0;
  const isSubscribed = currentLevel > 0;

  // 格式化日期
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // 计算剩余天数
  const calculateDaysRemaining = () => {
    if (!userMembership?.expires_at) return 0;
    try {
      const expiresDate = new Date(userMembership.expires_at);
      const now = new Date();
      const diffMs = expiresDate.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  };

  const daysRemaining = calculateDaysRemaining();

  // 订阅操作
  const handleSubscribe = (tier: Tier) => {
    if (!loaderData.loggedIn) {
      confirmModal({
        title: "需要登录",
        message: "您需要登录才能订阅会员服务。是否前往登录页面？",
        confirmText: "去登录",
        cancelText: "再看看",
      }).then((confirmed) => {
        if (confirmed) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
      });
      return;
    }

    if (tier.tier_level === 0) {
      toast.info("免费用户无需订阅");
      return;
    }

    // 调用订阅 API
    fetcher.submit(
      { action: "subscribe", tierId: tier.tier_id.toString(), period: "monthly" },
      { method: "post", action: "/api/subscription" }
    );
  };

  // 取消自动续费
  const handleCancelAutoRenew = async () => {
    const confirmed = await confirmModal({
      title: "取消续费",
      message: "确定要取消自动续费吗？您的会员权益将在到期后失效。",
      confirmText: "坚持取消",
      cancelText: "再想想",
    });
    if (!confirmed) return;
    fetcher.submit(
      { action: "cancel" },
      { method: "post", action: "/api/subscription" }
    );
  };

  // 恢复自动续费
  const handleResumeAutoRenew = () => {
    fetcher.submit({ action: "resume" }, { method: "post", action: "/api/subscription" });
  };

  // 获取等级图标
  const getLevelIcon = (level: number) => {
    const icons = [Star, Moon, Zap, Crown];
    return icons[level] || Star;
  };

  // 获取等级颜色
  const getLevelColor = (level: number) => {
    const colors = ["#6B7280", "#8B5CF6", "#3B82F6", "#F59E0B"];
    return colors[level] || colors[0];
  };

  return (
    <>
      <ClientOnly>
        {() => (
          <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900" />
        )}
      </ClientOnly>

      {/* 灵动岛导航 */}
      <div className="sticky top-0 z-50 px-4 md:px-12 pt-4 md:pt-8">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Link
            to="/user/dashboard"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <span className="text-xl">←</span>
            <span className="text-sm font-medium">返回</span>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Crown className="text-yellow-500" size={24} />
            会员中心
          </h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="w-full min-h-screen px-4 md:px-12 pt-4 pb-24">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          {/* 页面标题区 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-4">
              <Sparkles className="text-yellow-500" />
              加入星际会员
            </h2>
            <p className="text-lg text-white/60">解锁专属特权，支持创作发展</p>
          </motion.div>

          {/* 会员等级卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MembershipTierList
              tiers={loaderData.tiers}
              currentTierLevel={currentLevel}
              popularLevel={2}
              onSubscribe={handleSubscribe}
            />
          </motion.div>

          {/* 当前状态卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`
              rounded-3xl p-8 border relative overflow-hidden
              ${isSubscribed
                ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-yellow-500/30"
                : "bg-white/10 backdrop-blur-xl border-white/20"
              }
            `}
          >
            {/* 背景装饰 */}
            {isSubscribed && (
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
            )}

            <div className="relative z-10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                {isSubscribed ? <Crown className="text-yellow-500" /> : <Star className="text-white/40" />}
                当前状态
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* 等级信息 */}
                <div className="flex items-center gap-6">
                  <div
                    className={`
                      w-20 h-20 rounded-2xl flex items-center justify-center
                      ${isSubscribed ? "text-yellow-400" : "bg-white/10 text-white/40"}
                    `}
                    style={isSubscribed ? { backgroundColor: `${getLevelColor(currentLevel)}20` } : undefined}
                  >
                    {(() => {
                      const Icon = getLevelIcon(currentLevel);
                      return <Icon size={40} style={isSubscribed ? { color: getLevelColor(currentLevel) } : undefined} />;
                    })()}
                  </div>
                  <div>
                    <div className="text-sm text-white/60 mb-1">当前等级</div>
                    <div className={`text-2xl font-bold ${isSubscribed ? "text-yellow-400" : "text-white"}`}>
                      {isSubscribed
                        ? loaderData.tiers.find((t) => t.tier_level === currentLevel)?.tier_name || "VIP"
                        : "旅行者"}
                    </div>
                  </div>
                </div>

                {/* 到期信息 */}
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-white/40">
                    <Calendar size={32} />
                  </div>
                  <div>
                    <div className="text-sm text-white/60 mb-1">到期时间</div>
                    <div className="text-xl font-bold text-white">
                      {formatDate(userMembership?.expires_at)}
                    </div>
                    {isSubscribed && (
                      <div className={`text-xs mt-1 ${daysRemaining <= 7 ? "text-red-400" : "text-white/40"}`}>
                        剩余 {daysRemaining} 天
                      </div>
                    )}
                  </div>
                </div>

                {/* 自动续费 */}
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-white/40">
                    <RefreshCw size={32} />
                  </div>
                  <div>
                    <div className="text-sm text-white/60 mb-1">自动续费</div>
                    {isSubscribed ? (
                      userMembership?.auto_renew ? (
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-bold flex items-center gap-1">
                            <CheckCircle size={16} /> 已开启
                          </span>
                          <button
                            onClick={handleCancelAutoRenew}
                            className="text-xs text-white/40 hover:text-red-400 underline ml-2"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 font-bold flex items-center gap-1">
                            <XCircle size={16} /> 已关闭
                          </span>
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
            </div>
          </motion.div>

          {/* 会员特权说明 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="text-purple-400" />
              会员特权详解
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {loaderData.tiers.slice(1).map((tier) => (
                <div
                  key={tier.tier_id}
                  className="bg-white/5 rounded-2xl p-6 border border-white/10"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto"
                    style={{ backgroundColor: `${tier.color_hex}20` }}
                  >
                    {(() => {
                      const Icon = getLevelIcon(tier.tier_level);
                      return <Icon size={24} style={{ color: tier.color_hex }} />;
                    })()}
                  </div>
                  <h4 className="text-lg font-bold text-white text-center mb-3">
                    {tier.tier_name}
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {tier.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-green-400" />
                        <span className="text-white/70">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 支付历史 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <History className="text-purple-400" />
              支付历史
            </h3>
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
                    {loaderData.paymentHistory.map((order) => (
                      <tr
                        key={order.order_no}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-xs text-white/60">
                          {order.order_no}
                        </td>
                        <td className="py-3 px-4 text-white">{order.product_name}</td>
                        <td className="py-3 px-4 text-right text-white font-bold">
                          ¥{(order.amount / 100).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`
                              px-2 py-0.5 rounded-full text-xs font-bold
                              ${order.status === "paid" ? "bg-green-500/20 text-green-400" : ""}
                              ${order.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : ""}
                              ${order.status === "failed" ? "bg-red-500/20 text-red-400" : ""}
                            `}
                          >
                            {order.status === "paid"
                              ? "已支付"
                              : order.status === "pending"
                                ? "待支付"
                                : order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-white/40 text-xs">
                          {formatDate(
                            order.paid_at
                              ? new Date(order.paid_at * 1000).toISOString()
                              : new Date(order.created_at * 1000).toISOString()
                          )}
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

export function ErrorBoundary() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">会员中心加载失败</h1>
        <p className="text-white/60 mb-6">无法显示会员信息，请稍后重试</p>
        <a
          href="/user/membership"
          className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
        >
          刷新页面
        </a>
      </div>
    </div>
  );
}
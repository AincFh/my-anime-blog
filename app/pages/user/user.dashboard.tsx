import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useFetcher, useNavigate, useLoaderData } from "react-router";
import { GameDashboardLayout } from "~/components/dashboard/game/GameDashboardLayout";
import { StatusHUD } from "~/components/dashboard/game/StatusHUD";
import { ActionPanel } from "~/components/dashboard/game/ActionPanel";
import { GamificationProvider, useGamification } from "~/contexts/GamificationContext";
import { useUser } from "~/hooks/useUser";
import { ClientOnly } from "~/components/ui/common/ClientOnly";
import { getSessionToken, verifySession } from "~/services/auth.server";
import { getUserCoins } from "~/services/membership/coins.server";
import { getUserMissions } from "~/services/membership/mission.server";
import { getMissedSigninDays, calculateMakeupCost, getMonthlySigninRecords } from "~/services/membership/makeup-signin.server";
import { MissionBoard } from "~/components/dashboard/widgets/MissionBoard";
import { ServerStatus } from "~/components/dashboard/widgets/ServerStatus";
import { ActivityLog } from "~/components/dashboard/widgets/ActivityLog";
import { NavMenu } from "~/components/dashboard/game/NavMenu";
import { onSignIn } from "~/components/ui/system/AchievementSystem";

function buildMonthDays(
    year: number,
    month: number,
    signedDates: Set<string>
): Array<{
    date: string;
    formatted: string;
    signedIn: boolean;
    isMakeup: boolean;
    isToday: boolean;
    isFuture: boolean;
    rewardCoins: number;
}> {
    const days = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startWeekday = firstDay.getDay();
    const totalDays = lastDay.getDate();

    // 填充空白格子
    for (let i = 0; i < startWeekday; i++) {
        days.push({ date: '', formatted: '', signedIn: false, isMakeup: false, isToday: false, isFuture: false, rewardCoins: 0 });
    }

    // 填充日期格子
    for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isFuture = dateStr > todayStr;
        days.push({
            date: dateStr,
            formatted: `${month}月${d}日`,
            signedIn: signedDates.has(dateStr),
            isMakeup: false,
            isToday: dateStr === todayStr,
            isFuture,
            rewardCoins: 5,
        });
    }

    return days;
}

// Loader: 获取真实数据
export async function loader({ request, context }: LoaderFunctionArgs) {
  try {
    const { anime_db } = context.cloudflare.env as { anime_db: import('~/services/db.server').Database };
    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, anime_db);

    if (!valid || !user) {
      return {
        loggedIn: false,
        user: null,
        stats: { coins: 0, level: 1, exp: 0, maxExp: 100 },
        signInStatus: { hasSignedIn: false, consecutiveDays: 0 },
        missions: [],
        calendar: [],
        makeupInfo: { canMakeup: false, missedDays: [], missedDaysFormatted: [], consecutiveMakeupCount: 1, currentCost: 30, maxDaysBack: 7 },
      };
    }

    // 并行获取数据以提升性能
    const [signInRecord, streakResult, coins, missions, membership] = await Promise.all([
      // 1. 今日签到状态
      anime_db.prepare(`
          SELECT 1 FROM coin_transactions 
          WHERE user_id = ? AND source = 'daily_signin' 
          AND date(created_at, 'unixepoch') = date('now')
      `).bind(user.id).first().catch(() => null),

      // 2. 连续签到天数
      anime_db.prepare(`
          SELECT COUNT(DISTINCT date(created_at, 'unixepoch')) as streak
          FROM coin_transactions 
          WHERE user_id = ? AND source = 'daily_signin'
          AND created_at > unixepoch('now', '-30 days')
      `).bind(user.id).first().catch(() => null),

    const [signInRecord, streakResult, coins, missions, membership, monthData, makeupStatus] = await Promise.all([
      // 1. 今日签到状态
      anime_db.prepare(`
          SELECT 1 FROM coin_transactions
          WHERE user_id = ? AND source = 'daily_signin'
          AND date(created_at, 'unixepoch') = date('now')
      `).bind(user.id).first().catch(() => null),

      // 2. 连续签到天数
      anime_db.prepare(`
          SELECT COUNT(DISTINCT date(created_at, 'unixepoch')) as streak
          FROM coin_transactions
          WHERE user_id = ? AND source = 'daily_signin'
          AND created_at > unixepoch('now', '-30 days')
      `).bind(user.id).first().catch(() => null),

      // 3. 积分
      getUserCoins(anime_db, user.id).catch(() => 0),

      // 4. 使命进度
      getUserMissions(anime_db, user.id).catch(() => []),

      // 5. 会员信息 (动态加载服务)
      (async () => {
        try {
          const { getUserMembershipTier } = await import("~/services/membership/tier.server");
          return await getUserMembershipTier(anime_db, user.id);
        } catch {
          return { tier: null, subscription: null };
        }
      })(),

      // 6. 当月签到日历数据
      (async () => {
        try {
          const now = new Date();
          const year = now.getFullYear();
          const month = now.getMonth() + 1;
          const records = await getMonthlySigninRecords(anime_db, user.id, year, month);
          return { year, month, records };
        } catch {
          return { year: new Date().getFullYear(), month: new Date().getMonth() + 1, records: new Map() };
        }
      })(),

      // 7. 补签信息
      (async () => {
        try {
          return await getMissedSigninDays(anime_db, user.id);
        } catch {
          return { canMakeup: false, missedDays: [], missedDaysFormatted: [], consecutiveMakeupCount: 1, currentCost: 50, maxDaysBack: 7 };
        }
      })()
    ]);

    const { tier } = membership;

    // 构建签到日历 Set（从 Map 转 Set 便于序列化）
    const signedDatesSet = new Set<string>();
    if (monthData?.records) {
      for (const [date] of monthData.records) {
        signedDatesSet.add(date);
      }
    }

    const currentMonth = buildMonthDays(
      monthData.year,
      monthData.month,
      signedDatesSet
    );

    // 序列化 Map 为 Array（JSON 不支持 Map）
    const signedDatesArray = Array.from(signedDatesSet);

    return {
      loggedIn: true,
      user: {
        ...user,
        avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
      },
      tier: tier ? {
        name: tier.name,
        display_name: tier.display_name,
        badge_color: tier.badge_color,
        // 安全解析 privileges
        privileges: (() => {
          try {
            return JSON.parse(tier.privileges || '{}');
          } catch {
            return {};
          }
        })()
      } : null,
      stats: {
        coins: coins || 0,
        level: user.level || 1,
        exp: user.exp || 0,
        maxExp: (user.level || 1) * 100,
      },
      signInStatus: {
        hasSignedIn: !!signInRecord,
        consecutiveDays: (streakResult as any)?.streak || 0,
      },
      missions: missions || [],
      calendar: currentMonth,
      makeupInfo: makeupStatus || {
        canMakeup: false,
        missedDays: [],
        missedDaysFormatted: [],
        consecutiveMakeupCount: 1,
        currentCost: 50,
        maxDaysBack: 7,
      },
    };
  } catch (error) {
    console.error("Dashboard Loader Error:", error);
    // 终极降级方案：即便数据库崩溃也返回基础界面
    return {
      loggedIn: false,
      error: "Command center is currently in low-power mode.",
      user: null,
      stats: { coins: 0, level: 1, exp: 0, maxExp: 100 },
      signInStatus: { hasSignedIn: false, consecutiveDays: 0 },
      missions: [],
      calendar: [],
      makeupInfo: { canMakeup: false, missedDays: [], missedDaysFormatted: [], consecutiveMakeupCount: 1, currentCost: 30, maxDaysBack: 7 },
    };
  }
}

function DashboardContent() {
  const loaderData = useLoaderData<typeof loader>();
  const { user: clientUser, loading } = useUser(); // 客户端 user 状态 (用于更新)
  const { stats: clientStats } = useGamification(); // 客户端 gamification 状态
  const navigate = useNavigate();
  const fetcher = useFetcher();

  // 优先使用 loader 数据，客户端数据作为 fallback 或更新源
  const user = loaderData.user || clientUser;
  const stats = {
    coins: loaderData.stats.coins || 0,
    level: loaderData.stats.level || 1,
    exp: loaderData.stats.exp || 0,
    maxExp: loaderData.stats.maxExp || 100
  };

  // 签到状态
  const [signInStatus, setSignInStatus] = useState(loaderData.signInStatus);

  // 处理签到提交
  const isSubmitting = fetcher.state === "submitting";
  const isDone = signInStatus.hasSignedIn || (fetcher.data as any)?.success;

  useEffect(() => {
    if (fetcher.data?.success) {
      const streak = (fetcher.data as any).streak || 1;
      onSignIn(streak);
      setSignInStatus(prev => ({
        ...prev,
        hasSignedIn: true,
        consecutiveDays: streak
      }));
    }
  }, [fetcher.data]);

  const handleSignIn = () => {
    if (isDone || isSubmitting) return;
    fetcher.submit({}, { method: "post", action: "/api/daily-signin" });
  };

  if (!loaderData.loggedIn && !loading) {
    // 未登录状态处理 (理论上会被 loader 重定向，这里做个保险)
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">访问受限</h1>
          <p>请先登录以访问指挥中心</p>
          <button onClick={() => navigate("/login")} className="mt-4 px-6 py-2 bg-primary-500 rounded-full">登录</button>
        </div>
      </div>
    );
  }

  const userData = {
    avatar: user?.avatar_url,
    uid: user ? `UID-${user.id.toString().padStart(6, '0')}` : "UID-000000",
    level: stats.level,
    name: user?.username || "Traveler",
    exp: stats.exp,
    maxExp: stats.maxExp,
    tier: loaderData.tier
  };

  return (
    <>
      {/* 1. 状态 HUD */}
      <ClientOnly>
        {() => <StatusHUD user={{ ...userData, tier: loaderData.tier }} stats={{ coins: stats.coins }} />}
      </ClientOnly>
      <NavMenu />

      {/* 2. 动作面板 */}
      <ActionPanel
        onSignIn={handleSignIn}
        onShop={() => navigate("/shop")}
        signInStatus={{
          hasSignedIn: isDone,
          consecutiveDays: signInStatus.consecutiveDays,
          isSubmitting: isSubmitting
        }}
      />

      {/* 3. Dashboard Widgets Grid - UI UX PRO MAX 流体排版 */}
      <div className="w-full max-w-[1400px] mx-auto pt-24 md:pt-32 pb-32 px-4 md:pl-[120px] md:pr-8 flex flex-col min-h-screen">
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* Top Left: Mission Board */}
          <motion.div
            className="lg:col-span-2 flex flex-col h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <MissionBoard missions={loaderData.missions} />
          </motion.div>

          {/* Top Right: Server Status */}
          <motion.div
            className="lg:col-span-1 flex flex-col h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <ServerStatus />
          </motion.div>

          {/* Bottom: Activity Log */}
          <motion.div
            className="lg:col-span-3 flex flex-col h-full md:h-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ActivityLog />
          </motion.div>

        </div>
      </div>
    </>
  );
}

export default function UserDashboard() {
  return (
    <GamificationProvider>
      <DashboardContent />
    </GamificationProvider>
  );
}

export function ErrorBoundary({ error }: { error?: unknown }) {
  let message = "仪表盘加载失败";
  let details = "无法显示仪表盘内容，请稍后重试";
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
        <a href="/user/dashboard" className="mt-4 inline-block px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
          刷新仪表盘
        </a>
      </div>
    </div>
  );
}

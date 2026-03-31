import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useFetcher, useNavigate, useLoaderData } from "react-router";
import { GameDashboardLayout } from "~/components/dashboard/game/GameDashboardLayout";
import { StatusHUD } from "~/components/dashboard/game/StatusHUD";
import { ActionPanel } from "~/components/dashboard/game/ActionPanel";
import { GamificationProvider, useGamification } from "~/contexts/GamificationContext";
import { useUser } from "~/hooks/useUser";
import { ClientOnly } from "~/components/common/ClientOnly";
import { getSessionToken, verifySession } from "~/services/auth.server";
import { getUserCoins } from "~/services/membership/coins.server";
import { getUserMissions } from "~/services/membership/mission.server";
import { MissionBoard } from "~/components/dashboard/widgets/MissionBoard";
import { ServerStatus } from "~/components/dashboard/widgets/ServerStatus";
import { ActivityLog } from "~/components/dashboard/widgets/ActivityLog";
import { NavMenu } from "~/components/dashboard/game/NavMenu";

// Loader: 获取真实数据
export async function loader({ request, context }: { request: Request; context: any }) {
  const { anime_db } = context.cloudflare.env;
  const token = getSessionToken(request);
  const { valid, user } = await verifySession(token, anime_db);

  if (!valid || !user) {
    return {
      loggedIn: false,
      user: null,
      stats: { coins: 0, level: 1, exp: 0, maxExp: 100 },
      signInStatus: { hasSignedIn: false, consecutiveDays: 0 }
    };
  }

  // 1. 获取今日签到状态
  const today = new Date().toISOString().split('T')[0];
  const signInRecord = await anime_db
    .prepare(`
          SELECT * FROM coin_transactions 
          WHERE user_id = ? AND source = 'daily_signin' 
          AND date(created_at, 'unixepoch') = ?
      `)
    .bind(user.id, today)
    .first();

  // 2. 获取连续签到天数
  // 简单估算：查询最近30天记录
  const streakResult = await anime_db
    .prepare(`
          SELECT COUNT(DISTINCT date(created_at, 'unixepoch')) as streak
          FROM coin_transactions 
          WHERE user_id = ? AND source = 'daily_signin'
          AND created_at > unixepoch('now', '-30 days')
      `)
    .bind(user.id)
    .first();

  // 3. 获取最新积分
  const coins = await getUserCoins(anime_db, user.id);

  // 4. 获取用户使命进度
  const missions = await getUserMissions(anime_db, user.id);

  // 5. 获取详细会员信息
  const { getUserMembershipTier } = await import("~/services/membership/tier.server");
  const { tier, subscription } = await getUserMembershipTier(anime_db, user.id);

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
      privileges: JSON.parse(tier.privileges || '{}')
    } : null,
    stats: {
      coins,
      level: user.level || 1,
      exp: user.exp || 0,
      maxExp: (user.level || 1) * 100,
    },
    signInStatus: {
      hasSignedIn: !!signInRecord,
      consecutiveDays: (streakResult as any)?.streak || 0,
    },
    missions: missions || []
  };
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
      setSignInStatus(prev => ({
        ...prev,
        hasSignedIn: true,
        consecutiveDays: (fetcher.data as any).streak || prev.consecutiveDays + 1
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

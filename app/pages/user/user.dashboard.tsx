import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useFetcher, useNavigate, useLoaderData } from "react-router";
import { GameDashboardLayout } from "~/components/dashboard/game/GameDashboardLayout";
import { StatusHUD } from "~/components/dashboard/game/StatusHUD";
import { NavMenu } from "~/components/dashboard/game/NavMenu";
import { ActionPanel } from "~/components/dashboard/game/ActionPanel";
import { GachaMachine } from "~/components/gamification/GachaMachine";
import { GamificationProvider, useGamification } from "~/contexts/GamificationContext";
import { useUser } from "~/hooks/useUser";
import { ClientOnly } from "~/components/common/ClientOnly";
import { getSessionToken, verifySession } from "~/services/auth.server";
import { getUserCoins } from "~/services/membership/coins.server";
import { MissionBoard } from "~/components/dashboard/widgets/MissionBoard";
import { ServerStatus } from "~/components/dashboard/widgets/ServerStatus";
import { ActivityLog } from "~/components/dashboard/widgets/ActivityLog";

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

  return {
    loggedIn: true,
    user: {
      ...user,
      // 确保头像有默认值
      avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
    },
    stats: {
      coins,
      level: user.level || 1,
      exp: user.exp || 0,
      maxExp: (user.level || 1) * 100, // 简单升级公式
    },
    signInStatus: {
      hasSignedIn: !!signInRecord,
      consecutiveDays: (streakResult as any)?.streak || 0,
    }
  };
}

function DashboardContent() {
  const loaderData = useLoaderData<typeof loader>();
  const { user: clientUser, loading } = useUser(); // 客户端 user 状态 (用于更新)
  const { stats: clientStats } = useGamification(); // 客户端 gamification 状态
  const [isGachaOpen, setIsGachaOpen] = useState(false);
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
          <h1 className="text-2xl font-bold mb-4">ACCESS DENIED</h1>
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
  };

  return (
    <>
      {/* 1. 状态 HUD */}
      <ClientOnly>
        {() => <StatusHUD user={userData} stats={{ coins: stats.coins }} />}
      </ClientOnly>

      {/* 2. 导航菜单 */}
      <NavMenu />

      {/* 3. 动作面板 */}
      <ActionPanel
        onSignIn={handleSignIn}
        onGacha={() => setIsGachaOpen(true)}
        onShop={() => navigate("/shop")}
        signInStatus={{
          hasSignedIn: isDone,
          consecutiveDays: signInStatus.consecutiveDays,
          isSubmitting: isSubmitting
        }}
      />

      {/* 4. 扭蛋机模态框 */}
      <AnimatePresence>
        {isGachaOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGachaOpen(false)}
            />
            <motion.div
              className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="w-full max-w-md pointer-events-auto relative">
                <button
                  onClick={() => setIsGachaOpen(false)}
                  className="absolute -top-12 right-0 text-white/60 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <span className="text-2xl">✕</span>
                  <span className="text-sm font-bold tracking-widest">CLOSE</span>
                </button>
                <GachaMachine />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 5. Dashboard Widgets Grid */}
      <div className="absolute inset-0 flex items-center justify-center pl-24 pr-8 pt-24 pb-8 pointer-events-none">
        <div className="w-full h-full max-w-6xl pointer-events-auto grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6">

          {/* Top Left: Mission Board */}
          <motion.div
            className="md:col-span-2 row-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MissionBoard />
          </motion.div>

          {/* Top Right: Server Status */}
          <motion.div
            className="md:col-span-1 row-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ServerStatus />
          </motion.div>

          {/* Bottom: Activity Log */}
          <motion.div
            className="md:col-span-3 row-span-1 h-48 md:h-auto"
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

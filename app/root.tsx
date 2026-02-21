import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  Link,
} from "react-router";
import { GlassCard } from "~/components/layout/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";

import type { Route } from "./+types/root";
import "./app.css";
import { PublicLayout } from "./components/layout/PublicLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ThemeProviderWrapper } from "./components/ThemeProviderWrapper";
import { AppError } from "~/errors";

// ==================== 懒加载组件定义 ====================
// 高优先级：影响用户交互的核心组件
const CustomCursor = lazy(() => import("./components/animations/CustomCursor").then(m => ({ default: m.CustomCursor })));
const MusicPlayer = lazy(() => import("./components/media/MusicPlayer").then(m => ({ default: m.MusicPlayer })));

// 中优先级：增强体验但非必需的组件
const Live2D = lazy(() => import("./components/media/Live2D").then(m => ({ default: m.Live2D })));
const OmniCommand = lazy(() => import("./components/system/OmniCommand").then(m => ({ default: m.OmniCommand })));
const AchievementSystem = lazy(() => import("./components/system/AchievementSystem").then(m => ({ default: m.AchievementSystem })));

// 低优先级：彩蛋/装饰性组件，用户不会立即需要
const TheatricalMode = lazy(() => import("./components/special/TheatricalMode").then(m => ({ default: m.TheatricalMode })));
const AmbientSound = lazy(() => import("./components/media/AmbientSound").then(m => ({ default: m.AmbientSound })));
const KonamiCode = lazy(() => import("./components/animations/KonamiCode").then(m => ({ default: m.KonamiCode })));
const TitleChanger = lazy(() => import("./components/ui/special/TitleChanger").then(m => ({ default: m.TitleChanger })));
const CopyAttribution = lazy(() => import("./components/common/CopyAttribution").then(m => ({ default: m.CopyAttribution })));
const HiddenPixelButton = lazy(() => import("./components/interactive/HiddenPixelButton").then(m => ({ default: m.HiddenPixelButton })));
const IdleTimeEasterEgg = lazy(() => import("./components/interactive/EasterEggs").then(m => ({ default: m.IdleTimeEasterEgg })));
const KonamiCodeEasterEggV2 = lazy(() => import("./components/interactive/EasterEggs").then(m => ({ default: m.KonamiCodeEasterEgg })));

// ==================== 延迟加载封装 ====================
/**
 * 延迟渲染组件，用于分批加载非关键组件
 * @param delayMs - 延迟时间（毫秒）
 */
function DelayedSuspense({
  children,
  delayMs
}: {
  children: React.ReactNode;
  delayMs: number;
}) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleRender = () => setShouldRender(true);

    if (delayMs === 0) {
      scheduleRender();
    } else if ('requestIdleCallback' in window) {
      timeoutId = setTimeout(() => {
        (window as any).requestIdleCallback(scheduleRender, { timeout: delayMs });
      }, delayMs);
    } else {
      timeoutId = setTimeout(scheduleRender, delayMs);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [delayMs]);

  if (!shouldRender) return null;

  return <Suspense fallback={null}>{children}</Suspense>;
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Comfortaa:wght@300..700&family=Inter:wght@100..900&family=Noto+Sans+SC:wght@100..900&family=Orbitron:wght@400..900&family=Roboto:wght@100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-orange-500 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          跳过导航
        </a>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

import { createDynamicThemeSessionResolver } from "./sessions.theme.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  const isProd = env.ENVIRONMENT === "production";
  const secret = env.SESSION_SECRET || "default-secret";

  const themeSessionResolver = createDynamicThemeSessionResolver(secret, isProd);
  const { getTheme } = await themeSessionResolver(request);

  return {
    theme: getTheme(),
  };
}

export default function App({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const { theme } = loaderData;

  // SPA页面转场动画配置
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 50,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -20,
    },
  };

  const pageTransition = {
    type: "tween" as const,
    ease: "easeInOut" as const,
    duration: 0.5,
  };

  return (
    <ThemeProviderWrapper specifiedTheme={theme} themeAction="/action/set-theme">
      {/* 懒加载组件 - 按优先级分批加载，避免网络拥塞 */}
      {!isAdmin && (
        <>
          {/* 高优先级：立即加载（影响用户交互） */}
          <Suspense fallback={null}>
            <CustomCursor />
            <MusicPlayer />
          </Suspense>

          {/* 中优先级：1秒后加载（增强体验） */}
          <DelayedSuspense delayMs={1000}>
            <Live2D />
            <OmniCommand />
            <AchievementSystem />
          </DelayedSuspense>

          {/* 低优先级：3秒后加载（彩蛋/装饰性） */}
          <DelayedSuspense delayMs={3000}>
            <TheatricalMode />
            <AmbientSound scene="default" />
            <KonamiCode />
            <TitleChanger />
            <CopyAttribution />
            <HiddenPixelButton />
            <IdleTimeEasterEgg />
            <KonamiCodeEasterEggV2 />
          </DelayedSuspense>
        </>
      )}
      {isAdmin ? (
        <AdminLayout>
          <Outlet />
        </AdminLayout>
      ) : (
        <PublicLayout>
          <Outlet />
        </PublicLayout>
      )}
    </ThemeProviderWrapper>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "系统发生错误";
  let details = "未知错误";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404 - 页面未找到" : `${error.status} - ${error.statusText}`;
    details = error.status === 404
      ? "看起来你迷路了..."
      : error.data || details;
  } else if (error instanceof AppError) {
    message = error.code === 'NOT_FOUND' ? "404 - 资源不存在" : "应用程序错误";
    details = error.message;
    if (import.meta.env.DEV) {
      stack = error.stack;
    }
  } else if (error instanceof Error) {
    message = "未捕获的异常";
    details = error.message;
    if (import.meta.env.DEV) {
      stack = error.stack;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      {/* 背景装饰 - A.T. Field 警告 */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-[0.03] overflow-hidden flex items-center justify-center">
        <div className="text-[30vw] font-bold text-red-500 rotate-[-15deg] blur-sm">
          ERROR
        </div>
      </div>

      <div className="relative z-10 w-full max-w-3xl">
        <GlassCard className="p-8 md:p-12 border-red-500/20 bg-red-500/5 dark:bg-red-900/10 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="hidden md:block text-6xl">
              🚨
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-red-400 mb-4 border-b border-red-500/20 pb-4">
                {message}
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                {details}
              </p>

              {stack && (
                <div className="mb-6 p-4 bg-slate-950 rounded-lg overflow-x-auto border border-red-900/50">
                  <pre className="text-xs text-red-300 font-mono">
                    <code>{stack}</code>
                  </pre>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/"
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-500/20"
                >
                  返回首页
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg font-medium transition-colors"
                >
                  刷新页面
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

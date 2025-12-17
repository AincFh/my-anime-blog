import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { lazy, Suspense, useState, useEffect } from "react";

import type { Route } from "./+types/root";
import "./app.css";
import { PublicLayout } from "./components/layout/PublicLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ThemeProviderWrapper } from "./components/ThemeProviderWrapper";

// 延迟加载非关键组件，提升 LCP
const CustomCursor = lazy(() => import("./components/animations/CustomCursor").then(m => ({ default: m.CustomCursor })));
const MusicPlayer = lazy(() => import("./components/media/MusicPlayer").then(m => ({ default: m.MusicPlayer })));
const Live2D = lazy(() => import("./components/media/Live2D").then(m => ({ default: m.Live2D })));
const EyeCatch = lazy(() => import("./components/special/EyeCatch").then(m => ({ default: m.EyeCatch })));
const TheatricalMode = lazy(() => import("./components/special/TheatricalMode").then(m => ({ default: m.TheatricalMode })));
const AmbientSound = lazy(() => import("./components/media/AmbientSound").then(m => ({ default: m.AmbientSound })));
const OmniCommand = lazy(() => import("./components/system/OmniCommand").then(m => ({ default: m.OmniCommand })));
const KonamiCode = lazy(() => import("./components/animations/KonamiCode").then(m => ({ default: m.KonamiCode })));
const TitleChanger = lazy(() => import("./components/ui/special/TitleChanger").then(m => ({ default: m.TitleChanger })));
const CustomScrollbar = lazy(() => import("./components/animations/CustomScrollbar").then(m => ({ default: m.CustomScrollbar })));
const CopyAttribution = lazy(() => import("./components/common/CopyAttribution").then(m => ({ default: m.CopyAttribution })));
const AchievementSystem = lazy(() => import("./components/system/AchievementSystem").then(m => ({ default: m.AchievementSystem })));
const HiddenPixelButton = lazy(() => import("./components/interactive/HiddenPixelButton").then(m => ({ default: m.HiddenPixelButton })));

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Noto+Sans+SC:wght@100..900&family=Orbitron:wght@400..900&family=Comfortaa:wght@300..700&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const isLoginAdmin = location.pathname === "/login-admin";

  // 延迟加载非关键组件 - 首屏渲染后 2 秒再加载
  const [shouldLoadExtras, setShouldLoadExtras] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoadExtras(true);
    }, 2000); // 2秒后加载额外组件
    return () => clearTimeout(timer);
  }, []);

  // 优化的页面转场动画 - 丝滑流体感
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20, // 从下方轻微浮入
      scale: 0.98, // 轻微放大
      filter: "blur(8px)", // 初始模糊
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: {
      opacity: 0,
      filter: "blur(5px)", // 仅保留模糊和透明度变化，避免位移导致的"闪烁"感
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4,
  };

  // 如果是管理员登录页，直接渲染，不使用任何布局
  if (isLoginAdmin) {
    return (
      <ThemeProviderWrapper specifiedTheme={null} themeAction="/action/set-theme">
        <Outlet />
      </ThemeProviderWrapper>
    );
  }

  return (
    <ThemeProviderWrapper specifiedTheme={null} themeAction="/action/set-theme">
      {/* 延迟加载的非关键组件 */}
      {!isAdmin && shouldLoadExtras && (
        <Suspense fallback={null}>
          <CustomCursor />
          <MusicPlayer />
          <Live2D />
          {/* <EyeCatch /> - 移除过场动画，避免视觉闪烁 */}
          <TheatricalMode />
          <AmbientSound scene="default" />
          <OmniCommand />
          <KonamiCode />
          <TitleChanger />
          <CustomScrollbar />
          <CopyAttribution />
          <AchievementSystem />
          <HiddenPixelButton />
        </Suspense>
      )}

      {isAdmin ? (
        <AdminLayout>
          <Outlet />
        </AdminLayout>
      ) : (
        <PublicLayout>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </PublicLayout>
      )}
    </ThemeProviderWrapper>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "哎呀！";
  let details = "发生了一个意外错误。";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "错误";
    details =
      error.status === 404
        ? "请求的页面未找到。"
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

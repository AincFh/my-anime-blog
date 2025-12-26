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
import { lazy, Suspense } from "react";

import type { Route } from "./+types/root";
import "./app.css";
import { PublicLayout } from "./components/layouts/PublicLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ThemeProviderWrapper } from "./components/ThemeProviderWrapper";

// 懒加载非关键组件 - 提升首屏加载速度
const CustomCursor = lazy(() => import("./components/animations/CustomCursor").then(m => ({ default: m.CustomCursor })));
const MusicPlayer = lazy(() => import("./components/media/MusicPlayer").then(m => ({ default: m.MusicPlayer })));
const Live2D = lazy(() => import("./components/media/Live2D").then(m => ({ default: m.Live2D })));
const EyeCatch = lazy(() => import("./components/special/EyeCatch").then(m => ({ default: m.EyeCatch })));
const TheatricalMode = lazy(() => import("./components/special/TheatricalMode").then(m => ({ default: m.TheatricalMode })));
const AmbientSound = lazy(() => import("./components/media/AmbientSound").then(m => ({ default: m.AmbientSound })));
const OmniCommand = lazy(() => import("./components/system/OmniCommand").then(m => ({ default: m.OmniCommand })));
const KonamiCode = lazy(() => import("./components/animations/KonamiCode").then(m => ({ default: m.KonamiCode })));
const TitleChanger = lazy(() => import("./components/ui/special/TitleChanger").then(m => ({ default: m.TitleChanger })));
// CustomScrollbar 已移除 - 那个✨圆点没有实际功能
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
    <ThemeProviderWrapper specifiedTheme="light" themeAction="/action/set-theme">
      {/* 懒加载组件 - 使用 Suspense 包裹，无需 fallback UI（这些是增强功能） */}
      {!isAdmin && (
        <Suspense fallback={null}>
          <CustomCursor />
          <MusicPlayer />
          <Live2D />
          <EyeCatch />
          <TheatricalMode />
          <AmbientSound scene="default" />
          <OmniCommand />
          <KonamiCode />
          <TitleChanger />
          <CopyAttribution />
          <AchievementSystem />
          <HiddenPixelButton />
        </Suspense>
      )}
      {isAdmin ? (
        <AdminLayout>
          <Outlet />
        </AdminLayout>
      ) : ["/user/dashboard", "/user/inventory", "/user/achievements", "/settings"].some(path => location.pathname.startsWith(path)) ? (
        <PublicLayout>
          <Outlet />
        </PublicLayout>
      ) : (
        <PublicLayout>
          <Outlet />
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

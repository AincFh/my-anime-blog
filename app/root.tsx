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

import type { Route } from "./+types/root";
import "./app.css";
import { PublicLayout } from "./components/layouts/PublicLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { CustomCursor } from "./components/animations/CustomCursor";
import { MusicPlayer } from "./components/media/MusicPlayer";
import { Live2D } from "./components/media/Live2D";
import { InstantSearch } from "./components/system/InstantSearch";
import { EyeCatch } from "./components/special/EyeCatch";
import { TheatricalMode } from "./components/special/TheatricalMode";
import { AmbientSound } from "./components/media/AmbientSound";
import { OmniCommand } from "./components/system/OmniCommand";
import { KonamiCode } from "./components/animations/KonamiCode";
import { TitleChanger } from "./components/ui/special/TitleChanger";
import { CustomScrollbar } from "./components/animations/CustomScrollbar";
import { CopyAttribution } from "./components/common/CopyAttribution";
import { AchievementSystem } from "./components/system/AchievementSystem";
import { HiddenPixelButton } from "./components/interactive/HiddenPixelButton";
import { ThemeProviderWrapper } from "./components/ThemeProviderWrapper";

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
      {!isAdmin && <CustomCursor />}
      {!isAdmin && <MusicPlayer />}
      {/* InstantSearch 已被 OmniCommand 替代 */}
      {!isAdmin && <Live2D />}
      {!isAdmin && <EyeCatch />}
      {!isAdmin && <TheatricalMode />}
      {!isAdmin && <AmbientSound scene="default" />}
      {!isAdmin && <OmniCommand />}
      {!isAdmin && <KonamiCode />}
      {!isAdmin && <TitleChanger />}
      {!isAdmin && <CustomScrollbar />}
      {!isAdmin && <CopyAttribution />}
      {!isAdmin && <AchievementSystem />}
      {!isAdmin && <HiddenPixelButton />}
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

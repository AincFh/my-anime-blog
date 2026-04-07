/**
 * 统一错误边界组件
 * 提供全站一致的错误处理 UI
 */
import { Link } from "react-router";
import { GlassCard } from "../layout/GlassCard";
import { IconEmoji } from "~/components/ui/IconEmoji";

interface Props {
  error?: unknown;
  title?: string;
  message?: string;
}

export function RouteErrorBoundary({ error, title, message }: Props) {
  let errorTitle = title || "系统发生错误";
  let errorMessage = message || "出了点问题，请稍后再试";
  let stack: string | undefined;

  if (error instanceof Error) {
    errorMessage = error.message || errorMessage;
    if (import.meta.env.DEV) {
      stack = error.stack;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-[0.03] overflow-hidden flex items-center justify-center">
        <div className="text-[30vw] font-bold text-red-500 rotate-[-15deg] blur-sm">
          ERROR
        </div>
      </div>

      <div className="relative z-10 w-full max-w-3xl">
        <GlassCard className="p-8 md:p-12 border-red-500/20 bg-red-500/5 dark:bg-red-900/10 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="hidden md:block">
              <IconEmoji emoji="🚨" size={48} className="text-red-500" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-red-400 mb-4 border-b border-red-500/20 pb-4">
                {errorTitle}
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                {errorMessage}
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

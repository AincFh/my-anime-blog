/**
 * 法律页面通用布局组件
 * 提供统一的条约、条款、政策页面样式
 */

import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "react-router";

interface LegalPageProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  date: string;
  icon: React.ReactNode;
  backTo?: string;
  backText?: string;
  showFooterNav?: boolean;
  secondaryLink?: { href: string; text: string };
}

export function LegalPage({
  children,
  title,
  subtitle,
  date,
  icon,
  backTo = "/",
  backText = "返回首页",
  showFooterNav = true,
  secondaryLink,
}: LegalPageProps) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 返回链接 */}
        <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm text-slate-400 dark:text-white/40 hover:text-primary-start transition-colors mb-6">
          <ArrowLeft size={14} />
          {backText}
        </Link>

        {/* 页面标题区 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-start to-primary-end flex items-center justify-center text-white">
              {icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{title}</h1>
              <p className="text-sm text-slate-400 dark:text-white/40">{subtitle}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-white/30 border-t border-slate-200 dark:border-white/10 pt-4">
            {date}
          </p>
        </motion.div>

        {/* 内容区 */}
        <div className="space-y-4">
          {children}
        </div>

        {/* 底部导航 */}
        {showFooterNav && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-8 flex justify-center gap-3"
          >
            <Link to="/" className="px-5 py-2 text-sm font-medium rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
              返回首页
            </Link>
            {secondaryLink && (
              <Link to={secondaryLink.href} className="px-5 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-primary-start to-primary-end text-white hover:shadow-lg hover:shadow-primary-start/25 transition-all">
                {secondaryLink.text}
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Section 组件
// ============================================

interface LegalSectionProps {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  delay?: number;
}

export function LegalSection({ children, icon, title, delay = 0 }: LegalSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      className="bg-white/60 dark:bg-white/5 rounded-2xl p-5 border border-slate-200/50 dark:border-white/10"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-start/10 to-primary-end/10 flex items-center justify-center text-primary-start">
          {icon}
        </div>
        <h2 className="text-base font-semibold text-slate-700 dark:text-white/90">{title}</h2>
      </div>
      <div className="text-sm text-slate-500 dark:text-white/50 leading-relaxed space-y-3">
        {children}
      </div>
    </motion.div>
  );
}

// ============================================
// Alert 组件
// ============================================

interface LegalAlertProps {
  type: "info" | "warning" | "danger" | "success";
  title?: string;
  children: React.ReactNode;
}

export function LegalAlert({ type, title, children }: LegalAlertProps) {
  const styles = {
    info: {
      bg: "bg-blue-50 dark:bg-blue-500/10",
      border: "border-blue-200 dark:border-blue-500/20",
      text: "text-blue-700 dark:text-blue-300",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-500/10",
      border: "border-amber-200 dark:border-amber-500/20",
      text: "text-amber-700 dark:text-amber-300",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    danger: {
      bg: "bg-red-50 dark:bg-red-500/10",
      border: "border-red-200 dark:border-red-500/20",
      text: "text-red-700 dark:text-red-300",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    success: {
      bg: "bg-green-50 dark:bg-green-500/10",
      border: "border-green-200 dark:border-green-500/20",
      text: "text-green-700 dark:text-green-300",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const style = styles[type];

  return (
    <div className={`flex gap-3 p-4 rounded-xl ${style.bg} ${style.border} border`}>
      <div className={`${style.text} mt-0.5`}>{style.icon}</div>
      <div className={`${style.text} text-sm`}>
        {title && <p className="font-semibold mb-1">{title}</p>}
        {children}
      </div>
    </div>
  );
}

// ============================================
// Grid 组件
// ============================================

interface LegalGridProps {
  items: Array<{
    icon: string;
    title: string;
    desc: string;
  }>;
  columns?: 2 | 3 | 4;
}

export function LegalGrid({ items, columns = 4 }: LegalGridProps) {
  return (
    <div className={`grid grid-cols-${columns} gap-3 mt-4`}>
      {items.map((item, i) => (
        <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 text-center">
          <div className="text-2xl mb-2">{item.icon}</div>
          <p className="text-xs font-medium text-slate-700 dark:text-white/80">{item.title}</p>
          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================
// List 组件
// ============================================

export function LegalList({ items, numbered = false }: { items: string[]; numbered?: boolean }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <span className="text-primary-start mt-0.5">{numbered ? `${i + 1}.` : "-"}</span>
          <span className="text-slate-600 dark:text-white/60">{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ============================================
// Table 组件
// ============================================

interface TableRow {
  [key: string]: string;
}

export function LegalTable({ headers, rows }: { headers: string[]; rows: TableRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 mt-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-white/5">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
              {headers.map((h, j) => (
                <td key={j} className="px-4 py-3 text-slate-600 dark:text-white/60">
                  {row[h]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// Badge 组件
// ============================================

export function LegalBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-start/10 text-primary-start">
      {children}
    </span>
  );
}

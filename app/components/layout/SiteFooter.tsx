/**
 * 网站底部 Footer 组件
 * 包含版权信息、备案号和法律页面链接
 */

import { Link } from "react-router";

interface SiteFooterProps {
    siteName?: string;
    icpNumber?: string;
    startYear?: number;
}

export function SiteFooter({
    siteName = "A.T. Field",
    icpNumber,
    startYear = 2024
}: SiteFooterProps) {
    const currentYear = new Date().getFullYear();
    const copyrightYear = startYear === currentYear ? startYear : `${startYear}-${currentYear}`;

    return (
        <footer className="relative z-10 mt-auto py-6 px-4 border-t border-white/10">
            <div className="max-w-6xl mx-auto">
                {/* 法律页面链接 — 精简版 */}
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-4 text-xs text-slate-500 dark:text-slate-400">
                    <Link
                        to="/terms"
                        className="hover:text-primary-start transition-colors"
                    >
                        服务条款
                    </Link>
                    <span className="opacity-50">|</span>
                    <Link
                        to="/legal/privacy"
                        className="hover:text-primary-start transition-colors"
                    >
                        隐私政策
                    </Link>
                    <span className="opacity-50">|</span>
                    <Link
                        to="/legal/disclaimer"
                        className="hover:text-primary-start transition-colors"
                    >
                        免责声明
                    </Link>
                </div>

                {/* 版权和备案信息 */}
                <div className="text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
                    <p>
                        © {copyrightYear} {siteName} · Fhainc
                    </p>
                    {icpNumber && (
                        <p>
                            <a
                                href="https://beian.miit.gov.cn/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary-start transition-colors"
                            >
                                {icpNumber}
                            </a>
                        </p>
                    )}
                </div>
            </div>
        </footer>
    );
}

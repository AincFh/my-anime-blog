/**
 * Cookie 政策页面
 * 符合《个人信息保护法》要求
 */

import { Link } from "react-router";
import { motion } from "framer-motion";
import {
    Cookie, Shield, Settings, Bell, Eye, Trash2,
    Mail, ArrowLeft, Info, Check
} from "lucide-react";

interface SectionProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    delay?: number;
}

function Section({ icon, title, children, delay = 0 }: SectionProps) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="glass-card p-6 rounded-xl space-y-4"
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white">
                    {icon}
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
            </div>
            <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {children}
            </div>
        </motion.section>
    );
}

export default function CookiePolicyPage() {
    return (
        <div className="min-h-screen pt-4 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* 返回按钮 */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary-start transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    返回首页
                </Link>

                {/* 标题区域 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 rounded-2xl mb-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-full blur-3xl" />
                    <div className="relative flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <Cookie className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Cookie 政策</h1>
                            <p className="text-slate-500 dark:text-slate-400">Cookie Policy</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                        最后更新：2026年4月8日 | 了解我们如何使用 Cookie
                    </p>
                </motion.div>

                {/* 内容区域 */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
                    >
                        <div className="flex items-start gap-3">
                            <Info className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">什么是 Cookie？</h3>
                                <p className="text-sm text-blue-700 dark:text-blue-200">
                                    Cookie 是您访问网站时，网站存储在您设备上的小型文本文件。
                                    它们帮助网站记住您的偏好设置、保持登录状态，并提供更好的用户体验。
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <Section icon={<Cookie className="w-5 h-5" />} title="1. 我们使用的 Cookie 类型" delay={0.1}>
                        <div className="space-y-4">
                            {/* 必要 Cookie */}
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-bold text-green-800 dark:text-green-300">必要 Cookie</h3>
                                    <span className="text-xs px-2 py-1 bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full">必须启用</span>
                                </div>
                                <p className="text-sm text-green-700 dark:text-green-200 mb-3">
                                    这些 Cookie 对于网站的基本功能至关重要，无法关闭。
                                </p>
                                <ul className="space-y-1 text-sm text-green-600 dark:text-green-300">
                                    <li>• 身份验证 - 记住您的登录状态</li>
                                    <li>• 安全 - 防止欺诈和保护账户</li>
                                    <li>• 会话 - 维持您的操作状态</li>
                                </ul>
                            </div>

                            {/* 偏好 Cookie */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                                        <Settings className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-blue-800 dark:text-blue-300">偏好 Cookie</h3>
                                    <span className="text-xs px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full">可选</span>
                                </div>
                                <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                                    这些 Cookie 记住您的设置和偏好，提供个性化体验。
                                </p>
                                <ul className="space-y-1 text-sm text-blue-600 dark:text-blue-300">
                                    <li>• 主题选择 - 深色/浅色模式</li>
                                    <li>• 语言设置 - 界面语言偏好</li>
                                    <li>• 显示设置 - 字体大小等</li>
                                </ul>
                            </div>

                            {/* 分析 Cookie */}
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center text-white">
                                        <Eye className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-purple-800 dark:text-purple-300">分析 Cookie</h3>
                                    <span className="text-xs px-2 py-1 bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-full">可选</span>
                                </div>
                                <p className="text-sm text-purple-700 dark:text-purple-200 mb-3">
                                    这些 Cookie 帮助我们了解访客如何与网站互动。
                                </p>
                                <ul className="space-y-1 text-sm text-purple-600 dark:text-purple-300">
                                    <li>• 访问统计 - 页面访问量分析</li>
                                    <li>• 用户行为 - 了解用户如何浏览</li>
                                    <li>• 性能监控 - 发现网站问题</li>
                                </ul>
                            </div>

                            {/* 营销 Cookie */}
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                                        <Bell className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-amber-800 dark:text-amber-300">营销 Cookie</h3>
                                    <span className="text-xs px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 rounded-full">可选</span>
                                </div>
                                <p className="text-sm text-amber-700 dark:text-amber-200 mb-3">
                                    我们当前<strong>不使用</strong>营销 Cookie 进行跨站追踪或精准广告投放。
                                </p>
                            </div>
                        </div>
                    </Section>

                    <Section icon={<Settings className="w-5 h-5" />} title="2. 如何管理 Cookie" delay={0.15}>
                        <p className="mb-4">您可以通过以下方式管理 Cookie 偏好：</p>
                        <div className="space-y-3">
                            {[
                                {
                                    title: "浏览器设置",
                                    desc: "大多数浏览器允许您通过设置阻止、删除或接受特定网站的 Cookie",
                                    icon: "🌐"
                                },
                                {
                                    title: "隐私设置",
                                    desc: "在我们的网站上，您可以通过弹窗选择接受哪些类型的 Cookie",
                                    icon: "⚙️"
                                },
                                {
                                    title: "第三方工具",
                                    desc: "您可以使用浏览器的隐私浏览模式来避免部分追踪",
                                    icon: "🔒"
                                }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <span className="text-2xl">{item.icon}</span>
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-white">{item.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="text-sm text-amber-700 dark:text-amber-200">
                                <strong>注意：</strong>禁用必要 Cookie 可能导致网站部分功能无法正常工作。
                            </p>
                        </div>
                    </Section>

                    <Section icon={<Trash2 className="w-5 h-5" />} title="3. Cookie 保留期限" delay={0.2}>
                        <p className="mb-4">不同类型的 Cookie 有不同的保留期限：</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="py-3 px-4 text-left font-semibold text-slate-800 dark:text-white">Cookie 类型</th>
                                        <th className="py-3 px-4 text-left font-semibold text-slate-800 dark:text-white">保留期限</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <td className="py-3 px-4">会话 Cookie</td>
                                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">关闭浏览器后自动删除</td>
                                    </tr>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <td className="py-3 px-4">记住登录状态</td>
                                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">30 天（可配置）</td>
                                    </tr>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <td className="py-3 px-4">用户偏好设置</td>
                                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">1 年</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4">安全相关</td>
                                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">会话结束或最多 24 小时</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Section>

                    <Section icon={<Shield className="w-5 h-5" />} title="4. 您的权利" delay={0.25}>
                        <p className="mb-4">根据《个人信息保护法》，您对您的个人信息（包括 Cookie 数据）拥有以下权利：</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { name: "知情权", desc: "了解 Cookie 的使用目的", icon: "👁️" },
                                { name: "选择权", desc: "选择接受或拒绝 Cookie", icon: "✅" },
                                { name: "删除权", desc: "请求删除您的 Cookie 数据", icon: "🗑️" },
                                { name: "投诉权", desc: "向监管部门投诉", icon: "📢" }
                            ].map((item, i) => (
                                <div key={i} className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <span className="text-2xl">{item.icon}</span>
                                    <div className="font-semibold text-sm mt-2 text-slate-800 dark:text-white">{item.name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<Cookie className="w-5 h-5" />} title="5. 第三方 Cookie" delay={0.3}>
                        <p className="mb-4">我们使用的第三方服务可能设置自己的 Cookie：</p>
                        <div className="space-y-3">
                            {[
                                { name: "Cloudflare", desc: "网站安全与性能", url: "https://www.cloudflare.com/cookie-policy/" },
                                { name: "Google Fonts", desc: "字体加载", url: "https://policies.google.com/privacy" },
                                { name: "分析服务", desc: "网站使用分析", url: "" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <div>
                                        <span className="font-medium text-slate-800 dark:text-white">{item.name}</span>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                                    </div>
                                    {item.url && (
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary-start hover:underline"
                                        >
                                            查看政策
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<Bell className="w-5 h-5" />} title="6. 政策更新" delay={0.35}>
                        <p>
                            我们可能会不时更新本 Cookie 政策。任何更新将在此页面上发布，并更新页面顶部的"最后更新"日期。
                            建议您定期查阅本页面以了解最新信息。
                        </p>
                    </Section>

                    {/* 联系方式 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-card p-6 rounded-xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                                <Mail className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">联系我们</h2>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-4">
                            如对 Cookie 使用有任何疑问，请联系我们：
                        </p>
                        <a
                            href="mailto:mail@aincfh.dpdns.org"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            mail@aincfh.dpdns.org
                        </a>
                    </motion.div>

                    {/* 同意提示 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center"
                    >
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            💡 继续使用本网站即表示您同意我们根据本 Cookie 政策使用 Cookie
                        </p>
                    </motion.div>
                </div>

                {/* 底部导航 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 flex justify-center gap-4"
                >
                    <Link
                        to="/"
                        className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        返回首页
                    </Link>
                    <Link
                        to="/legal/privacy"
                        className="px-6 py-2 bg-primary-start text-white rounded-xl hover:bg-primary-end transition-colors"
                    >
                        查看隐私政策
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

/**
 * 隐私政策页面 - 优化后的UI
 */

import { Link } from "react-router";
import { motion } from "framer-motion";
import {
    Shield, Database, Share2, Lock, Cookie, UserCheck,
    Baby, RefreshCw, Mail, ArrowLeft, Server
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
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
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

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
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
                    className="glass-card p-8 rounded-2xl mb-8"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">隐私政策</h1>
                            <p className="text-slate-500 dark:text-slate-400">Privacy Policy</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                        最后更新：2024年12月 | 我们重视您的隐私权益
                    </p>
                </motion.div>

                {/* 内容区域 */}
                <div className="space-y-6">
                    <Section icon={<Database className="w-5 h-5" />} title="1. 信息收集" delay={0.1}>
                        <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-2">1.1 您主动提供的信息</h3>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span>注册时提供的邮箱地址</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span>您设置的用户名和头像</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span>您发布的评论内容</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-2">1.2 自动收集的信息</h3>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span>设备类型和浏览器信息</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span>IP 地址（用于安全保护）</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span>访问时间和浏览页面</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span>Cookie 和本地存储数据</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">1.3 支付相关信息</h3>
                                <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-200">
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1">•</span>
                                        <span>支付订单号和金额</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1">•</span>
                                        <span>支付方式（不含银行卡号等敏感信息）</span>
                                    </li>
                                </ul>
                                <p className="mt-3 text-sm font-medium">
                                    ⚠️ 重要：我们不存储银行卡号、支付密码等敏感支付信息。所有支付由第三方支付平台直接处理。
                                </p>
                            </div>
                        </div>
                    </Section>

                    <Section icon={<Share2 className="w-5 h-5" />} title="2. 信息使用" delay={0.15}>
                        <p className="mb-4">我们将收集的信息用于：</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                "提供和改进网站服务",
                                "处理会员订阅和支付",
                                "发送服务通知（如续费提醒）",
                                "保障账户安全",
                                "分析网站使用情况以优化体验"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-sm">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                                        {i + 1}
                                    </div>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<Share2 className="w-5 h-5" />} title="3. 信息共享" delay={0.2}>
                        <p className="mb-4 text-green-600 dark:text-green-400 font-medium">
                            ✓ 我们不会出售您的个人信息
                        </p>
                        <p className="mb-3">以下情况可能涉及信息共享：</p>
                        <div className="space-y-3">
                            <div className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                                    💳
                                </div>
                                <div>
                                    <strong className="text-slate-800 dark:text-white">支付处理</strong>
                                    <p className="text-sm">与支付平台共享必要的订单信息</p>
                                </div>
                            </div>
                            <div className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                                    ⚖️
                                </div>
                                <div>
                                    <strong className="text-slate-800 dark:text-white">法律要求</strong>
                                    <p className="text-sm">响应法律程序或政府强制要求</p>
                                </div>
                            </div>
                            <div className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                                    🛡️
                                </div>
                                <div>
                                    <strong className="text-slate-800 dark:text-white">安全保护</strong>
                                    <p className="text-sm">防止欺诈或保护用户安全</p>
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section icon={<Lock className="w-5 h-5" />} title="4. 数据安全" delay={0.25}>
                        <p className="mb-4">我们采取以下措施保护您的数据：</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { icon: "🔐", text: "密码使用 PBKDF2 算法加密" },
                                { icon: "🔑", text: "2FA 密钥使用 AES-256 加密" },
                                { icon: "🌐", text: "所有传输使用 HTTPS 加密" },
                                { icon: "🔍", text: "定期安全审计和漏洞修复" },
                                { icon: "👮", text: "访问权限严格控制" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm">
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="text-green-700 dark:text-green-300">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<Cookie className="w-5 h-5" />} title="5. Cookie 使用" delay={0.3}>
                        <p className="mb-4">我们使用 Cookie 用于：</p>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span> 保持登录状态
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span> 记住您的偏好设置
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span> 分析网站流量
                            </li>
                        </ul>
                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                            💡 您可以在浏览器设置中禁用 Cookie，但可能影响部分功能。
                        </p>
                    </Section>

                    <Section icon={<UserCheck className="w-5 h-5" />} title="6. 您的权利" delay={0.35}>
                        <p className="mb-4">您对自己的数据拥有以下权利：</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { name: "访问权", desc: "查看您的个人信息" },
                                { name: "更正权", desc: "更新不准确的信息" },
                                { name: "删除权", desc: "请求删除账户和数据" },
                                { name: "导出权", desc: "导出您的数据副本" }
                            ].map((right, i) => (
                                <div key={i} className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="text-2xl mb-2">📋</div>
                                    <div className="font-semibold text-slate-800 dark:text-white text-sm">{right.name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{right.desc}</div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<Baby className="w-5 h-5" />} title="7. 未成年人保护" delay={0.4}>
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-red-700 dark:text-red-300">
                                本网站不面向 <strong>14 周岁以下</strong>未成年人。如果您是未成年人家长，发现您的孩子未经同意向我们提供了信息，请联系我们删除。
                            </p>
                        </div>
                    </Section>

                    <Section icon={<RefreshCw className="w-5 h-5" />} title="8. 政策更新" delay={0.45}>
                        <p>
                            我们可能不时更新本隐私政策。重大变更将通过网站公告或邮件通知您。
                            继续使用本网站即表示您接受更新后的政策。
                        </p>
                    </Section>

                    <Section icon={<Mail className="w-5 h-5" />} title="9. 联系我们" delay={0.5}>
                        <p className="mb-4">如有隐私相关问题，请联系：</p>
                        <div className="flex flex-wrap gap-4">
                            <a
                                href="mailto:fhainc@hotmail.com"
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                            >
                                <Mail className="w-4 h-4" />
                                fhainc@hotmail.com
                            </a>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-lg">
                                <Server className="w-4 h-4" />
                                托管于 Cloudflare Workers
                            </div>
                        </div>
                    </Section>
                </div>

                {/* 底部导航 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 flex justify-center gap-4"
                >
                    <Link
                        to="/"
                        className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        返回首页
                    </Link>
                    <Link
                        to="/terms"
                        className="px-6 py-2 bg-primary-start text-white rounded-xl hover:bg-primary-end transition-colors"
                    >
                        查看服务条款
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

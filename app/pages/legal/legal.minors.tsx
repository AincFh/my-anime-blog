/**
 * 未成年人保护条款页面
 * 符合《个人信息保护法》《未成年人保护法》要求
 */

import { Link } from "react-router";
import { motion } from "framer-motion";
import {
    Baby, Shield, Heart, AlertTriangle, Mail, ArrowLeft,
    Phone, Parents, BookOpen, Scale
} from "lucide-react";

interface SectionProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    delay?: number;
    variant?: 'default' | 'warning' | 'info' | 'danger';
}

function Section({ icon, title, children, delay = 0, variant = 'default' }: SectionProps) {
    const bgColor = {
        default: 'from-blue-500 to-indigo-600',
        warning: 'from-amber-500 to-orange-600',
        info: 'from-green-500 to-emerald-600',
        danger: 'from-red-500 to-pink-600',
    }[variant];

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="glass-card p-6 rounded-xl space-y-4"
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${bgColor} flex items-center justify-center text-white`}>
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

export default function MinorProtectionPage() {
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
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/20 to-rose-600/20 rounded-full blur-3xl" />
                    <div className="relative flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                            <Baby className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">未成年人保护条款</h1>
                            <p className="text-slate-500 dark:text-slate-400">Minor Protection Policy</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                        最后更新：2026年4月8日 | 保护未成年人的权益是我们的责任
                    </p>
                </motion.div>

                {/* 内容区域 */}
                <div className="space-y-6">
                    {/* 特别提示 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="p-5 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-200 dark:border-pink-800 rounded-xl"
                    >
                        <div className="flex items-start gap-3">
                            <Heart className="w-6 h-6 text-pink-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-pink-800 dark:text-pink-300 mb-2">💝 我们的承诺</h3>
                                <p className="text-sm text-pink-700 dark:text-pink-200">
                                    我们高度重视未成年人的身心健康和合法权益保护。
                                    本条款旨在告知家长、监护人及未成年人本人，我们如何收集、使用和保护未成年人的个人信息。
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <Section icon={<AlertTriangle className="w-5 h-5" />} title="1. 年龄限制声明" delay={0.1} variant="danger">
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <h3 className="font-bold text-red-800 dark:text-red-300 mb-2">🚫 年龄要求</h3>
                                <p className="text-sm text-red-700 dark:text-red-200">
                                    <strong>本服务不面向 16 周岁以下的未成年人。</strong>
                                </p>
                                <p className="text-sm text-red-700 dark:text-red-200 mt-2">
                                    如果您未满 16 周岁，请勿注册账户或使用本服务。
                                    如果您已注册账户后发现未满 14 周岁，请立即联系我们的客服团队申请注销账户。
                                </p>
                            </div>
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-2">⚠️ 监护人须知</h3>
                                <p className="text-sm text-amber-700 dark:text-amber-200">
                                    如果您是 16-18 周岁未成年人的监护人，请了解：
                                </p>
                                <ul className="mt-2 space-y-1 text-sm text-amber-600 dark:text-amber-300">
                                    <li>• 您的孩子需要监护人的同意才能注册账户</li>
                                    <li>• 建议您与孩子讨论互联网安全使用常识</li>
                                    <li>• 建议您监督孩子的在线活动</li>
                                </ul>
                            </div>
                        </div>
                    </Section>

                    <Section icon={<Shield className="w-5 h-5" />} title="2. 个人信息保护" delay={0.15} variant="info">
                        <p className="mb-4">我们承诺对未成年人个人信息进行特殊保护：</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                { icon: "🔒", title: "最小化收集", desc: "仅收集服务所必需的信息" },
                                { icon: "🎯", title: "明确目的", desc: "告知收集信息的目的和用途" },
                                { icon: "⏰", title: "有限保留", desc: "仅在必要期限内保留信息" },
                                { icon: "🛡️", title: "加强保护", desc: "采取更严格的安全措施" }
                            ].map((item, i) => (
                                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <span className="text-2xl">{item.icon}</span>
                                    <h4 className="font-semibold text-sm mt-2 text-slate-800 dark:text-white">{item.title}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<BookOpen className="w-5 h-5" />} title="3. 内容规范" delay={0.2}>
                        <p className="mb-4">我们致力于为未成年人提供健康、安全的网络环境：</p>
                        <div className="space-y-3">
                            {[
                                { icon: "✅", text: "我们不会展示任何色情、暴力、赌博等内容" },
                                { icon: "✅", text: "我们不会向未成年人推送任何形式的广告" },
                                { icon: "✅", text: "我们不会利用算法诱导未成年人沉迷使用" },
                                { icon: "✅", text: "我们提供健康的内容推荐和积极的价值引导" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <span className="text-green-500 text-lg">{item.icon}</span>
                                    <span className="text-sm text-green-700 dark:text-green-200">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<Parents className="w-5 h-5" />} title="4. 监护人权利" delay={0.25}>
                        <p className="mb-4">作为监护人，您拥有以下权利：</p>
                        <div className="space-y-3">
                            {[
                                {
                                    title: "知情权",
                                    desc: "了解我们如何收集和使用您孩子的个人信息",
                                    icon: "👁️"
                                },
                                {
                                    title: "同意权",
                                    desc: "您需同意您的孩子（16-18周岁）注册账户",
                                    icon: "✅"
                                },
                                {
                                    title: "访问权",
                                    desc: "了解您孩子的账户信息和活动记录",
                                    icon: "📖"
                                },
                                {
                                    title: "删除权",
                                    desc: "要求删除您孩子的个人信息",
                                    icon: "🗑️"
                                },
                                {
                                    title: "拒绝权",
                                    desc: "拒绝我们进一步收集或使用您孩子的信息",
                                    icon: "🚫"
                                },
                                {
                                    title: "投诉权",
                                    desc: "向我们或相关监管部门投诉",
                                    icon: "📢"
                                }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <span className="text-2xl">{item.icon}</span>
                                    <div>
                                        <h4 className="font-semibold text-sm text-slate-800 dark:text-white">{item.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<AlertTriangle className="w-5 h-5" />} title="5. 违规内容举报" delay={0.3} variant="warning">
                        <p className="mb-4">如果您发现以下情况，请立即举报：</p>
                        <div className="space-y-2">
                            {[
                                "发现针对未成年人的不当内容或行为",
                                "发现有人试图联系您的孩子",
                                "发现违反本政策的行为",
                                "您的孩子账户被盗用"
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                    <span className="text-amber-500 mt-0.5">•</span>
                                    <span className="text-sm text-amber-700 dark:text-amber-200">{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-200">
                                <strong>紧急情况：</strong>如果您的孩子面临紧急危险，请立即拨打 110 报警。
                            </p>
                        </div>
                    </Section>

                    <Section icon={<Phone className="w-5 h-5" />} title="6. 联系方式" delay={0.35}>
                        <p className="mb-4">如有关于未成年人保护的问题，请通过以下方式联系我们：</p>
                        <div className="space-y-3">
                            <a
                                href="mailto:mail@aincfh.dpdns.org"
                                className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                            >
                                <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <div>
                                    <span className="font-medium text-green-800 dark:text-green-300">电子邮件</span>
                                    <p className="text-sm text-green-600 dark:text-green-400">mail@aincfh.dpdns.org</p>
                                </div>
                            </a>
                        </div>
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                我们将在收到您的联系请求后 <strong>3 个工作日内</strong> 给予回复。
                                如需紧急处理，请说明"紧急"字样。
                            </p>
                        </div>
                    </Section>

                    <Section icon={<Scale className="w-5 h-5" />} title="7. 法律适用" delay={0.4}>
                        <p>
                            本条款的解释和适用受中华人民共和国法律管辖。
                            如发生争议，双方应友好协商解决；协商不成的，应提交至我们所在地有管辖权的人民法院诉讼解决。
                        </p>
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                <strong>相关法律：</strong>
                            </p>
                            <ul className="mt-2 space-y-1 text-sm text-slate-500 dark:text-slate-400">
                                <li>• 《中华人民共和国个人信息保护法》</li>
                                <li>• 《中华人民共和国未成年人保护法》</li>
                                <li>• 《中华人民共和国网络安全法》</li>
                            </ul>
                        </div>
                    </Section>

                    {/* 提醒 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center"
                    >
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            💡 建议家长与孩子一起学习互联网安全知识，共同营造健康的网络环境
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

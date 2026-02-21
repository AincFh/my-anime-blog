/**
 * 服务条款页面 - 优化后的UI
 */

import { Link } from "react-router";
import { motion } from "framer-motion";
import {
    FileText, UserPlus, ShieldCheck, Copyright, Gavel,
    AlertTriangle, Power, Scale, MoreHorizontal, ArrowLeft, Mail
} from "lucide-react";

interface SectionProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    delay?: number;
    variant?: 'default' | 'warning';
}

function Section({ icon, title, children, delay = 0, variant = 'default' }: SectionProps) {
    const bgColor = variant === 'warning'
        ? 'from-amber-500 to-orange-600'
        : 'from-indigo-500 to-purple-600';

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

export default function TermsOfService() {
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
                    className="glass-card p-8 rounded-2xl mb-8"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">服务条款</h1>
                            <p className="text-slate-500 dark:text-slate-400">Terms of Service</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                        生效日期：2025年12月7日 | 请仔细阅读以下条款
                    </p>
                </motion.div>

                {/* 内容区域 */}
                <div className="space-y-6">
                    <Section icon={<FileText className="w-5 h-5" />} title="1. 条款接受" delay={0.1}>
                        <p>
                            欢迎访问我们的网站。通过注册账户、访问或使用我们的服务，即表示您已阅读、理解并同意受本服务条款的约束。
                        </p>
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-blue-700 dark:text-blue-300 text-sm">
                                💡 如果您不同意这些条款的任何部分，请立即停止使用本服务。
                            </p>
                        </div>
                    </Section>

                    <Section icon={<UserPlus className="w-5 h-5" />} title="2. 账户注册与安全" delay={0.15}>
                        <div className="space-y-3">
                            {[
                                { title: "注册资格", desc: "您必须年满18岁或在监护人同意下使用本服务。" },
                                { title: "信息真实性", desc: "您同意提供真实、准确、完整和最新的注册信息。" },
                                { title: "账户安全", desc: "您有责任维护账户密码的保密性，并对您账户下的所有活动负责。" },
                                { title: "账户归属", desc: "账户仅限您本人使用，不得转让、借用或出售给他人。" }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <strong className="text-slate-800 dark:text-white">{item.title}</strong>
                                        <p className="text-sm mt-1">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<ShieldCheck className="w-5 h-5" />} title="3. 用户行为规范" delay={0.2}>
                        <p className="mb-4">您在使用本服务时必须遵守所有适用的法律法规，并同意不从事以下行为：</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                "发布违法、危害国家安全的内容",
                                "发布淫秽、暴力、赌博等内容",
                                "侮辱、诽谤、骚扰他人",
                                "发布垃圾广告或恶意软件",
                                "冒充他人或机构",
                                "未经授权收集用户信息"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm">
                                    <span className="text-red-500">✗</span>
                                    <span className="text-red-700 dark:text-red-300">{item}</span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<Copyright className="w-5 h-5" />} title="4. 知识产权" delay={0.25}>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-2">4.1 平台内容</h3>
                                <p className="text-sm">
                                    本网站及其包含的所有内容（包括但不限于文本、图片、音频、视频、软件、代码、商标、Logo等），
                                    除用户生成内容外，均归我们或相关权利人所有，受法律保护。
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-2">4.2 用户生成内容</h3>
                                <p className="text-sm">
                                    您在平台上发布的内容版权归您所有。但通过发布内容，即表示您授予我们一项全球性的、免费的、非独家的许可，
                                    允许我们使用、复制、修改、出版和展示该内容，用于运营和推广本服务。
                                </p>
                            </div>
                        </div>
                    </Section>

                    <Section icon={<Gavel className="w-5 h-5" />} title="5. 违规处理" delay={0.3}>
                        <p className="mb-4">如果我们发现或收到举报称您违反了本条款，我们有权视情节轻重采取以下措施：</p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { text: "删除违规内容", severity: "low" },
                                { text: "警告", severity: "low" },
                                { text: "限制功能", severity: "medium" },
                                { text: "暂停账户", severity: "medium" },
                                { text: "永久注销", severity: "high" },
                                { text: "追究法律责任", severity: "high" }
                            ].map((item, i) => (
                                <span
                                    key={i}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${item.severity === 'low' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        item.severity === 'medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}
                                >
                                    {item.text}
                                </span>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<AlertTriangle className="w-5 h-5" />} title="6. 免责声明" delay={0.35} variant="warning">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="text-amber-800 dark:text-amber-200">
                                本服务按"现状"提供，我们不作任何明示或暗示的保证。我们不保证服务不会中断、没有错误或绝对安全。
                                在法律允许的最大范围内，我们不对因使用本服务产生的任何直接或间接损害负责。
                            </p>
                        </div>
                    </Section>

                    <Section icon={<Power className="w-5 h-5" />} title="7. 服务变更与终止" delay={0.4}>
                        <p>
                            我们保留随时修改、暂停或终止部分或全部服务的权利，且无需提前通知。
                            我们不对因服务变更或终止对您造成的损失负责。
                        </p>
                    </Section>

                    <Section icon={<Scale className="w-5 h-5" />} title="8. 适用法律与争议解决" delay={0.45}>
                        <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <Scale className="w-6 h-6 text-indigo-500 shrink-0 mt-1" />
                            <p>
                                本条款的解释和适用均受中华人民共和国法律管辖。如发生争议，双方应友好协商解决；
                                协商不成的，应提交至我们所在地有管辖权的人民法院诉讼解决。
                            </p>
                        </div>
                    </Section>

                    <Section icon={<MoreHorizontal className="w-5 h-5" />} title="9. 其他" delay={0.5}>
                        <p>
                            如果本条款的任何条款被认定为无效或不可执行，不影响其他条款的效力。
                            我们未行使本条款下的任何权利不构成对该权利的放弃。
                        </p>
                    </Section>

                    {/* 联系方式 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 }}
                        className="glass-card p-6 rounded-xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                                <Mail className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">联系我们</h2>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-4">如有任何问题，请联系：</p>
                        <a
                            href="mailto:fhainc@hotmail.com"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            fhainc@hotmail.com
                        </a>
                    </motion.div>
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

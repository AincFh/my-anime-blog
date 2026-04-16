/**
 * AI 服务条款页面
 * 符合《生成式人工智能服务管理暂行办法》要求
 */

import { Link } from "react-router";
import { motion } from "framer-motion";
import {
    Brain, AlertTriangle, Shield, FileText, Scale,
    User, Lightbulb, MessageSquare, Clock, Mail, ArrowLeft, Sparkles
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
        default: 'from-indigo-500 to-purple-600',
        warning: 'from-amber-500 to-orange-600',
        info: 'from-blue-500 to-cyan-600',
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

export default function AIServiceTermsPage() {
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
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-full blur-3xl" />
                    <div className="relative flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Brain className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">AI 服务条款</h1>
                            <p className="text-slate-500 dark:text-slate-400">AI Service Terms</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                        最后更新：2026年4月8日 | 请仔细阅读以下条款
                    </p>
                </motion.div>

                {/* 内容区域 */}
                <div className="space-y-6">
                    {/* 重要提示 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="p-5 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                    >
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-red-800 dark:text-red-300 mb-2">⚠️ 重要提示</h3>
                                <p className="text-sm text-red-700 dark:text-red-200">
                                    本网站使用 AI 技术提供智能对话服务。在使用前，请务必阅读并理解以下条款。
                                    <strong>使用 AI 服务即表示您同意遵守本条款的全部内容。</strong>
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <Section icon={<Sparkles className="w-5 h-5" />} title="1. 服务说明" delay={0.1}>
                        <p className="mb-4">我们的 AI 服务基于 Deepseek 大语言模型技术，为您提供以下功能：</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { icon: "💬", name: "智能对话", desc: "AI 聊天助手" },
                                { icon: "📝", name: "内容辅助", desc: "写作建议生成" },
                                { icon: "🔍", name: "信息查询", desc: "知识问答" },
                                { icon: "🎯", name: "个性化", desc: "基于您的偏好" }
                            ].map((item, i) => (
                                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                                    <span className="text-2xl">{item.icon}</span>
                                    <p className="font-medium text-sm mt-2 text-slate-800 dark:text-white">{item.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<AlertTriangle className="w-5 h-5" />} title="2. 免责声明（核心条款）" delay={0.15} variant="danger">
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <h3 className="font-bold text-red-800 dark:text-red-300 mb-3">🚨 AI 生成内容仅供参考</h3>
                                <ul className="space-y-2 text-sm text-red-700 dark:text-red-200">
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        <span>AI 生成的回答可能包含不准确、过时、错误或虚构的信息</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        <span>我们不对 AI 输出内容的准确性、完整性、及时性作出任何保证</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        <span>用户应自行判断 AI 生成内容的可用性，并承担使用风险</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <h3 className="font-bold text-red-800 dark:text-red-300 mb-3">🚫 不得作为专业建议的依据</h3>
                                <ul className="space-y-2 text-sm text-red-700 dark:text-red-200">
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        <span><strong>医疗健康</strong>：AI 内容不能替代医生诊断或治疗建议</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        <span><strong>法律咨询</strong>：AI 内容不能替代律师的法律意见</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        <span><strong>财务投资</strong>：AI 内容不能替代专业的财务顾问建议</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        <span><strong>心理健康</strong>：如需心理帮助，请寻求专业机构支持</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-3">⚠️ 服务可用性</h3>
                                <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-200">
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-500 mt-0.5">•</span>
                                        <span>AI 服务可能因技术原因出现中断、延迟或错误</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-500 mt-0.5">•</span>
                                        <span>我们保留在不通知的情况下暂停或调整 AI 服务的权利</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-500 mt-0.5">•</span>
                                        <span>AI 服务的响应速度和结果质量可能因服务器负载而异</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </Section>

                    <Section icon={<Shield className="w-5 h-5" />} title="3. 使用限制" delay={0.2}>
                        <p className="mb-4">您在使用 AI 服务时，必须遵守以下规定：</p>
                        <div className="space-y-3">
                            {[
                                { title: "禁止生成违法内容", desc: "不得利用 AI 生成违法、违规、有害的内容" },
                                { title: "禁止侵权行为", desc: "不得利用 AI 生成侵犯他人知识产权的内容" },
                                { title: "禁止欺骗行为", desc: "不得利用 AI 生成虚假信息进行欺骗或误导" },
                                { title: "禁止商业滥用", desc: "未经许可，不得将 AI 服务用于商业牟利" }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-sm shrink-0">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <strong className="text-slate-800 dark:text-white">{item.title}</strong>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<User className="w-5 h-5" />} title="4. 内容审核与数据使用" delay={0.25}>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-2">4.1 内容审核</h3>
                                <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                    <li>• 您的 AI 对话内容可能经过自动审核以确保服务安全</li>
                                    <li>• 违规内容可能被系统拦截且不会得到回答</li>
                                    <li>• 严重违规行为可能导致账户被限制或封禁</li>
                                </ul>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-2">4.2 数据使用</h3>
                                <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                    <li>• 您的对话内容可能用于改善 AI 服务质量</li>
                                    <li>• 我们不会将您的对话内容用于训练对外开放的 AI 模型</li>
                                    <li>• 具体数据处理方式请参阅我们的隐私政策</li>
                                </ul>
                            </div>
                        </div>
                    </Section>

                    <Section icon={<FileText className="w-5 h-5" />} title="5. 知识产权说明" delay={0.3}>
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">5.1 AI 生成内容</h3>
                                <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-200">
                                    <li>• AI 生成的内容的版权归您本人所有</li>
                                    <li>• 您需对使用 AI 生成内容的行为承担相应责任</li>
                                    <li>• 引用 AI 生成内容时请注明"由 AI 辅助生成"</li>
                                </ul>
                            </div>
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">5.2 服务本身</h3>
                                <ul className="space-y-1 text-sm text-purple-700 dark:text-purple-200">
                                    <li>• AI 服务的底层技术和模型归相应权利人所有</li>
                                    <li>• 未经授权，不得对 AI 服务进行逆向工程或滥用</li>
                                </ul>
                            </div>
                        </div>
                    </Section>

                    <Section icon={<Clock className="w-5 h-5" />} title="6. 服务变更" delay={0.35}>
                        <p className="mb-4">我们保留以下权利：</p>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">•</span>
                                <span className="text-slate-600 dark:text-slate-300">随时修改、暂停或终止 AI 服务的全部或部分功能</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">•</span>
                                <span className="text-slate-600 dark:text-slate-300">调整 AI 服务的使用限制和配额</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">•</span>
                                <span className="text-slate-600 dark:text-slate-300">更新或替换 AI 模型版本</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">•</span>
                                <span className="text-slate-600 dark:text-slate-300">不对因服务变更造成的任何损失承担责任</span>
                            </li>
                        </ul>
                    </Section>

                    <Section icon={<Scale className="w-5 h-5" />} title="7. 法律适用与争议解决" delay={0.4}>
                        <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <Scale className="w-6 h-6 text-indigo-500 shrink-0 mt-1" />
                            <div>
                                <p className="text-slate-800 dark:text-white">
                                    本条款的解释和适用均受中华人民共和国法律管辖。
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                    如发生争议，双方应友好协商解决；协商不成的，应提交至我们所在地有管辖权的人民法院诉讼解决。
                                </p>
                            </div>
                        </div>
                    </Section>

                    {/* 联系方式 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="glass-card p-6 rounded-xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                                <Mail className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">联系我们</h2>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-4">
                            如对 AI 服务条款有任何疑问，请联系我们：
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
                        transition={{ delay: 0.5 }}
                        className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-center"
                    >
                        <p className="text-sm text-indigo-700 dark:text-indigo-300">
                            💡 使用 AI 服务即表示您已阅读、理解并同意遵守本 AI 服务条款的全部内容
                        </p>
                    </motion.div>
                </div>

                {/* 底部导航 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 }}
                    className="mt-8 flex justify-center gap-4"
                >
                    <Link
                        to="/"
                        className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        返回首页
                    </Link>
                    <Link
                        to="/legal/disclaimer"
                        className="px-6 py-2 bg-primary-start text-white rounded-xl hover:bg-primary-end transition-colors"
                    >
                        查看免责声明
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

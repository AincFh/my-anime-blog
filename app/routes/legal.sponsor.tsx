/**
 * 赞助条款页面 - 优化后的UI
 */

import { Link } from "react-router";
import { motion } from "framer-motion";
import {
    Heart, Gift, Crown, CreditCard, RefreshCw,
    XCircle, AlertTriangle, Mail, ArrowLeft, Sparkles, Star
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
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white">
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

export default function SponsorTermsPage() {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* 返回按钮 */}
                <Link
                    to="/user/membership"
                    className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary-start transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    返回会员中心
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
                            <Heart className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">赞助条款</h1>
                            <p className="text-slate-500 dark:text-slate-400">Sponsor Terms</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                        最后更新：2024年12月 | 感谢您的支持 ❤️
                    </p>
                </motion.div>

                {/* 内容区域 */}
                <div className="space-y-6">
                    <Section icon={<Heart className="w-5 h-5" />} title="1. 性质说明" delay={0.1}>
                        <div className="p-4 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg mb-4">
                            <p className="text-pink-800 dark:text-pink-200">
                                本网站为<strong>个人非营利性项目</strong>。您通过本站进行的付费行为属于<strong>自愿赞助性质</strong>，
                                旨在支持网站的运营和发展，并非商品或服务交易。
                            </p>
                        </div>
                        <p>
                            赞助后获得的"VIP会员"或"SVIP会员"身份及相关权益，是对您赞助行为的感谢回馈，不构成商业合同关系。
                        </p>
                    </Section>

                    <Section icon={<Gift className="w-5 h-5" />} title="2. 会员权益" delay={0.15}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* VIP 卡片 */}
                            <div className="p-5 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <Crown className="w-6 h-6 text-amber-500" />
                                    <span className="font-bold text-lg text-amber-600 dark:text-amber-400">VIP 会员</span>
                                </div>
                                <ul className="space-y-2 text-sm">
                                    {[
                                        "追番记录无限制",
                                        "每日 AI 聊天 50 次",
                                        "去除页面广告",
                                        "积分获取 1.5 倍",
                                        "专属头像边框",
                                        "专属表情包",
                                        "自定义主题颜色"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                                            <span className="text-amber-500">✓</span> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* SVIP 卡片 */}
                            <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl relative">
                                <div className="absolute top-3 right-3">
                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                </div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Star className="w-6 h-6 text-purple-500" />
                                    <span className="font-bold text-lg text-purple-600 dark:text-purple-400">SVIP 会员</span>
                                </div>
                                <ul className="space-y-2 text-sm">
                                    {[
                                        "包含 VIP 全部权益",
                                        "AI 聊天无限制",
                                        "积分获取 2 倍",
                                        "专属动态特效",
                                        "新内容提前 24 小时访问",
                                        "优先客服响应"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                                            <span className="text-purple-500">✓</span> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Section>

                    <Section icon={<CreditCard className="w-5 h-5" />} title="3. 赞助周期与定价" delay={0.2}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="py-3 px-4 text-left font-semibold text-slate-800 dark:text-white">等级</th>
                                        <th className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-white">月付</th>
                                        <th className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-white">
                                            季付
                                            <span className="ml-1 text-xs text-green-500">省17%</span>
                                        </th>
                                        <th className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-white">
                                            年付
                                            <span className="ml-1 text-xs text-green-500">省30%</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-900/10">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <Crown className="w-4 h-4 text-amber-500" />
                                                <span className="font-medium text-amber-600 dark:text-amber-400">VIP</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center font-bold">¥19.9</td>
                                        <td className="py-4 px-4 text-center font-bold">¥49.9</td>
                                        <td className="py-4 px-4 text-center font-bold text-green-600 dark:text-green-400">¥168</td>
                                    </tr>
                                    <tr className="bg-purple-50/50 dark:bg-purple-900/10">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <Star className="w-4 h-4 text-purple-500" />
                                                <span className="font-medium text-purple-600 dark:text-purple-400">SVIP</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center font-bold">¥39.9</td>
                                        <td className="py-4 px-4 text-center font-bold">¥99.9</td>
                                        <td className="py-4 px-4 text-center font-bold text-green-600 dark:text-green-400">¥299</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Section>

                    <Section icon={<RefreshCw className="w-5 h-5" />} title="4. 自动续费" delay={0.25}>
                        <p className="mb-4">若您开通了自动续费功能：</p>
                        <div className="space-y-3">
                            {[
                                { icon: "📧", text: "系统将在会员到期前 3 天 通过邮件通知您即将续费" },
                                { icon: "🔧", text: "若您不希望续费，请在到期前登录会员中心取消" },
                                { icon: "✓", text: "您可以随时取消自动续费，取消后当前周期内权益不受影响" }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <span className="text-xl">{item.icon}</span>
                                    <span>{item.text}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <Link
                                to="/user/membership"
                                className="text-primary-start hover:underline text-sm"
                            >
                                → 前往会员中心管理订阅
                            </Link>
                        </div>
                    </Section>

                    <Section icon={<XCircle className="w-5 h-5" />} title="5. 退款政策" delay={0.3}>
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                                ⚠️ 由于本赞助涉及虚拟权益的即时开通，原则上不支持退款。
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                特殊情况（如重复扣款、系统故障等）请联系我们处理，我们将在核实后 7 个工作日内给予答复。
                            </p>
                        </div>
                    </Section>

                    <Section icon={<Gift className="w-5 h-5" />} title="6. 权益变更" delay={0.35}>
                        <p>
                            我们保留调整会员权益内容的权利。如有重大变更，将提前 7 天通知现有付费会员。
                            现有会员在其已付费周期内享有原有权益。
                        </p>
                    </Section>

                    <Section icon={<AlertTriangle className="w-5 h-5" />} title="7. 免责声明" delay={0.4}>
                        <div className="space-y-2">
                            {[
                                "本站不保证服务 100% 不间断，可能因维护、不可抗力等原因暂停",
                                "会员权益可能因技术限制在部分设备或浏览器上表现不一致",
                                "本站保留对违规用户终止会员资格的权利，违规赞助不予退还"
                            ].map((item, i) => (
                                <div key={i} className="flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm">
                                    <span className="text-red-500 shrink-0">!</span>
                                    <span className="text-red-700 dark:text-red-300">{item}</span>
                                </div>
                            ))}
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
                        <p className="text-slate-600 dark:text-slate-300 mb-4">如有任何问题，请联系：</p>
                        <a
                            href="mailto:fhainc@hotmail.com"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            fhainc@hotmail.com
                        </a>
                    </motion.div>

                    {/* 条款生效说明 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                        💝 您的赞助行为即表示您已阅读、理解并同意本赞助条款的全部内容
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
                        to="/user/membership"
                        className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all"
                    >
                        返回会员中心
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

/**
 * 赞助条款页面 - 四级会员体系版本
 * 包含旅行者、月之子、星之守护者、银河领主四个等级
 */

import { Link } from "react-router";
import { motion } from "framer-motion";
import {
    Heart, Gift, CreditCard, RefreshCw,
    XCircle, AlertTriangle, Mail, ArrowLeft, Sparkles, Star, Moon, Shield, Zap
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

// 会员等级卡片数据
const membershipTiers = [
    {
        name: "旅行者",
        nameEn: "Traveler",
        icon: Shield,
        color: "gray",
        gradient: "from-slate-50 to-gray-50",
        borderColor: "border-slate-200 dark:border-slate-700",
        textColor: "text-slate-600 dark:text-slate-400",
        accentColor: "text-slate-500",
        price: "免费",
        features: [
            "基础收藏夹（20条）",
            "每日图库访问 50 次",
            "每日 AI 聊天 3 次",
            "基础头像框",
            "每日任务"
        ],
        isFree: true
    },
    {
        name: "月之子",
        nameEn: "Moonchild",
        icon: Moon,
        color: "purple",
        gradient: "from-violet-50 to-purple-50",
        borderColor: "border-violet-200 dark:border-violet-800",
        textColor: "text-violet-700 dark:text-violet-300",
        accentColor: "text-violet-500",
        price: "¥9.9/月",
        features: [
            "云端收藏夹（200条）",
            "无限制图库访问",
            "每日 AI 聊天 20 次",
            "去除页面广告",
            "双倍星尘奖励",
            "基础头像框"
        ],
        isFree: false,
        badge: "热门"
    },
    {
        name: "星之守护者",
        nameEn: "Star Guardian",
        icon: Star,
        color: "blue",
        gradient: "from-blue-50 to-indigo-50",
        borderColor: "border-blue-200 dark:border-blue-800",
        textColor: "text-blue-700 dark:text-blue-300",
        accentColor: "text-blue-500",
        price: "¥29.9/月",
        features: [
            "云端收藏夹（500条）",
            "无限制图库访问",
            "每日 AI 聊天 100 次",
            "付费内容抢先 7 天",
            "3 倍星尘奖励",
            "高级头像框",
            "专属表情包",
            "Gacha 保底 +1"
        ],
        isFree: false,
        badge: "推荐"
    },
    {
        name: "银河领主",
        nameEn: "Galaxy Lord",
        icon: Zap,
        color: "amber",
        gradient: "from-amber-50 to-orange-50",
        borderColor: "border-amber-200 dark:border-amber-800",
        textColor: "text-amber-700 dark:text-amber-300",
        accentColor: "text-amber-500",
        price: "¥49.9/月",
        features: [
            "无限云端收藏夹",
            "无限制图库访问",
            "AI 聊天无限制",
            "付费内容完全解锁",
            "5 倍星尘奖励",
            "限定头像框",
            "全套表情包",
            "Gacha 保底 +3",
            "专属社区圈子",
            "优先客服支持"
        ],
        isFree: false,
        badge: "至尊",
        isPremium: true
    }
];

export default function SponsorTermsPage() {
    return (
        <div className="min-h-screen pt-4 pb-12 px-4">
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
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">赞助与会员</h1>
                            <p className="text-slate-500 dark:text-slate-400">Support & Membership</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                        最后更新：2026年4月8日 | 感谢您的支持 ❤️
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
                        <p className="text-sm">
                            赞助后获得的高级会员身份及相关权益，是对您赞助行为的感谢回馈，不构成商业合同关系。
                            所有等级均可享受相应的功能提升。
                        </p>
                    </Section>

                    <Section icon={<Gift className="w-5 h-5" />} title="2. 会员等级权益" delay={0.15}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {membershipTiers.map((tier, index) => {
                                const TierIcon = tier.icon;
                                return (
                                    <div
                                        key={tier.name}
                                        className={`p-5 bg-gradient-to-br ${tier.gradient} dark:from-slate-800/50 dark:to-slate-900/50 border ${tier.borderColor} rounded-xl relative ${tier.isPremium ? 'ring-2 ring-amber-400/50' : ''}`}
                                    >
                                        {tier.badge && (
                                            <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                tier.isPremium
                                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                                                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                                            }`}>
                                                {tier.badge}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 mb-3">
                                            <TierIcon size={24} className={tier.accentColor} />
                                            <div>
                                                <span className={`font-bold text-lg ${tier.textColor}`}>{tier.name}</span>
                                                <p className="text-xs text-slate-400">{tier.nameEn}</p>
                                            </div>
                                        </div>
                                        <div className={`text-lg font-bold mb-4 ${tier.isFree ? 'text-slate-500' : tier.accentColor}`}>
                                            {tier.price}
                                        </div>
                                        <ul className="space-y-2">
                                            {tier.features.map((feature, i) => (
                                                <li key={i} className={`flex items-center gap-2 text-sm ${tier.textColor}`}>
                                                    <span className={tier.accentColor}>✓</span> {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    </Section>

                    <Section icon={<CreditCard className="w-5 h-5" />} title="3. 定价详情" delay={0.2}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="py-3 px-4 text-left font-semibold text-slate-800 dark:text-white">等级</th>
                                        <th className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-white">月付</th>
                                        <th className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-white">季付</th>
                                        <th className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-white">年付</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Shield size={16} className="text-slate-400" />
                                                <span className="font-medium text-slate-600 dark:text-slate-400">旅行者</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center text-slate-500">免费</td>
                                        <td className="py-3 px-4 text-center text-slate-500">—</td>
                                        <td className="py-3 px-4 text-center text-slate-500">—</td>
                                    </tr>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-violet-50/50 dark:bg-violet-900/10">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Moon size={16} className="text-violet-500" />
                                                <span className="font-medium text-violet-600 dark:text-violet-400">月之子</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center font-bold">¥9.9</td>
                                        <td className="py-3 px-4 text-center font-bold">¥24.9</td>
                                        <td className="py-3 px-4 text-center font-bold text-green-600 dark:text-green-400">¥99</td>
                                    </tr>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-900/10">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Star size={16} className="text-blue-500" />
                                                <span className="font-medium text-blue-600 dark:text-blue-400">星之守护者</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center font-bold">¥29.9</td>
                                        <td className="py-3 px-4 text-center font-bold">¥79.9</td>
                                        <td className="py-3 px-4 text-center font-bold text-green-600 dark:text-green-400">¥299</td>
                                    </tr>
                                    <tr className="bg-amber-50/50 dark:bg-amber-900/10">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Zap size={16} className="text-amber-500" />
                                                <span className="font-medium text-amber-600 dark:text-amber-400">银河领主</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center font-bold">¥49.9</td>
                                        <td className="py-3 px-4 text-center font-bold">¥129.9</td>
                                        <td className="py-3 px-4 text-center font-bold text-green-600 dark:text-green-400">¥499</td>
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
                                    <span className="text-sm">{item.text}</span>
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
                            href="mailto:mail@aincfh.dpdns.org"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            mail@aincfh.dpdns.org
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

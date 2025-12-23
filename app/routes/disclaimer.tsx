/**
 * 免责声明页面 - 优化后的UI
 */

import { Link } from "react-router";
import { motion } from "framer-motion";
import { 
    Shield, FileText, AlertTriangle, Scale, User, 
    Server, Brain, Lock, RefreshCw, Mail, ArrowLeft
} from "lucide-react";

interface SectionProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    delay?: number;
    variant?: 'default' | 'warning' | 'info';
}

function Section({ icon, title, children, delay = 0, variant = 'default' }: SectionProps) {
    const bgColor = variant === 'warning' 
        ? 'from-amber-500 to-orange-600' 
        : variant === 'info'
            ? 'from-blue-500 to-cyan-600'
            : 'from-amber-500 to-orange-600';
    
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

export default function Disclaimer() {
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
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">免责声明</h1>
                            <p className="text-slate-500 dark:text-slate-400">Disclaimer</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                        最后更新：2024年12月19日 | 请仔细阅读以下声明
                    </p>
                </motion.div>

                {/* 内容区域 */}
                <div className="space-y-6">
                    <Section icon={<FileText className="w-5 h-5" />} title="一、总则" delay={0.1}>
                        <p>
                            本网站（以下简称"本站"）是个人博客网站，旨在分享动漫、游戏、技术等内容。
                            访问和使用本站即表示您同意接受本免责声明的所有条款。
                        </p>
                        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="text-amber-700 dark:text-amber-300 text-sm">
                                ⚠️ 如您不同意本声明的任何内容，请立即停止使用本站。
                            </p>
                        </div>
                    </Section>

                    <Section icon={<AlertTriangle className="w-5 h-5" />} title="二、内容声明" delay={0.15}>
                        <div className="space-y-3">
                            {[
                                { icon: "📝", text: "本站所发布的文章、图片、视频等内容仅代表作者个人观点，不代表任何组织或机构的立场。" },
                                { icon: "🔗", text: "本站部分内容可能来源于互联网，如涉及版权问题，请及时联系我们，我们将在核实后予以删除或标注来源。" },
                                { icon: "⏰", text: "本站对所发布内容的准确性、完整性、及时性不作任何保证，读者应自行判断并承担使用风险。" },
                                { icon: "🌐", text: "本站可能包含对第三方网站的链接，这些链接仅为方便读者提供，本站不对第三方网站的内容负责。" }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <span className="text-xl shrink-0">{item.icon}</span>
                                    <span className="text-sm">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<Scale className="w-5 h-5" />} title="三、版权说明" delay={0.2}>
                        <div className="space-y-3">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">📄 原创内容</h3>
                                <p className="text-sm text-blue-700 dark:text-blue-200">
                                    本站原创内容采用 <strong>CC BY-NC-SA 4.0</strong> 协议，转载请注明出处并保留原文链接。
                                </p>
                            </div>
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">🎨 素材使用</h3>
                                <p className="text-sm text-purple-700 dark:text-purple-200">
                                    本站使用的动漫图片、角色等素材的版权归原作者/版权方所有，仅作非商业性分享使用。
                                </p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">📧 侵权反馈</h3>
                                <p className="text-sm text-green-700 dark:text-green-200">
                                    如版权方认为本站侵犯了您的权益，请通过网站联系方式告知，我们将及时处理。
                                </p>
                            </div>
                        </div>
                    </Section>

                    <Section icon={<User className="w-5 h-5" />} title="四、用户行为" delay={0.25}>
                        <div className="space-y-2">
                            {[
                                "用户在本站发表的评论、留言等内容，其责任由用户自行承担。",
                                "禁止发布违法、侵权、淫秽、暴力、恶意攻击等不当内容。",
                                "本站有权在不通知的情况下删除违规内容，并保留追究法律责任的权利。"
                            ].map((item, i) => (
                                <div key={i} className="flex gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm">
                                    <span className="text-amber-500 shrink-0">•</span>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<Server className="w-5 h-5" />} title="五、技术与服务" delay={0.3}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                                { icon: "⚡", title: "服务可用性", desc: "不保证服务不中断、无错误" },
                                { icon: "🔧", title: "维护中断", desc: "可能因维护、攻击等原因暂停" },
                                { icon: "🍪", title: "Cookie", desc: "使用 Cookie 改善用户体验" }
                            ].map((item, i) => (
                                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                                    <span className="text-2xl">{item.icon}</span>
                                    <h4 className="font-semibold text-slate-800 dark:text-white mt-2 text-sm">{item.title}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<Brain className="w-5 h-5" />} title="六、AI 功能与个性化推荐" delay={0.35} variant="info">
                        <p className="mb-4">本站使用人工智能技术提供以下服务：</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {[
                                { icon: "💬", name: "AI 聊天助手" },
                                { icon: "📝", name: "AI 内容生成" },
                                { icon: "🎯", name: "个性化推荐" },
                                { icon: "🔍", name: "智能搜索" }
                            ].map((item, i) => (
                                <div key={i} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                                    <span className="text-xl">{item.icon}</span>
                                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mt-1">{item.name}</p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                            <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">📊 关于个性化推荐</h3>
                            <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-200">
                                <li>• 个性化推荐基于您的浏览行为进行分析</li>
                                <li>• 推荐结果由算法自动生成，不涉及人工干预</li>
                                <li>• 您可以随时清除浏览历史以重置推荐偏好</li>
                                <li>• 我们不会将您的行为数据出售给第三方</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <h3 className="font-bold text-red-800 dark:text-red-300 mb-2">⚠️ AI 免责说明</h3>
                            <ul className="space-y-1 text-sm text-red-700 dark:text-red-200">
                                <li>• AI 生成的内容仅供参考，可能存在不准确信息</li>
                                <li>• 不应将 AI 内容作为专业建议（医疗、法律、财务等）的依据</li>
                                <li>• 本站不对 AI 功能的可用性、准确性或后果承担责任</li>
                            </ul>
                        </div>
                    </Section>

                    <Section icon={<Lock className="w-5 h-5" />} title="七、隐私保护" delay={0.4}>
                        <p>
                            本站重视用户隐私保护，具体隐私政策请参阅
                            <Link to="/legal/privacy" className="text-primary-start hover:underline mx-1 font-medium">
                                《隐私政策》
                            </Link>
                            页面。
                        </p>
                    </Section>

                    <Section icon={<Scale className="w-5 h-5" />} title="八、法律适用与争议解决" delay={0.45}>
                        <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <Scale className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                            <div>
                                <p className="mb-2">本声明的解释、执行及争议解决适用中华人民共和国法律。</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    如因本站引起纠纷，双方应友好协商解决；协商不成的，任一方可向本站运营者所在地有管辖权的人民法院提起诉讼。
                                </p>
                            </div>
                        </div>
                    </Section>

                    {/* 特别声明 */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
                    >
                        <h2 className="text-xl font-bold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            特别声明
                        </h2>
                        <p className="text-amber-700 dark:text-amber-200 mb-3">
                            在法律允许的最大范围内，本站及其运营者不对以下情况承担任何责任：
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {[
                                "因使用或无法使用本站服务而造成的任何直接或间接损失",
                                "因第三方行为导致的任何损害",
                                "用户因自身原因造成的账号被盗、数据泄露等损失",
                                "不可抗力因素造成的损失"
                            ].map((item, i) => (
                                <div key={i} className="flex gap-2 text-sm text-amber-700 dark:text-amber-200">
                                    <span className="shrink-0">•</span>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    <Section icon={<RefreshCw className="w-5 h-5" />} title="九、声明修改" delay={0.55}>
                        <p>
                            本站保留随时修改本免责声明的权利，修改后的声明将在网站公布后立即生效。
                            建议您定期查阅本页面以了解最新内容。
                        </p>
                    </Section>

                    {/* 联系方式 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="glass-card p-6 rounded-xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                                <Mail className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">联系我们</h2>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-4">如有疑问，请通过邮件联系：</p>
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
                    transition={{ delay: 0.65 }}
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

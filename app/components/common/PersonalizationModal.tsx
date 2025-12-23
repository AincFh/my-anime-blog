/**
 * 个性化功能使用提示模态框
 * 在首次使用 AI 推荐等功能时显示
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router';
import { Sparkles, Brain, Search, MessageSquare, X } from 'lucide-react';
import { usePersonalizationConsent } from '~/hooks/usePersonalizationConsent';

interface PersonalizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName?: string;
}

export function PersonalizationModal({ isOpen, onClose, featureName = 'AI 推荐' }: PersonalizationModalProps) {
    const { markConsentSeen } = usePersonalizationConsent();

    const handleConfirm = () => {
        markConsentSeen();
        onClose();
    };

    const features = [
        { icon: Brain, name: 'AI 智能推荐', desc: '根据阅读偏好推荐内容' },
        { icon: Search, name: 'AI 智能搜索', desc: '理解搜索意图返回结果' },
        { icon: MessageSquare, name: 'AI 聊天助手', desc: '回答问题提供帮助' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    {/* 遮罩 */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                    {/* 模态框 */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
                        style={{
                            background: 'var(--card-bg)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid var(--glass-border)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 关闭按钮 */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors z-10"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>

                        {/* 头部 */}
                        <div className="p-6 pb-0 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-start to-primary-end flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                启用个性化功能
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300">
                                您即将使用 <span className="text-primary-start font-medium">{featureName}</span> 功能
                            </p>
                        </div>

                        {/* 功能列表 */}
                        <div className="p-6 space-y-3">
                            {features.map((feature) => (
                                <div
                                    key={feature.name}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-start/20 to-primary-end/20 flex items-center justify-center">
                                        <feature.icon className="w-5 h-5 text-primary-start" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-800 dark:text-white text-sm">
                                            {feature.name}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            {feature.desc}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 说明文字 */}
                        <div className="px-6 pb-4">
                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                                我们会根据您的浏览行为提供个性化内容。
                                <Link
                                    to="/disclaimer"
                                    className="text-primary-start hover:underline mx-1"
                                >
                                    了解详情
                                </Link>
                                或查看
                                <Link
                                    to="/privacy"
                                    className="text-primary-start hover:underline mx-1"
                                >
                                    隐私政策
                                </Link>
                            </p>
                        </div>

                        {/* 按钮区域 */}
                        <div className="p-6 pt-2 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                暂不使用
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-start to-primary-end text-white font-medium hover:shadow-lg transition-shadow"
                            >
                                我知道了
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

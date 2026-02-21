import { motion } from "framer-motion";
import { Link } from "react-router";

/**
 * 后台 404 页面 - 管理员专用
 * 科技感风格，与后台管理界面一致
 */
export default function Admin404() {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
            {/* 网格背景 */}
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,159,67,0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,159,67,0.3) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}
            />

            {/* 主内容 */}
            <motion.div
                className="relative z-10 text-center px-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* 错误图标 */}
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-at-orange/20 to-at-purple/20 border border-at-orange/30">
                        <span className="text-5xl">🔍</span>
                    </div>
                </div>

                {/* 404 */}
                <h1
                    className="text-8xl md:text-9xl font-display font-black mb-4"
                    style={{
                        background: 'linear-gradient(135deg, #FF9F43, #8B5CF6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    404
                </h1>

                {/* 标题 */}
                <h2 className="text-2xl font-bold text-white mb-2">
                    管理页面未找到
                </h2>

                {/* 描述 */}
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    请求的管理页面不存在，请检查 URL 或返回控制台
                </p>

                {/* 操作按钮 */}
                <div className="flex gap-4 justify-center">
                    <Link
                        to="/admin"
                        className="px-6 py-3 bg-gradient-to-r from-at-orange to-at-purple text-white font-bold rounded-lg hover:shadow-lg transition-all"
                    >
                        返回控制台
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3 border border-slate-600 text-slate-300 hover:border-at-orange hover:text-at-orange rounded-lg transition-all"
                    >
                        返回上页
                    </button>
                </div>

                {/* 底部信息 */}
                <div className="mt-12 text-xs text-slate-600 font-mono">
                    <span>ERROR CODE: 404</span>
                    <span className="mx-3">|</span>
                    <span>ADMIN PANEL</span>
                </div>
            </motion.div>
        </div>
    );
}

import { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";

interface LoginFormProps {
    onSubmit: (data: FormData) => Promise<void>;
    isLoading: boolean;
    error?: string;
    defaultEmail?: string;
}

export function LoginForm({ onSubmit, isLoading, error, defaultEmail = "" }: LoginFormProps) {
    const [email, setEmail] = useState(defaultEmail);
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);
        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* 邮箱输入 */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">电子邮箱</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-primary-start transition-colors" />
                    </div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white/50 dark:bg-slate-800/50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-start/50 focus:border-primary-start sm:text-sm transition-all duration-200"
                        placeholder="your@email.com"
                        required
                    />
                </div>
            </div>

            {/* 密码输入 */}
            <div className="space-y-2 relative z-20">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">密码</label>
                <div className="relative group isolate">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary-start transition-colors" />
                    </div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white/50 dark:bg-slate-800/50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-start/50 focus:border-primary-start sm:text-sm transition-all duration-200 relative z-20"
                        placeholder="请输入密码"
                        required
                    />
                </div>
                {/* 忘记密码链接 - 移到密码框下方 */}
                <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-xs text-primary-start hover:underline font-medium">
                        忘记密码？
                    </Link>
                </div>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm"
                    >
                        <AlertCircle size={16} />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-start/30 text-sm font-bold text-white bg-gradient-to-r from-primary-start to-primary-end hover:shadow-primary-start/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-start disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200"
            >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : "登录"}
                {!isLoading && <ArrowRight size={18} />}
            </button>
        </form>
    );
}

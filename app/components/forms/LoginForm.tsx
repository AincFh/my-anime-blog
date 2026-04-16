import { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
    onSubmit: (data: FormData) => Promise<void>;
    isLoading: boolean;
    error?: string;
    defaultEmail?: string;
}

export function LoginForm({ onSubmit, isLoading, error, defaultEmail = "" }: LoginFormProps) {
    const [email, setEmail] = useState(defaultEmail);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);
        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* 邮箱输入 */}
            <div className="flex flex-col gap-2">
                <div className="relative">
                    <input
                        type="text"
                        inputMode="text"
                        autoComplete="username"
                        enterKeyHint="next"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-5 pr-12 py-[18px] bg-white/10 dark:bg-black/30 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-xl text-[15px] font-bold text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
                        placeholder="请输入电子邮箱或账户名"
                        required
                    />
                </div>
            </div>

            {/* 密码输入 */}
            <div className="flex flex-col gap-2">
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        enterKeyHint="done"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-5 pr-16 py-[18px] bg-white/10 dark:bg-black/30 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-xl text-[15px] font-bold text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
                        placeholder="请输入密码"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                {/* 忘记密码 */}
                <div className="flex justify-end pr-1 mt-1 z-10 cursor-pointer">
                    <Link to="/forgot-password" className="text-[13px] font-black text-white/50 hover:text-white transition-colors drop-shadow-sm">
                        忘记密码？
                    </Link>
                </div>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-5 py-4 rounded-xl flex items-center gap-3 text-[14px] font-bold mt-2"
                    >
                        <AlertCircle size={18} className="flex-shrink-0" />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="mt-6 w-full flex justify-center items-center gap-2 py-[18px] px-6 rounded-xl text-[16px] font-bold tracking-wide text-white bg-gradient-to-r from-primary-start to-primary-end hover:shadow-lg hover:shadow-primary-start/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-300"
            >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : "立刻登录"}
                {!isLoading && <ArrowRight size={20} />}
            </button>
        </form>
    );
}

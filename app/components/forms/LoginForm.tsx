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
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* 邮箱输入 */}
            <div className="flex flex-col gap-2">
                <div className="relative">
                    <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        enterKeyHint="next"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full px-5 py-[18px] bg-slate-100 dark:bg-[#2C2C2E] border border-transparent rounded-[18px] text-[15px] font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-300/30 dark:focus:ring-white/10 transition-all duration-300"
                        placeholder="Email Address"
                        required
                    />
                </div>
            </div>

            {/* 密码输入 */}
            <div className="flex flex-col gap-2">
                <div className="relative">
                    <input
                        type="password"
                        autoComplete="current-password"
                        enterKeyHint="done"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full px-5 py-[18px] bg-slate-100 dark:bg-[#2C2C2E] border border-transparent rounded-[18px] text-[15px] font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-300/30 dark:focus:ring-white/10 transition-all duration-300"
                        placeholder="Password"
                        required
                    />
                </div>
                {/* 忘记密码 */}
                <div className="flex justify-end pr-1 mt-1">
                    <Link to="/forgot-password" className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                        Forgot Password?
                    </Link>
                </div>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-5 py-4 rounded-[16px] flex items-center gap-3 text-[14px] font-bold mt-2"
                    >
                        <AlertCircle size={18} className="flex-shrink-0" />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="mt-6 w-full flex justify-center items-center gap-2 py-[18px] px-6 rounded-[18px] text-[16px] font-black tracking-wide text-white bg-slate-900 dark:text-black dark:bg-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-300"
            >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
                {!isLoading && <ArrowRight size={20} />}
            </button>
        </form>
    );
}

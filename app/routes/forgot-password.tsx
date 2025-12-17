import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

import { ResponsiveContainer } from "~/components/ui/ResponsiveComponents";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState<"email" | "verify" | "reset">("email");
    const [formData, setFormData] = useState({
        email: "",
        code: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendCode = async () => {
        if (!formData.email || !formData.email.includes("@")) {
            setError("请输入有效的邮箱地址");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const form = new FormData();
            form.append("email", formData.email);
            form.append("type", "reset"); // 告诉后端这是重置密码验证码

            const response = await fetch("/api/auth/send-code", {
                method: "POST",
                body: form
            });

            const result = await response.json();

            if (result.success) {
                setStep("verify");
                setCountdown(60);
            } else {
                setError(result.error || "发送验证码失败");
            }
        } catch (err) {
            setError("网络错误，请稍后重试");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!formData.code || formData.code.length !== 6) {
            setError("请输入6位验证码");
            return;
        }

        // 验证码会在最终提交时验证，这里直接进入下一步
        setError("");
        setStep("reset");
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword.length < 6) {
            setError("密码长度至少6位");
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError("两次输入的密码不一致");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const form = new FormData();
            form.append("email", formData.email);
            form.append("code", formData.code);
            form.append("password", formData.newPassword);

            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                body: form
            });

            const result = await response.json();

            if (result.success) {
                setShowSuccess(true);
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                setError(result.error || "重置密码失败");
            }
        } catch (err) {
            setError("网络错误，请稍后重试");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ResponsiveContainer maxWidth="sm" className="py-12 md:py-16">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 md:p-10 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-start/10 rounded-full blur-3xl -mr-10 -mt-10" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-end/10 rounded-full blur-3xl -ml-10 -mb-10" />

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">重置密码</h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            {step === "email" && "输入您注册时使用的邮箱"}
                            {step === "verify" && "输入邮箱收到的验证码"}
                            {step === "reset" && "设置您的新密码"}
                        </p>
                    </div>

                    {/* 进度指示器 */}
                    <div className="flex justify-center gap-2 mb-8">
                        {["email", "verify", "reset"].map((s, i) => (
                            <div
                                key={s}
                                className={`w-3 h-3 rounded-full transition-colors ${["email", "verify", "reset"].indexOf(step) >= i
                                    ? "bg-primary-start"
                                    : "bg-slate-200 dark:bg-slate-700"
                                    }`}
                            />
                        ))}
                    </div>

                    <AnimatePresence>
                        {showSuccess && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm justify-center font-bold"
                            >
                                <CheckCircle size={16} />
                                密码重置成功！正在跳转到登录页...
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleResetSubmit} className="space-y-5">
                        <AnimatePresence mode="wait">
                            {step === "email" && (
                                <motion.div
                                    key="email-step"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-5"
                                >
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">电子邮箱</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-primary-start transition-colors" />
                                            </div>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white/50 dark:bg-slate-800/50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-start/50 focus:border-primary-start sm:text-sm transition-all duration-200"
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSendCode}
                                        disabled={isLoading}
                                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-start/30 text-sm font-bold text-white bg-gradient-to-r from-primary-start to-primary-end hover:shadow-primary-start/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-start disabled:opacity-50 transform hover:-translate-y-0.5 transition-all duration-200"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : "发送验证码"}
                                        {!isLoading && <ArrowRight size={18} />}
                                    </button>
                                </motion.div>
                            )}

                            {step === "verify" && (
                                <motion.div
                                    key="verify-step"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-5"
                                >
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
                                        验证码已发送至 <strong>{formData.email}</strong>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">验证码</label>
                                        <div className="flex gap-3 items-center">
                                            <input
                                                type="text"
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                                className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white/50 dark:bg-slate-800/50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-start/50 focus:border-primary-start text-center font-mono text-lg tracking-widest transition-all duration-200"
                                                placeholder="000000"
                                                maxLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSendCode}
                                                disabled={countdown > 0 || isLoading}
                                                className="flex-shrink-0 px-4 py-3 text-sm font-medium text-primary-start hover:text-primary-end disabled:text-slate-400 transition-colors"
                                            >
                                                {countdown > 0 ? `${countdown}s` : "重新发送"}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setStep("email")}
                                            className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            上一步
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleVerifyCode}
                                            disabled={formData.code.length !== 6}
                                            className="flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-start/30 text-sm font-bold text-white bg-gradient-to-r from-primary-start to-primary-end hover:shadow-primary-start/50 disabled:opacity-50 transition-all duration-200"
                                        >
                                            下一步
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === "reset" && (
                                <motion.div
                                    key="reset-step"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-5"
                                >
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">新密码</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary-start transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                value={formData.newPassword}
                                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                                className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white/50 dark:bg-slate-800/50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-start/50 focus:border-primary-start sm:text-sm transition-all duration-200"
                                                placeholder="至少6位，包含小写字母和数字"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500">密码需包含小写字母和数字</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">确认新密码</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary-start transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white/50 dark:bg-slate-800/50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-start/50 focus:border-primary-start sm:text-sm transition-all duration-200"
                                                placeholder="再次输入新密码"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-start/30 text-sm font-bold text-white bg-gradient-to-r from-primary-start to-primary-end hover:shadow-primary-start/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-start disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : "重置密码"}
                                        {!isLoading && <ArrowRight size={18} />}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

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
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            想起来了？
                            <Link to="/login" className="text-primary-start font-bold hover:underline ml-1">
                                返回登录
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </ResponsiveContainer>
    );
}

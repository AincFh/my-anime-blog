import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Turnstile } from "./Turnstile";

interface ForgotPasswordFormProps {
    onReset: (data: FormData) => Promise<void>;
    onSendCode: (email: string) => Promise<boolean>;
    isLoading: boolean;
    error?: string;
}

export function ForgotPasswordForm({ onReset, onSendCode, isLoading, error }: ForgotPasswordFormProps) {
    const [step, setStep] = useState<"email" | "verify" | "reset">("email");
    const [formData, setFormData] = useState({
        email: "",
        code: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [countdown, setCountdown] = useState(0);
    const [turnstileToken, setTurnstileToken] = useState("");
    const [localError, setLocalError] = useState("");

    const SITE_KEY = "1x00000000000000000000AA";

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendCode = async () => {
        if (!formData.email || !formData.email.includes("@")) {
            setLocalError("请输入有效的邮箱地址");
            return;
        }

        setLocalError("");
        const success = await onSendCode(formData.email);
        if (success) {
            setStep("verify");
            setCountdown(60);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError("");

        if (formData.newPassword.length < 6) {
            setLocalError("密码长度至少6位");
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setLocalError("两次输入的密码不一致");
            return;
        }

        const form = new FormData();
        form.append("email", formData.email);
        form.append("code", formData.code);
        form.append("password", formData.newPassword);
        form.append("cf-turnstile-response", turnstileToken);

        await onReset(form);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                        className="block w-full pl-10 pr-24 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white/50 dark:bg-slate-800/50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-start/50 focus:border-primary-start sm:text-sm transition-all duration-200"
                        placeholder="your@email.com"
                        disabled={step !== "email" && step !== "verify"}
                    />
                    {step === "email" && (
                        <button
                            type="button"
                            onClick={handleSendCode}
                            disabled={isLoading || !formData.email}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 dark:bg-white text-white dark:text-slate-800 text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={14} /> : "获取验证码"}
                        </button>
                    )}
                    {step !== "email" && countdown > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                            {countdown}s
                        </span>
                    )}
                    {step !== "email" && countdown === 0 && (
                        <button
                            type="button"
                            onClick={handleSendCode}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary-start font-bold hover:underline"
                        >
                            重新发送
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step !== "email" && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">验证码</label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white/50 dark:bg-slate-800/50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-start/50 focus:border-primary-start font-mono tracking-widest text-center text-lg transition-all duration-200"
                                placeholder="000000"
                                maxLength={6}
                            />
                        </div>

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
                                    placeholder="至少6位字符"
                                />
                            </div>
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

                        {/* Turnstile 验证 */}
                        <div className="flex justify-center">
                            <Turnstile
                                siteKey={SITE_KEY}
                                onVerify={setTurnstileToken}
                            />
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
                {(error || localError) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm mt-4"
                    >
                        <AlertCircle size={16} />
                        {error || localError}
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    );
}

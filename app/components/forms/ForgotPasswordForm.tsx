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
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <div className="relative">
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="block w-full pl-5 pr-[110px] py-[18px] bg-slate-100 dark:bg-[#2C2C2E] border border-transparent rounded-[18px] text-[15px] font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-300/30 dark:focus:ring-white/10 transition-all duration-300 disabled:opacity-50"
                        placeholder="电子邮箱"
                        disabled={step !== "email" && step !== "verify"}
                    />
                    {step === "email" && (
                        <button
                            type="button"
                            onClick={handleSendCode}
                            disabled={isLoading || !formData.email}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-bold rounded-[14px] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={16} /> : "获取验证码"}
                        </button>
                    )}
                    {step !== "email" && countdown > 0 && (
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[14px] text-slate-500 font-mono font-bold">
                            {countdown}s
                        </span>
                    )}
                    {step !== "email" && countdown === 0 && (
                        <button
                            type="button"
                            onClick={handleSendCode}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-slate-900 dark:text-white font-bold hover:underline"
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
                        className="flex flex-col gap-5 mt-2"
                    >
                        <div className="flex flex-col gap-2">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="block w-full px-5 py-[18px] bg-slate-100 dark:bg-[#2C2C2E] border border-transparent rounded-[18px] text-[18px] text-center font-mono font-bold tracking-[0.2em] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-300/30 dark:focus:ring-white/10 transition-all duration-300 disabled:opacity-50"
                                placeholder="000000"
                                maxLength={6}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="relative">
                                <input
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    className="block w-full px-5 py-[18px] bg-slate-100 dark:bg-[#2C2C2E] border border-transparent rounded-[18px] text-[15px] font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-300/30 dark:focus:ring-white/10 transition-all duration-300 disabled:opacity-50"
                                    placeholder="新密码 (最少 6 位)"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="relative">
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="block w-full px-5 py-[18px] bg-slate-100 dark:bg-[#2C2C2E] border border-transparent rounded-[18px] text-[15px] font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-300/30 dark:focus:ring-white/10 transition-all duration-300 disabled:opacity-50"
                                    placeholder="确认新密码"
                                />
                            </div>
                        </div>

                        {/* Turnstile 验证 */}
                        <div className="flex justify-center mt-2">
                            <Turnstile
                                siteKey={SITE_KEY}
                                onVerify={setTurnstileToken}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center gap-2 py-[18px] px-6 rounded-[18px] text-[16px] font-black tracking-wide text-white bg-slate-900 dark:text-black dark:bg-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "重置密码"}
                            {!isLoading && <ArrowRight size={20} />}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(error || localError) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-5 py-4 rounded-[16px] flex items-center gap-3 text-[14px] font-bold mt-2"
                    >
                        <AlertCircle size={18} className="flex-shrink-0" />
                        {error || localError}
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    );
}

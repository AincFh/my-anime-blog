import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

interface RegisterFormProps {
    onRegister: (data: FormData) => Promise<void>;
    onSendCode: (email: string) => Promise<boolean>;
    isLoading: boolean;
    error?: string;
}

// 生成简单的数学验证码
function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '×'];
    const operatorIndex = Math.floor(Math.random() * 3);
    const operator = operators[operatorIndex];

    let answer: number;
    switch (operator) {
        case '+':
            answer = num1 + num2;
            break;
        case '-':
            answer = num1 - num2;
            break;
        case '×':
            answer = num1 * num2;
            break;
        default:
            answer = num1 + num2;
    }

    return {
        question: `${num1} ${operator} ${num2} = ?`,
        answer: answer.toString()
    };
}

export function RegisterForm({ onRegister, onSendCode, isLoading, error }: RegisterFormProps) {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        captchaInput: "",
        agreed: false
    });
    const [localError, setLocalError] = useState("");
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleGetCaptcha = async () => {
        // 验证邮箱、密码是否填写
        if (!formData.email || !formData.email.includes("@")) {
            setLocalError("请输入有效的邮箱地址");
            return;
        }
        if (formData.password.length < 8) {
            setLocalError("密码长度至少8位，包含大小写及数字");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setLocalError("两次输入的密码不一致");
            return;
        }
        if (!formData.agreed) {
            setLocalError("请阅读并同意服务条款和隐私政策");
            return;
        }

        setLocalError("");
        setIsSendingCode(true);

        const sent = await onSendCode(formData.email);
        setIsSendingCode(false);

        if (sent) {
            setShowCaptcha(true);
            setCountdown(60);
        } else {
            setLocalError("发送验证码失败，请重试");
        }
    };

    const handleResendCode = async () => {
        if (countdown > 0) return;
        setIsSendingCode(true);
        const sent = await onSendCode(formData.email);
        setIsSendingCode(false);
        if (sent) {
            setCountdown(60);
        } else {
            setLocalError("验证码无法送达，请检查邮箱是否正确");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError("");

        if (!formData.captchaInput || formData.captchaInput.length !== 6) {
            setLocalError("请输入 6 位邮箱验证码");
            return;
        }

        const form = new FormData();
        form.append("email", formData.email);
        form.append("password", formData.password);
        form.append("code", formData.captchaInput);

        await onRegister(form);
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
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="block w-full px-5 py-[18px] bg-slate-100 dark:bg-[#2C2C2E] border border-transparent rounded-[18px] text-[15px] font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-300/30 dark:focus:ring-white/10 transition-all duration-300 disabled:opacity-50"
                        placeholder="Email Address"
                        disabled={showCaptcha}
                        required
                    />
                </div>
            </div>

            {/* 密码输入 */}
            <div className="flex flex-col gap-2">
                <div className="relative">
                    <input
                        type="password"
                        autoComplete="new-password"
                        enterKeyHint="next"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="block w-full px-5 py-[18px] bg-slate-100 dark:bg-[#2C2C2E] border border-transparent rounded-[18px] text-[15px] font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-300/30 dark:focus:ring-white/10 transition-all duration-300 disabled:opacity-50"
                        placeholder="Password (min 8 chars)"
                        disabled={showCaptcha}
                        required
                    />
                </div>
            </div>

            {/* 确认密码 */}
            <div className="flex flex-col gap-2">
                <div className="relative">
                    <input
                        type="password"
                        autoComplete="new-password"
                        enterKeyHint="next"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="block w-full px-5 py-[18px] bg-slate-100 dark:bg-[#2C2C2E] border border-transparent rounded-[18px] text-[15px] font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-300/30 dark:focus:ring-white/10 transition-all duration-300 disabled:opacity-50"
                        placeholder="Confirm Password"
                        disabled={showCaptcha}
                        required
                    />
                </div>
            </div>

            {/* 条款同意 */}
            <div className="flex items-start gap-4 mt-2 px-2">
                <div className="relative flex items-center mt-0.5">
                    <input
                        type="checkbox"
                        id="terms"
                        checked={formData.agreed}
                        onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
                        className="peer h-[22px] w-[22px] cursor-pointer appearance-none rounded-full border-[1.5px] border-slate-300 dark:border-slate-600 transition-all checked:border-slate-900 checked:bg-slate-900 dark:checked:border-white dark:checked:bg-white hover:border-slate-400"
                        disabled={showCaptcha}
                    />
                    <CheckCircle className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white dark:text-black opacity-0 peer-checked:opacity-100" size={14} strokeWidth={3} />
                </div>
                <label htmlFor="terms" className="text-[13px] font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none leading-relaxed text-pretty">
                    I agree to the
                    <Link to="/terms" className="text-slate-900 dark:text-white hover:underline mx-1">Terms of Service</Link>
                    and
                    <Link to="/privacy" className="text-slate-900 dark:text-white hover:underline mx-1">Privacy Policy</Link>
                </label>
            </div>

            <AnimatePresence mode="wait">
                {!showCaptcha ? (
                    <motion.button
                        key="get-captcha"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        type="button"
                        onClick={handleGetCaptcha}
                        className="mt-6 w-full flex justify-center items-center gap-2 py-[18px] px-6 rounded-[18px] text-[16px] font-black tracking-wide text-white bg-slate-900 dark:text-black dark:bg-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-300"
                        disabled={isSendingCode}
                    >
                        {isSendingCode ? <Loader2 className="animate-spin" size={20} /> : "Continue Setup"}
                        {!isSendingCode && <ArrowRight size={20} />}
                    </motion.button>
                ) : (
                    <motion.div
                        key="captcha-section"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-5 mt-6"
                    >
                        {/* 验证码输入区块改写 */}
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 px-4 flex items-center justify-center bg-slate-100 dark:bg-[#2C2C2E] rounded-[18px] font-mono text-[14px] font-bold text-slate-600 dark:text-slate-300 select-none">
                                    AUTH
                                </div>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    enterKeyHint="done"
                                    value={formData.captchaInput}
                                    onChange={(e) => setFormData({ ...formData, captchaInput: e.target.value })}
                                    className="flex-1 px-5 py-[18px] w-full bg-slate-100 dark:bg-[#2C2C2E] border border-transparent rounded-[18px] text-[18px] text-center font-mono font-bold tracking-[0.2em] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-300/30 dark:focus:ring-white/10 transition-all duration-300"
                                    placeholder="000000"
                                    maxLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={countdown > 0 || isSendingCode}
                                    className="px-4 flex items-center justify-center bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-[#3C3C3E] rounded-[18px] transition-colors disabled:opacity-50 text-slate-600 dark:text-slate-300"
                                    title="Resend Code"
                                >
                                    {countdown > 0 ? <span className="text-[14px] font-bold font-mono">{countdown}s</span> : <RefreshCw size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || formData.captchaInput.length !== 6}
                            className="w-full flex justify-center items-center gap-2 py-[18px] px-6 rounded-[18px] text-[16px] font-black tracking-wide text-white bg-slate-900 dark:text-black dark:bg-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Complete Registration"}
                            {!isLoading && <ArrowRight size={20} />}
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowCaptcha(false)}
                            className="w-full py-4 text-[14px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                        >
                            Change Information
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

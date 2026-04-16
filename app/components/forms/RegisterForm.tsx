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
                        className="block w-full px-5 py-[18px] bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 focus:border-white/30 rounded-xl text-[15px] font-medium text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300 disabled:opacity-50"
                        placeholder="请输入电子邮箱地址"
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
                        className="block w-full px-5 py-[18px] bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 focus:border-white/30 rounded-xl text-[15px] font-medium text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300 disabled:opacity-50"
                        placeholder="请输入密码（至少 8 位）"
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
                        className="block w-full px-5 py-[18px] bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 focus:border-white/30 rounded-xl text-[15px] font-medium text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300 disabled:opacity-50"
                        placeholder="请确认密码"
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
                        className="peer h-[22px] w-[22px] cursor-pointer appearance-none rounded-full border-[1.5px] border-white/20 transition-all checked:border-amber-400 checked:bg-amber-400 hover:border-white/40"
                        disabled={showCaptcha}
                    />
                    <CheckCircle className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" size={14} strokeWidth={3} />
                </div>
                <label htmlFor="terms" className="text-[13px] font-medium text-white/70 cursor-pointer select-none leading-relaxed">
                    我已阅读并同意以下协议：
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 text-[12px]">
                        <Link to="/terms" className="text-amber-400/80 hover:text-amber-400 hover:underline">服务条款</Link>
                        <Link to="/privacy" className="text-amber-400/80 hover:text-amber-400 hover:underline">隐私政策</Link>
                        <Link to="/legal/cookie" className="text-amber-400/80 hover:text-amber-400 hover:underline">Cookie政策</Link>
                        <Link to="/legal/sponsor" className="text-amber-400/80 hover:text-amber-400 hover:underline">赞助条款</Link>
                        <Link to="/legal/ai" className="text-amber-400/80 hover:text-amber-400 hover:underline">AI服务条款</Link>
                        <Link to="/legal/minors" className="text-amber-400/80 hover:text-amber-400 hover:underline">未成年人保护</Link>
                    </div>
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
                        className="mt-6 w-full flex justify-center items-center gap-2 py-[18px] px-6 rounded-xl text-[16px] font-bold tracking-wide text-white bg-gradient-to-r from-primary-start to-primary-end hover:shadow-lg hover:shadow-primary-start/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-300"
                        disabled={isSendingCode}
                    >
                        {isSendingCode ? <Loader2 className="animate-spin" size={20} /> : "下一步，发送验证码"}
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
                                <div className="flex-shrink-0 px-4 flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl font-mono text-[14px] font-bold text-white/80 select-none">
                                    授权码
                                </div>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    enterKeyHint="done"
                                    value={formData.captchaInput}
                                    onChange={(e) => setFormData({ ...formData, captchaInput: e.target.value })}
                                    className="flex-1 px-5 py-[18px] w-full bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 focus:border-white/30 rounded-xl text-[18px] text-center font-mono font-bold tracking-[0.2em] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300"
                                    placeholder="000000"
                                    maxLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={countdown > 0 || isSendingCode}
                                    className="px-4 flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/10 hover:bg-white/20 hover:border-white/20 rounded-xl transition-all disabled:opacity-50 text-white/80"
                                    title="重新发送"
                                >
                                    {countdown > 0 ? <span className="text-[14px] font-bold font-mono">{countdown}s</span> : <RefreshCw size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || formData.captchaInput.length !== 6}
                            className="w-full flex justify-center items-center gap-2 py-[18px] px-6 rounded-xl text-[16px] font-bold tracking-wide text-white bg-gradient-to-r from-primary-start to-primary-end hover:shadow-lg hover:shadow-primary-start/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "完成注册"}
                            {!isLoading && <ArrowRight size={20} />}
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowCaptcha(false)}
                            className="w-full py-4 text-[14px] font-semibold text-white/60 hover:text-white/90 transition-colors"
                        >
                            上一步，重新填写信息
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
                        className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-5 py-4 rounded-xl flex items-center gap-3 text-[14px] font-bold mt-2"
                    >
                        <AlertCircle size={18} className="flex-shrink-0" />
                        {error || localError}
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    );
}

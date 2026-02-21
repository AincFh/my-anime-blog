import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

interface RegisterFormProps {
    onRegister: (data: FormData) => Promise<void>;
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

export function RegisterForm({ onRegister, isLoading, error }: RegisterFormProps) {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        captchaInput: "",
        agreed: false
    });
    const [captcha, setCaptcha] = useState(generateCaptcha);
    const [localError, setLocalError] = useState("");
    const [showCaptcha, setShowCaptcha] = useState(false);

    const refreshCaptcha = useCallback(() => {
        setCaptcha(generateCaptcha());
        setFormData(prev => ({ ...prev, captchaInput: "" }));
    }, []);

    const handleGetCaptcha = () => {
        // 验证邮箱、密码是否填写
        if (!formData.email || !formData.email.includes("@")) {
            setLocalError("请输入有效的邮箱地址");
            return;
        }
        if (formData.password.length < 6) {
            setLocalError("密码长度至少6位");
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
        setShowCaptcha(true);
        refreshCaptcha();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError("");

        // 验证验证码
        if (formData.captchaInput !== captcha.answer) {
            setLocalError("验证码错误，请重试");
            refreshCaptcha();
            return;
        }

        const form = new FormData();
        form.append("email", formData.email);
        form.append("password", formData.password);

        await onRegister(form);
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
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white/50 dark:bg-slate-800/50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-start/50 focus:border-primary-start sm:text-sm transition-all duration-200"
                        placeholder="your@email.com"
                        disabled={showCaptcha}
                    />
                </div>
            </div>

            {/* 密码输入 */}
            <div className="space-y-2 relative z-20">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">设置密码</label>
                <div className="relative group isolate">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary-start transition-colors" />
                    </div>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white/50 dark:bg-slate-800/50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-start/50 focus:border-primary-start sm:text-sm transition-all duration-200 relative z-20"
                        placeholder="至少6位字符"
                        disabled={showCaptcha}
                    />
                </div>
            </div>

            {/* 确认密码 */}
            <div className="space-y-2 relative z-20">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">确认密码</label>
                <div className="relative group isolate">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary-start transition-colors" />
                    </div>
                    <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white/50 dark:bg-slate-800/50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-start/50 focus:border-primary-start sm:text-sm transition-all duration-200 relative z-20"
                        placeholder="再次输入密码"
                        disabled={showCaptcha}
                    />
                </div>
            </div>

            {/* 条款同意 */}
            <div className="flex items-start gap-3">
                <div className="relative flex items-center">
                    <input
                        type="checkbox"
                        id="terms"
                        checked={formData.agreed}
                        onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-primary-start checked:bg-primary-start hover:border-primary-start"
                        disabled={showCaptcha}
                    />
                    <CheckCircle className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" size={12} />
                </div>
                <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    我已阅读并同意
                    <Link to="/terms" className="text-primary-start hover:underline mx-1">服务条款</Link>
                    、
                    <Link to="/privacy" className="text-primary-start hover:underline mx-1">隐私政策</Link>
                    及开启个性化服务
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
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-start/30 text-sm font-bold text-white bg-gradient-to-r from-primary-start to-primary-end hover:shadow-primary-start/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-start transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                        获取验证码
                        <ArrowRight size={18} />
                    </motion.button>
                ) : (
                    <motion.div
                        key="captcha-section"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                    >
                        {/* 图形验证码 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">验证码</label>
                            <div className="flex gap-3 items-center">
                                {/* 验证码显示区域 */}
                                <div className="flex-shrink-0 px-4 py-3 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 font-mono text-lg font-bold text-slate-700 dark:text-slate-200 select-none tracking-wider">
                                    {captcha.question}
                                </div>
                                <button
                                    type="button"
                                    onClick={refreshCaptcha}
                                    className="p-2 text-slate-500 hover:text-primary-start transition-colors"
                                    title="刷新验证码"
                                >
                                    <RefreshCw size={20} />
                                </button>
                                <input
                                    type="text"
                                    value={formData.captchaInput}
                                    onChange={(e) => setFormData({ ...formData, captchaInput: e.target.value })}
                                    className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white/50 dark:bg-slate-800/50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-start/50 focus:border-primary-start text-center font-mono text-lg transition-all duration-200"
                                    placeholder="答案"
                                    maxLength={4}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !formData.captchaInput}
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-start/30 text-sm font-bold text-white bg-gradient-to-r from-primary-start to-primary-end hover:shadow-primary-start/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-start disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : "完成注册"}
                            {!isLoading && <ArrowRight size={18} />}
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowCaptcha(false)}
                            className="w-full text-sm text-slate-500 hover:text-primary-start transition-colors"
                        >
                            ← 返回修改信息
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
                        className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm"
                    >
                        <AlertCircle size={16} />
                        {error || localError}
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    );
}

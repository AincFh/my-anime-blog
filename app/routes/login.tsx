import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { PublicLayout } from "~/components/layout/PublicLayout";
import { ResponsiveContainer } from "~/components/ui/ResponsiveComponents";
import { CheckCircle } from "lucide-react";
import { LoginForm } from "~/components/forms/LoginForm";

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showLoginSuccess, setShowLoginSuccess] = useState(false);
    const [defaultEmail, setDefaultEmail] = useState("");

    useEffect(() => {
        const email = searchParams.get("email");
        const registered = searchParams.get("registered");

        if (email) {
            setDefaultEmail(email);
        }

        if (registered === "true") {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 5000);
        }
    }, [searchParams]);

    const handleLogin = async (formData: FormData) => {
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                setShowLoginSuccess(true);
                setTimeout(() => {
                    window.location.href = "/";
                }, 1000);
            } else {
                setError(result.error || "登录失败，请检查邮箱和密码");
            }
        } catch (err) {
            setError("网络错误，请稍后重试");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PublicLayout>
            <ResponsiveContainer maxWidth="sm" className="py-28 md:py-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 md:p-10 relative overflow-hidden"
                >
                    {/* 装饰背景 */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-start/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-end/10 rounded-full blur-3xl -ml-10 -mb-10" />

                    <div className="relative z-10">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">欢迎回来</h1>
                            <p className="text-slate-500 dark:text-slate-400">登录以继续您的旅程</p>
                        </div>

                        <AnimatePresence>
                            {showLoginSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm justify-center font-bold"
                                >
                                    <CheckCircle size={16} />
                                    登录成功！正在跳转...
                                </motion.div>
                            )}

                            {showSuccess && !showLoginSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm"
                                >
                                    <CheckCircle size={16} />
                                    注册成功！请使用密码登录
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <LoginForm
                            onSubmit={handleLogin}
                            isLoading={isLoading}
                            error={error}
                            defaultEmail={defaultEmail}
                        />

                        <div className="mt-8 text-center space-y-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                还没有账号？
                                <Link to="/register" className="text-primary-start font-bold hover:underline ml-1">
                                    立即注册
                                </Link>
                            </p>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">或者</span>
                                </div>
                            </div>

                            <div className="flex justify-center gap-4">
                                {/* 第三方登录 - 预留，后期接入API */}
                                <button
                                    type="button"
                                    className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors opacity-50 cursor-not-allowed"
                                    title="即将上线"
                                    disabled
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors opacity-50 cursor-not-allowed"
                                    title="即将上线"
                                    disabled
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-xs text-slate-400">第三方登录即将上线</p>
                        </div>
                    </div>
                </motion.div>
            </ResponsiveContainer>
        </PublicLayout>
    );
}

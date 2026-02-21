import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
// PublicLayout is already provided by root.tsx, no need to import
import { ResponsiveContainer } from "~/components/ui/ResponsiveComponents";
import { CheckCircle } from "lucide-react";
import { LoginForm } from "~/components/forms/LoginForm";
import { GlassCard } from "~/components/layout/GlassCard";

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

            const result = await response.json() as { success: boolean; error?: string };

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
        <>
            <ResponsiveContainer maxWidth="sm" className="pt-16 pb-20">
                <GlassCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 md:p-10 relative overflow-hidden"
                >
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

                        </div>
                    </div>
                </GlassCard>
            </ResponsiveContainer>
        </>
    );
}

import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer } from "~/components/ui/ResponsiveComponents";
import { CheckCircle } from "lucide-react";
import { LoginForm } from "~/components/forms/LoginForm";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";

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
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-black transition-colors duration-500 border-none">
            {/* 顶层唯美二次元壁纸 */}
            <div className="absolute inset-0 z-0">
                <OptimizedImage
                    src="https://api.paugram.com/wallpaper/?seed=login_screen"
                    alt="Login Background"
                    className="w-full h-full object-cover scale-105"
                />
                {/* 深邃毛玻璃遮罩 */}
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[4px] transition-all duration-700 pointer-events-none" />
            </div>

            {/* 顶部导航栏 - 可返回 */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 md:p-6">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm font-medium">返回首页</span>
                </Link>
            </div>

            <ResponsiveContainer maxWidth="sm" className="relative z-10 w-full max-w-[440px] mx-auto px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white/10 dark:bg-black/40 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl shadow-black/40"
                >
                    <div className="text-center mb-10">
                        <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight drop-shadow-md">
                            欢迎回来
                        </h1>
                        <p className="text-[15px] font-bold text-white/70 drop-shadow-sm">
                            登录以继续探索您的二次元世界
                        </p>
                    </div>

                    <AnimatePresence>
                        {showLoginSuccess && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-white p-4 rounded-xl mb-8 flex items-center justify-center gap-2 text-[14px] font-bold shadow-lg"
                            >
                                <CheckCircle size={18} className="text-emerald-400" />
                                登录成功！正在为您跳转...
                            </motion.div>
                        )}

                        {showSuccess && !showLoginSuccess && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-white p-4 rounded-xl mb-8 flex items-center gap-2 text-[14px] font-bold shadow-lg"
                            >
                                <CheckCircle size={18} className="text-emerald-400" />
                                注册成功！请使用账号密码登录
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-2">
                        <LoginForm
                            onSubmit={handleLogin}
                            isLoading={isLoading}
                            error={error}
                            defaultEmail={defaultEmail}
                        />
                    </div>

                    <div className="mt-10 text-center relative z-20">
                        <p className="text-[14px] font-bold text-white/70">
                            还没有账号？
                            <Link to="/register" className="ml-2 text-white font-black hover:text-primary-300 hover:underline drop-shadow-md transition-colors relative z-30 pointer-events-auto">
                                立即注册
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </ResponsiveContainer>
        </div>
    );
}

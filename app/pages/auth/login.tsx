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
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-[#000000]">
            {/* 顶层极其微弱的光晕 */}
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-slate-50 to-transparent dark:from-[#0A0A0A] dark:to-transparent pointer-events-none" />

            <ResponsiveContainer maxWidth="sm" className="relative z-10 w-full max-w-[420px] mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="text-center mb-10">
                        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                            Welcome
                        </h1>
                        <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400">
                            Sign in to continue your journey
                        </p>
                    </div>

                    <AnimatePresence>
                        {showLoginSuccess && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-4 rounded-[16px] mb-8 flex items-center justify-center gap-2 text-[14px] font-bold"
                            >
                                <CheckCircle size={18} />
                                Login successful! Redirecting...
                            </motion.div>
                        )}

                        {showSuccess && !showLoginSuccess && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-4 rounded-[16px] mb-8 flex items-center gap-2 text-[14px] font-bold"
                            >
                                <CheckCircle size={18} />
                                Registered successfully. Please sign in.
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="bg-white/50 dark:bg-[#1C1C1E]/30 p-1 rounded-[32px]">
                        <LoginForm
                            onSubmit={handleLogin}
                            isLoading={isLoading}
                            error={error}
                            defaultEmail={defaultEmail}
                        />
                    </div>

                    <div className="mt-10 text-center">
                        <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400">
                            Don't have an account?
                            <Link to="/register" className="ml-2 text-slate-900 dark:text-white font-bold hover:underline">
                                Sign up now
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </ResponsiveContainer>
        </div>
    );
}

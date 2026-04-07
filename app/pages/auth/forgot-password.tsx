import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ResponsiveContainer } from "~/components/ui/ResponsiveComponents";
import { ForgotPasswordForm } from "~/components/forms/ForgotPasswordForm";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSendCode = async (email: string) => {
        setIsLoading(true);
        setError("");
        try {
            const form = new FormData();
            form.append("email", email);
            const response = await fetch("/api/auth/send-code", {
                method: "POST",
                body: form
            });
            const result = await response.json() as any;
            if (result.success) {
                return true;
            } else {
                setError(result.error || "发送验证码失败");
                return false;
            }
        } catch (err) {
            setError("网络错误，请稍后重试");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async (formData: FormData) => {
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                body: formData
            });
            const result = await response.json() as any;
            if (result.success) {
                navigate("/login");
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
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-black transition-colors duration-500">
            {/* 二次元壁纸背景 */}
            <div className="absolute inset-0 z-0">
                <OptimizedImage
                    src="https://api.paugram.com/wallpaper/?seed=forgot_password"
                    alt="Background"
                    className="w-full h-full object-cover scale-105"
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[6px] transition-all duration-700" />
            </div>

            {/* 顶部导航栏 */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 md:p-6">
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm font-medium">返回登录</span>
                </Link>
            </div>

            <ResponsiveContainer maxWidth="sm" className="relative z-10 w-full max-w-[440px] mx-auto px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white/10 dark:bg-black/40 backdrop-blur-2xl border border-white/20 rounded-[40px] p-8 md:p-12 shadow-2xl shadow-black/40"
                >
                    <div className="text-center mb-10">
                        <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight drop-shadow-md">
                            重置密码
                        </h1>
                        <p className="text-[15px] font-medium text-white/60">
                            验证您的邮箱以设置新密码
                        </p>
                    </div>

                    <ForgotPasswordForm
                        onReset={handleReset}
                        onSendCode={handleSendCode}
                        isLoading={isLoading}
                        error={error}
                    />

                    <div className="mt-10 text-center">
                        <p className="text-[14px] font-medium text-white/50">
                            突然想起来了？
                            <Link to="/login" className="ml-2 text-white/80 font-bold hover:text-white transition-colors">
                                返回登录
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </ResponsiveContainer>
        </div>
    );
}

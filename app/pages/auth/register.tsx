import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ResponsiveContainer } from "~/components/ui/ResponsiveComponents";
import { RegisterForm } from "~/components/forms/RegisterForm";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";

export default function Register() {
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

    const handleRegister = async (formData: FormData) => {
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                body: formData
            });
            const result = await response.json() as any;
            if (result.success) {
                // 注册成功，跳转到登录页并自动填充邮箱
                const email = formData.get("email") as string;
                navigate(`/login?email=${encodeURIComponent(email)}&registered=true`);
            } else {
                setError(result.error || "注册失败");
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
                    src="https://api.paugram.com/wallpaper/?seed=register_screen"
                    alt="Register Background"
                    className="w-full h-full object-cover scale-105"
                />
                {/* 深邃毛玻璃遮罩 */}
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[4px] transition-all duration-700 pointer-events-none" />
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
                            注册账号
                        </h1>
                        <p className="text-[15px] font-bold text-white/70 drop-shadow-sm">
                            开启您的次元之旅
                        </p>
                    </div>

                    <div className="mt-2">
                        <RegisterForm
                            onRegister={handleRegister}
                            onSendCode={handleSendCode}
                            isLoading={isLoading}
                            error={error}
                        />
                    </div>

                    <div className="mt-10 text-center relative z-20">
                        <p className="text-[14px] font-bold text-white/70">
                            已经有账号了？
                            <Link to="/login" className="ml-2 text-white font-black hover:text-primary-300 hover:underline drop-shadow-md transition-colors relative z-30 pointer-events-auto">
                                返回登录
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </ResponsiveContainer>
        </div>
    );
}

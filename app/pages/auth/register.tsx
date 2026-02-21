import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ResponsiveContainer } from "~/components/ui/ResponsiveComponents";
import { RegisterForm } from "~/components/forms/RegisterForm";
import { GlassCard } from "~/components/layout/GlassCard";

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
        <>
            <ResponsiveContainer maxWidth="sm" className="pt-16 pb-20">
                <GlassCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 md:p-10 relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">创建账号</h1>
                            <p className="text-slate-500 dark:text-slate-400">加入我们的二次元社区</p>
                        </div>

                        <RegisterForm
                            onRegister={handleRegister}
                            isLoading={isLoading}
                            error={error}
                        />

                        <div className="mt-8 text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                已有账号？
                                <Link to="/login" className="text-primary-start font-bold hover:underline ml-1">
                                    立即登录
                                </Link>
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </ResponsiveContainer>
        </>
    );
}

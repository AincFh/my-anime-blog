import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { PublicLayout } from "~/components/layouts/PublicLayout";
import { ResponsiveContainer } from "~/components/ui/ResponsiveComponents";
import { ForgotPasswordForm } from "~/components/forms/ForgotPasswordForm";

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
            const result = await response.json();
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
            const result = await response.json();
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
        <PublicLayout>
            <ResponsiveContainer maxWidth="sm" className="py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 md:p-10 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-start/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-end/10 rounded-full blur-3xl -ml-10 -mb-10" />

                    <div className="relative z-10">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">重置密码</h1>
                            <p className="text-slate-500 dark:text-slate-400">验证您的邮箱以设置新密码</p>
                        </div>

                        <ForgotPasswordForm
                            onReset={handleReset}
                            onSendCode={handleSendCode}
                            isLoading={isLoading}
                            error={error}
                        />

                        <div className="mt-8 text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                想起来了？
                                <Link to="/login" className="text-primary-start font-bold hover:underline ml-1">
                                    返回登录
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </ResponsiveContainer>
        </PublicLayout>
    );
}

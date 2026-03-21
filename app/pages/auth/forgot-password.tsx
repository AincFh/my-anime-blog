import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
// PublicLayout is already provided by root.tsx
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
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-[#000000]">
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-slate-50 to-transparent dark:from-[#0A0A0A] dark:to-transparent pointer-events-none" />

            <ResponsiveContainer maxWidth="sm" className="relative z-10 w-full max-w-[420px] mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="text-center mb-10">
                        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                            Reset Password
                        </h1>
                        <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400">
                            Let's get you back into your account
                        </p>
                    </div>

                    <div className="bg-white/50 dark:bg-[#1C1C1E]/30 p-1 rounded-[32px]">
                        <ForgotPasswordForm
                            onReset={handleReset}
                            onSendCode={handleSendCode}
                            isLoading={isLoading}
                            error={error}
                        />
                    </div>

                    <div className="mt-10 text-center">
                        <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400">
                            Remembered your password?
                            <Link to="/login" className="ml-2 text-slate-900 dark:text-white font-bold hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </ResponsiveContainer>
        </div>
    );
}

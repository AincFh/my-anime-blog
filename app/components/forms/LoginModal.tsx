import { Form, useActionData, useNavigation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { VerificationCodeInput } from "./VerificationCodeInput";

export function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const actionData = useActionData<{
    success: boolean;
    error?: string;
    message?: string;
  }>();
  const navigation = useNavigation();
  const [step, setStep] = useState<"email" | "verify">("email");
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const handleSendCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return;
    }

    setIsSending(true);
    const formData = new FormData();
    formData.append("_action", "send_code");
    formData.append("email", email);

    const response = await fetch("/api/auth/send-code", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (result.success) {
      setStep("verify");
      setCountdown(60);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // 倒计时
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    setIsSending(false);
  };

  const handleCodeComplete = (code: string) => {
    // 自动提交
    const form = document.getElementById("verify-form") as HTMLFormElement;
    if (form) {
      const codeInput = document.createElement("input");
      codeInput.type = "hidden";
      codeInput.name = "code";
      codeInput.value = code;
      form.appendChild(codeInput);
      form.requestSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-md bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 登录表单 */}
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">身份验证</h1>
              <p className="text-white/60 text-sm">
                {step === "email" ? "请输入您的电子邮箱以继续" : `验证码已发送至 ${email}`}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === "email" ? (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Email / 电子邮箱
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSendCode();
                          }
                        }}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/50 transition-all"
                        autoFocus
                      />
                    </div>

                    <motion.button
                      type="button"
                      onClick={handleSendCode}
                      disabled={isSending || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      whileHover={{ scale: isSending ? 1 : 1.02 }}
                      whileTap={{ scale: isSending ? 1 : 0.98 }}
                    >
                      {isSending ? (
                        <>
                          <motion.div
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span>发送中...</span>
                        </>
                      ) : (
                        <>
                          <span>发送验证码</span>
                          <span>→</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Form method="post" id="verify-form" action="/api/auth/login" className="space-y-6">
                    <input type="hidden" name="_action" value="login" />
                    <input type="hidden" name="email" value={email} />

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-4 text-center">
                        Verify Code / 验证码
                      </label>
                      <VerificationCodeInput
                        onComplete={handleCodeComplete}
                        disabled={navigation.state === "submitting"}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <button
                        type="button"
                        onClick={() => setStep("email")}
                        className="text-white/60 hover:text-white transition-colors"
                      >
                        ← 返回
                      </button>
                      {countdown > 0 ? (
                        <span className="text-white/60">
                          重新发送 ({countdown}s)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendCode}
                          className="text-sky-400 hover:text-sky-300 transition-colors"
                        >
                          重新发送
                        </button>
                      )}
                    </div>

                    <motion.button
                      type="submit"
                      disabled={navigation.state === "submitting"}
                      className="w-full px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      whileHover={{ scale: navigation.state === "submitting" ? 1 : 1.02 }}
                      whileTap={{ scale: navigation.state === "submitting" ? 1 : 0.98 }}
                    >
                      {navigation.state === "submitting" ? (
                        <>
                          <motion.div
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span>验证中...</span>
                        </>
                      ) : (
                        <>
                          <span>登录</span>
                          <span>→</span>
                        </>
                      )}
                    </motion.button>
                  </Form>
                </motion.div>
              )}
            </AnimatePresence>

            {actionData?.error && (
              <motion.div
                className="mt-4 p-3 bg-pink-500/20 border border-pink-500/50 rounded-lg text-pink-200 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {actionData.error}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Toast 提示 */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-xl border border-white/20"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center gap-2 text-gray-800">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  ✓
                </motion.span>
                <span className="font-medium">验证码已发送至邮箱</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

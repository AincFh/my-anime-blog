import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, XCircle, Clock, QrCode, CreditCard, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import QRCodeLib from "qrcode";

interface MockPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderNo: string;
    amount: number; // in cents
    productName: string;
    payUrl: string;
}

export function MockPaymentModal({ isOpen, onClose, orderNo, amount, productName, payUrl }: MockPaymentModalProps) {
    const [step, setStep] = useState<"confirm" | "qr" | "success" | "failed">("confirm");
    const [countdown, setCountdown] = useState(300); // 5 minutes
    const [agreed, setAgreed] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState<string>("");

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setStep("confirm");
            setCountdown(300);
            setAgreed(false);
            setQrDataUrl("");
        }
    }, [isOpen]);

    // Generate QR code when entering QR step
    useEffect(() => {
        if (step === "qr" && payUrl) {
            // Build full URL for QR code
            const fullUrl = window.location.origin + payUrl;
            QRCodeLib.toDataURL(fullUrl, {
                width: 200,
                margin: 2,
                color: { dark: "#000000", light: "#ffffff" }
            })
                .then((url: string) => setQrDataUrl(url))
                .catch((err: Error) => console.error("QR Generation failed:", err));
        }
    }, [step, payUrl]);

    // Countdown timer
    useEffect(() => {
        if (step !== "qr") return;
        if (countdown <= 0) {
            setStep("failed");
            return;
        }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [step, countdown]);

    // Format countdown
    const formatCountdown = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    // Handle confirm
    const handleConfirm = () => {
        if (!agreed) return;
        setStep("qr");
    };

    // Handle mock scan (simulate user scanning QR)
    const handleMockScan = () => {
        // Redirect to the actual payUrl which will complete the payment
        window.location.href = payUrl;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            />
            <motion.div
                className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md relative z-10 shadow-2xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <CreditCard className="text-blue-400" />
                        {step === "confirm" && "确认订单"}
                        {step === "qr" && "扫码支付"}
                        {step === "success" && "支付成功"}
                        {step === "failed" && "支付失败"}
                    </h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-2xl">×</button>
                </div>

                {/* Step: Confirm */}
                {step === "confirm" && (
                    <div className="space-y-6">
                        {/* Order Summary */}
                        <div className="bg-white/5 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/60">商品</span>
                                <span className="text-white font-medium">{productName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/60">订单号</span>
                                <span className="text-white/40 font-mono text-xs">{orderNo}</span>
                            </div>
                            <div className="border-t border-white/10 pt-3 flex justify-between">
                                <span className="text-white/60">应付金额</span>
                                <span className="text-2xl font-bold text-white">¥{(amount / 100).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                            <ShieldCheck className="text-blue-400 flex-shrink-0" size={20} />
                            <div className="text-xs text-blue-400/80">
                                您的支付受到 HMAC-SHA256 加密保护。所有交易均通过安全通道处理。
                            </div>
                        </div>

                        {/* Agreement */}
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-yellow-500 focus:ring-yellow-500"
                            />
                            <span className="text-xs text-white/60 group-hover:text-white/80">
                                我已阅读并同意《服务条款》和《隐私政策》。我理解虚拟商品一经购买不予退款。
                            </span>
                        </label>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={onClose}
                                className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!agreed}
                                className={`
                                    py-3 rounded-xl font-bold transition-all
                                    ${agreed
                                        ? "bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                                        : "bg-white/5 text-white/20 cursor-not-allowed"
                                    }
                                `}
                            >
                                确认支付
                            </button>
                        </div>
                    </div>
                )}

                {step === "qr" && (
                    <div className="space-y-6 text-center">
                        {/* QR Code */}
                        <div className="relative mx-auto w-52 h-52 bg-white rounded-xl p-2 flex items-center justify-center overflow-hidden">
                            {qrDataUrl ? (
                                <img src={qrDataUrl} alt="Payment QR Code" className="w-full h-full object-contain" />
                            ) : (
                                <div className="flex items-center justify-center w-full h-full">
                                    <Loader2 size={32} className="text-slate-400 animate-spin" />
                                </div>
                            )}
                            {/* Animated scan line */}
                            <motion.div
                                className="absolute left-2 right-2 h-1 bg-green-500/60 rounded-full"
                                animate={{ y: [-90, 90] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            />
                        </div>

                        {/* Timer */}
                        <div className="flex items-center justify-center gap-2 text-white/60">
                            <Clock size={16} />
                            <span>支付剩余时间：</span>
                            <span className={`font-mono font-bold ${countdown < 60 ? "text-red-400" : "text-white"}`}>
                                {formatCountdown(countdown)}
                            </span>
                        </div>

                        {/* Instructions */}
                        <p className="text-sm text-white/40">
                            请使用微信/支付宝扫描二维码完成支付
                        </p>

                        {/* Mock Scan Button (for testing) */}
                        <button
                            onClick={handleMockScan}
                            className="w-full py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-bold rounded-xl border border-green-500/30 transition-colors"
                        >
                            🔧 模拟扫码支付 (测试用)
                        </button>

                        <button onClick={onClose} className="text-sm text-white/40 hover:text-white underline">
                            取消支付
                        </button>
                    </div>
                )}

                {/* Step: Success */}
                {step === "success" && (
                    <div className="text-center py-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mb-6"
                        >
                            <CheckCircle size={40} />
                        </motion.div>
                        <h3 className="text-xl font-bold text-white mb-2">支付成功！</h3>
                        <p className="text-white/60 mb-6">您的订单已完成，权益已生效。</p>
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-white text-black font-bold rounded-xl"
                        >
                            完成
                        </button>
                    </div>
                )}

                {/* Step: Failed */}
                {step === "failed" && (
                    <div className="text-center py-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center text-red-400 mb-6"
                        >
                            <XCircle size={40} />
                        </motion.div>
                        <h3 className="text-xl font-bold text-white mb-2">支付超时</h3>
                        <p className="text-white/60 mb-6">订单已过期，请重新下单。</p>
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl"
                        >
                            关闭
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

interface ModalOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

let modalFn: (options: ModalOptions) => void;

export const confirmModal = (options: Omit<ModalOptions, "onConfirm" | "onCancel">) => {
    return new Promise<boolean>((resolve) => {
        modalFn?.({
            ...options,
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false),
        });
    });
};

export function ModalContainer() {
    const [current, setCurrent] = useState<ModalOptions | null>(null);

    useEffect(() => {
        modalFn = (options) => setCurrent(options);
    }, []);

    if (!current) return null;

    const handleConfirm = () => {
        current.onConfirm();
        setCurrent(null);
    };

    const handleCancel = () => {
        current.onCancel?.();
        setCurrent(null);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={handleCancel}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/50"
                >
                    {/* 红色警示条 */}
                    <div className="h-1.5 bg-gradient-to-r from-primary-start to-primary-end" />

                    <div className="p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary-start/20 flex items-center justify-center text-primary-start">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{current.title}</h3>
                                <p className="text-sm text-white/50">CONFIRMATION REQUIRED</p>
                            </div>
                        </div>

                        <p className="text-white/80 leading-relaxed mb-8">
                            {current.message}
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={handleCancel}
                                className="flex-1 py-3 px-6 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors"
                            >
                                {current.cancelText || "取消"}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-primary-start to-primary-end text-white font-bold shadow-lg shadow-primary-start/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {current.confirmText || "确定"}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleCancel}
                        className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

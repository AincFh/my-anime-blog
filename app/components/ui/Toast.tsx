import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
}

let toastFn: (type: ToastType, message: string) => void;

export const toast = {
    success: (msg: string) => toastFn?.("success", msg),
    error: (msg: string) => toastFn?.("error", msg),
    info: (msg: string) => toastFn?.("info", msg),
};

export function ToastContainer() {
    const [messages, setMessages] = useState<ToastMessage[]>([]);

    useEffect(() => {
        toastFn = (type, message) => {
            const id = Math.random().toString(36).substring(2, 9);
            setMessages((prev) => [...prev, { id, type, message }]);
            setTimeout(() => {
                setMessages((prev) => prev.filter((m) => m.id !== id));
            }, 3000);
        };
    }, []);

    const removeToast = (id: string) => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
    };

    return (
        <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {messages.map((m) => (
                    <motion.div
                        key={m.id}
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl min-w-[300px]
              ${m.type === "success" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-100" : ""}
              ${m.type === "error" ? "bg-rose-500/20 border-rose-500/50 text-rose-100" : ""}
              ${m.type === "info" ? "bg-primary-start/20 border-primary-start/50 text-white" : ""}
            `}
                    >
                        <div className="shrink-0">
                            {m.type === "success" && <CheckCircle size={20} />}
                            {m.type === "error" && <XCircle size={20} />}
                            {m.type === "info" && <Info size={20} />}
                        </div>
                        <div className="flex-1 text-sm font-medium">{m.message}</div>
                        <button
                            onClick={() => removeToast(m.id)}
                            className="p-1 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

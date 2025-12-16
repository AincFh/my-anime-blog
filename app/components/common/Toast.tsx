import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

/**
 * Toast 通知组件
 * 功能：替代alert，提供优雅的通知提示
 */
interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = "info", isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const typeStyles = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
    warning: "bg-yellow-500 text-white",
  };

  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed top-20 right-8 z-[200] ${typeStyles[type]} rounded-xl shadow-xl p-4 border border-white/20 min-w-[300px]`}
          initial={{ opacity: 0, y: -20, x: 100 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20, x: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icons[type]}</span>
            <span className="font-medium flex-1">{message}</span>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


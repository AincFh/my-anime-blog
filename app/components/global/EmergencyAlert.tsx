import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

/**
 * 全局公告栏：紧急广播 (Emergency Alert)
 * 功能：EVA警报风格，可关闭
 */
interface EmergencyAlertProps {
  message: string;
  type?: "info" | "warning" | "error";
  id?: string;
}

export function EmergencyAlert({ message, type = "info", id = "default" }: EmergencyAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 检查LocalStorage，如果已关闭则不再显示
    const closed = localStorage.getItem(`alert_closed_${id}`);
    if (closed === "true") {
      setIsVisible(false);
    }
  }, [id]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(`alert_closed_${id}`, "true");
  };

  if (!isVisible) return null;

  const bgColor =
    type === "error"
      ? "bg-red-600"
      : type === "warning"
      ? "bg-yellow-600"
      : "bg-blue-600";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`${bgColor} text-white py-3 px-4 border-b-4 border-black/20 relative z-50`}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* 滚动文字 */}
            <div className="flex-1 overflow-hidden">
              <motion.div
                className="whitespace-nowrap font-bold text-sm"
                animate={{
                  x: [0, -100],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                【公告】{message}
              </motion.div>
            </div>

            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="ml-4 w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


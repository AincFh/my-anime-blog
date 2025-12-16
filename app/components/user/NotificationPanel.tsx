import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

/**
 * 消息通知：信号传输 (Signal Transmission)
 * 功能：打字机效果、故障风、粒子消散
 */
interface Notification {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  timestamp: string;
  isImportant?: boolean;
  isRead?: boolean;
}

interface NotificationPanelProps {
  notifications: Notification[];
  onRead?: (id: string) => void;
}

export function NotificationPanel({ notifications, onRead }: NotificationPanelProps) {
  const [displayedNotifications, setDisplayedNotifications] = useState<Notification[]>([]);
  const [typingIndex, setTypingIndex] = useState(0);

  useEffect(() => {
    // 打字机效果：逐个显示通知
    if (notifications.length > 0 && displayedNotifications.length < notifications.length) {
      const timer = setTimeout(() => {
        setDisplayedNotifications([...displayedNotifications, notifications[displayedNotifications.length]]);
        setTypingIndex(displayedNotifications.length);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [notifications, displayedNotifications]);

  const handleRead = (id: string) => {
    if (onRead) {
      onRead(id);
    }
    // 粒子消散动画
    setDisplayedNotifications(displayedNotifications.filter((n) => n.id !== id));
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-slate-900/90 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto">
      <div className="p-6">
        <h2 className="text-white text-xl font-bold mb-6">消息通知</h2>

        <div className="space-y-4">
          <AnimatePresence>
            {displayedNotifications.map((notification, index) => {
              const isTyping = index === typingIndex;
              const [displayedText, setDisplayedText] = useState("");

              useEffect(() => {
                if (isTyping) {
                  let currentIndex = 0;
                  const timer = setInterval(() => {
                    if (currentIndex < notification.message.length) {
                      setDisplayedText(notification.message.slice(0, currentIndex + 1));
                      currentIndex++;
                    } else {
                      clearInterval(timer);
                    }
                  }, 30);

                  return () => clearInterval(timer);
                } else {
                  setDisplayedText(notification.message);
                }
              }, [isTyping, notification.message]);

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className={`p-4 rounded-xl border ${
                    notification.type === "error"
                      ? "bg-red-500/20 border-red-500/50"
                      : notification.type === "warning"
                      ? "bg-yellow-500/20 border-yellow-500/50"
                      : notification.type === "success"
                      ? "bg-green-500/20 border-green-500/50"
                      : "bg-blue-500/20 border-blue-500/50"
                  } cursor-pointer`}
                  onClick={() => handleRead(notification.id)}
                >
                  {/* 故障风效果（重要通知） */}
                  {notification.isImportant && (
                    <motion.div
                      className="text-red-400 font-bold text-sm mb-2"
                      animate={{
                        x: [0, -2, 2, -2, 2, 0],
                        opacity: [1, 0.8, 1, 0.8, 1],
                      }}
                      transition={{
                        duration: 0.3,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                    >
                      ⚠️ 重要
                    </motion.div>
                  )}

                  <h3 className="text-white font-bold mb-2">{notification.title}</h3>
                  
                  {/* 打字机效果 */}
                  <p className="text-white/80 text-sm">
                    {displayedText}
                    {isTyping && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        |
                      </motion.span>
                    )}
                  </p>

                  <div className="text-white/40 text-xs mt-2">{notification.timestamp}</div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}


import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X, Bell } from "lucide-react";

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
  isOpen: boolean;
  onClose: () => void;
  onRead?: (id: string) => void;
}

// 单独的通知项组件
function NotificationItem({
  notification,
  isTyping,
  onRead
}: {
  notification: Notification;
  isTyping: boolean;
  onRead: (id: string) => void;
}) {
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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`p-4 rounded-xl border mb-3 ${notification.type === "error"
          ? "bg-red-500/10 border-red-500/30"
          : notification.type === "warning"
            ? "bg-yellow-500/10 border-yellow-500/30"
            : notification.type === "success"
              ? "bg-green-500/10 border-green-500/30"
              : "bg-blue-500/10 border-blue-500/30"
        } cursor-pointer hover:bg-white/5 transition-colors`}
      onClick={() => onRead(notification.id)}
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

      <h3 className="text-white font-bold mb-1 text-sm">{notification.title}</h3>

      {/* 打字机效果 */}
      <p className="text-white/80 text-xs leading-relaxed">
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

      <div className="text-white/40 text-[10px] mt-2 text-right">{notification.timestamp}</div>
    </motion.div>
  );
}

export function NotificationPanel({ notifications, isOpen, onClose, onRead }: NotificationPanelProps) {
  const [displayedNotifications, setDisplayedNotifications] = useState<Notification[]>([]);
  const [typingIndex, setTypingIndex] = useState(0);

  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      // 简单处理：打开时显示所有通知，不逐个打字了，避免复杂状态
      setDisplayedNotifications(notifications);
    }
  }, [notifications, isOpen]);

  const handleRead = (id: string) => {
    if (onRead) {
      onRead(id);
    }
    // 粒子消散动画
    setDisplayedNotifications(displayedNotifications.filter((n) => n.id !== id));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* 面板 */}
          <motion.div
            className="fixed right-0 top-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-[61] shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="p-4 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2 text-white">
                  <Bell className="w-5 h-5" />
                  <h2 className="text-lg font-bold">消息通知</h2>
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {displayedNotifications.length}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <AnimatePresence mode="popLayout">
                  {displayedNotifications.length > 0 ? (
                    displayedNotifications.map((notification, index) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        isTyping={false} // 禁用打字机以提高列表性能
                        onRead={handleRead}
                      />
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-white/40 py-10 text-sm"
                    >
                      暂无新消息
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

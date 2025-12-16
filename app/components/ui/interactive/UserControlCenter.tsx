import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";

/**
 * 用户控制中心（Control Center）
 * 功能：点击头像弹出的菜单，替代"个人资料"
 */
interface UserControlCenterProps {
  user: {
    name: string;
    avatar?: string;
    level: number;
  };
}

export function UserControlCenter({ user }: UserControlCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const menuItems = [
    { icon: "💳", label: "ID Card", path: "/admin/profile" },
    { icon: "📦", label: "Inventory", path: "/admin/gallery" },
    { icon: "⚙️", label: "Settings", path: "/admin/settings" },
    { icon: "🚪", label: "Logout", path: "/admin/logout", danger: true },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-cyan-400 flex items-center justify-center text-white text-sm font-bold">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            user.name[0]
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-gray-800">{user.name}</span>
          <span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 text-xs font-bold rounded">
            Lv.{user.level}
          </span>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-2">
                {menuItems.map((item) => (
                  <Link key={item.path} to={item.path}>
                    <motion.div
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        item.danger
                          ? "text-red-600 hover:bg-red-50"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


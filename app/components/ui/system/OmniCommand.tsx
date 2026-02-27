import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { musicPlayerToggle } from "~/components/media/MusicPlayer";

/**
 * 全局指令终端 (Omni-Command)
 * 功能：Ctrl+K 触发，支持搜索、系统指令、彩蛋指令
 */
interface Command {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: () => void;
  category: "search" | "system" | "easter";
}

export function OmniCommand() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // 系统指令
  const systemCommands: Command[] = [
    {
      id: "dark",
      label: "切换深色模式",
      description: "/dark - 强制切换深色模式",
      icon: "🌙",
      category: "system",
      action: () => {
        document.documentElement.classList.toggle("dark");
        setIsOpen(false);
      },
    },
    {
      id: "music",
      label: "音乐播放器",
      description: "/music - 唤起/隐藏音乐播放器",
      icon: "🎵",
      category: "system",
      action: () => {
        musicPlayerToggle();
        setIsOpen(false);
      },
    },
    {
      id: "login",
      label: "登录",
      description: "/login - 直接跳出登录框",
      icon: "🔐",
      category: "system",
      action: () => {
        navigate("/admin/login");
        setIsOpen(false);
      },
    },
  ];

  // 彩蛋指令
  const easterCommands: Command[] = [
    {
      id: "isekai",
      label: "异世界传送",
      description: "/isekai - 屏幕故障效果，跳转到异世界风景图",
      icon: "🌀",
      category: "easter",
      action: () => {
        // 故障效果
        const body = document.body;
        body.style.filter = "hue-rotate(90deg)";
        body.style.animation = "glitch 0.3s";

        setTimeout(() => {
          body.style.filter = "";
          body.style.animation = "";
          // 跳转到随机风景图
          window.open("https://picsum.photos/1920/1080", "_blank");

        }, 500);
        setIsOpen(false);
      },
    },
    {
      id: "coffee",
      label: "倒咖啡",
      description: "/coffee - 给站长倒一杯卡布奇诺",
      icon: "☕",
      category: "easter",
      action: () => {
        // 显示Toast
        const toast = document.createElement("div");
        toast.className = "fixed top-20 right-8 z-50 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-xl border border-white/20";
        toast.textContent = "给站长倒了一杯卡布奇诺 ☕";
        document.body.appendChild(toast);

        setTimeout(() => {
          toast.remove();
        }, 3000);
        setIsOpen(false);
      },
    },
  ];

  // 搜索命令（占位）
  const searchCommands: Command[] = [
    {
      id: "search",
      label: "搜索文章",
      description: `搜索 "${query}"`,
      icon: "🔍",
      category: "search",
      action: () => {
        navigate(`/articles?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
      },
    },
  ];

  // 过滤命令
  const filteredCommands = (() => {
    if (query.startsWith("/")) {
      const cmd = query.slice(1).toLowerCase();
      if (cmd === "dark" || cmd === "music" || cmd === "login") {
        return systemCommands.filter((c) => c.id === cmd);
      }
      if (cmd === "isekai" || cmd === "coffee") {
        return easterCommands.filter((c) => c.id === cmd);
      }
      return [...systemCommands, ...easterCommands].filter((c) =>
        c.id.includes(cmd)
      );
    }
    if (query.trim()) {
      return searchCommands;
    }
    return [...systemCommands, ...easterCommands];
  })();

  // 监听 Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // 打开时聚焦输入框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />

          {/* 指令终端 */}
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-2xl"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
              {/* 输入框 */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⌘</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSelectedIndex(0);
                    }}
                    placeholder="输入指令或搜索... (输入 / 查看系统指令)"
                    className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none text-lg"
                  />
                </div>
              </div>

              {/* 命令列表 */}
              <div className="max-h-96 overflow-y-auto">
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((command, index) => (
                    <motion.div
                      key={command.id}
                      className={`px-4 py-3 cursor-pointer transition-colors ${index === selectedIndex
                        ? "bg-white/20"
                        : "hover:bg-white/10"
                        }`}
                      onClick={() => command.action()}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{command.icon}</span>
                        <div className="flex-1">
                          <div className="text-white font-medium">{command.label}</div>
                          <div className="text-white/60 text-sm">{command.description}</div>
                        </div>
                        {command.category === "system" && (
                          <span className="px-2 py-1 bg-sky-500/20 text-sky-300 text-xs rounded">
                            系统
                          </span>
                        )}
                        {command.category === "easter" && (
                          <span className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded">
                            彩蛋
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-white/60">
                    没有找到匹配的指令
                  </div>
                )}
              </div>

              {/* 底部提示 */}
              <div className="px-4 py-2 border-t border-white/10 bg-white/5">
                <div className="flex items-center justify-between text-xs text-white/40">
                  <div className="flex items-center gap-4">
                    <span>↑↓ 导航</span>
                    <span>Enter 执行</span>
                    <span>Esc 关闭</span>
                  </div>
                  <span>Ctrl+K 打开</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


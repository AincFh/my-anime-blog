import { j as jsxRuntimeExports, A as AnimatePresence, m as motion } from "./server-build-Bj-59ip7.js";
import { a as reactExports, b as useNavigate } from "./worker-entry-CHMicv-3.js";
import "util";
import "stream";
import "zlib";
import "assert";
import "buffer";
import "node:events";
import "node:stream";
function OmniCommand() {
  const [isOpen, setIsOpen] = reactExports.useState(false);
  const [query, setQuery] = reactExports.useState("");
  const [selectedIndex, setSelectedIndex] = reactExports.useState(0);
  const inputRef = reactExports.useRef(null);
  const navigate = useNavigate();
  const systemCommands = [
    {
      id: "dark",
      label: "切换深色模式",
      description: "/dark - 强制切换深色模式",
      icon: "🌙",
      category: "system",
      action: () => {
        document.documentElement.classList.toggle("dark");
        setIsOpen(false);
      }
    },
    {
      id: "music",
      label: "音乐播放器",
      description: "/music - 唤起/隐藏音乐播放器",
      icon: "🎵",
      category: "system",
      action: () => {
        setIsOpen(false);
      }
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
      }
    }
  ];
  const easterCommands = [
    {
      id: "isekai",
      label: "异世界传送",
      description: "/isekai - 屏幕故障效果，跳转到异世界风景图",
      icon: "🌀",
      category: "easter",
      action: () => {
        const body = document.body;
        body.style.filter = "hue-rotate(90deg)";
        body.style.animation = "glitch 0.3s";
        setTimeout(() => {
          body.style.filter = "";
          body.style.animation = "";
          window.open("https://images.unsplash.com/photo-1616486339569-9c4050911745?q=80&w=2070", "_blank");
        }, 500);
        setIsOpen(false);
      }
    },
    {
      id: "coffee",
      label: "倒咖啡",
      description: "/coffee - 给站长倒一杯卡布奇诺",
      icon: "☕",
      category: "easter",
      action: () => {
        const toast = document.createElement("div");
        toast.className = "fixed top-20 right-8 z-50 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-xl border border-white/20";
        toast.textContent = "给站长倒了一杯卡布奇诺 ☕";
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.remove();
        }, 3e3);
        setIsOpen(false);
      }
    }
  ];
  const searchCommands = [
    {
      id: "search",
      label: "搜索文章",
      description: `搜索 "${query}"`,
      icon: "🔍",
      category: "search",
      action: () => {
        navigate(`/articles?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
      }
    }
  ];
  const filteredCommands = (() => {
    if (query.startsWith("/")) {
      const cmd = query.slice(1).toLowerCase();
      if (cmd === "dark" || cmd === "music" || cmd === "login") {
        return systemCommands.filter((c) => c.id === cmd);
      }
      if (cmd === "isekai" || cmd === "coffee") {
        return easterCommands.filter((c) => c.id === cmd);
      }
      return [...systemCommands, ...easterCommands].filter(
        (c) => c.id.includes(cmd)
      );
    }
    if (query.trim()) {
      return searchCommands;
    }
    return [...systemCommands, ...easterCommands];
  })();
  reactExports.useEffect(() => {
    const handleKeyDown = (e) => {
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
  reactExports.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  reactExports.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
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
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]",
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        onClick: () => setIsOpen(false)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        className: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-2xl",
        initial: { opacity: 0, scale: 0.95, y: -20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: -20 },
        onClick: (e) => e.stopPropagation(),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 border-b border-white/10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl", children: "⌘" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: inputRef,
                type: "text",
                value: query,
                onChange: (e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                },
                placeholder: "输入指令或搜索... (输入 / 查看系统指令)",
                className: "flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none text-lg"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-96 overflow-y-auto", children: filteredCommands.length > 0 ? filteredCommands.map((command, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            motion.div,
            {
              className: `px-4 py-3 cursor-pointer transition-colors ${index === selectedIndex ? "bg-white/20" : "hover:bg-white/10"}`,
              onClick: () => command.action(),
              whileHover: { x: 4 },
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl", children: command.icon }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-white font-medium", children: command.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-white/60 text-sm", children: command.description })
                ] }),
                command.category === "system" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-1 bg-sky-500/20 text-sky-300 text-xs rounded", children: "系统" }),
                command.category === "easter" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded", children: "彩蛋" })
              ] })
            },
            command.id
          )) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-8 text-center text-white/60", children: "没有找到匹配的指令" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-2 border-t border-white/10 bg-white/5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs text-white/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "↑↓ 导航" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Enter 执行" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Esc 关闭" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Ctrl+K 打开" })
          ] }) })
        ] })
      }
    )
  ] }) });
}
export {
  OmniCommand
};

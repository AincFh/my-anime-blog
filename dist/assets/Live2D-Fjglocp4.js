import { i as isMobileDevice, j as jsxRuntimeExports, A as AnimatePresence, m as motion } from "./server-build-Bj-59ip7.js";
import { a as reactExports } from "./worker-entry-CHMicv-3.js";
import "util";
import "stream";
import "zlib";
import "assert";
import "buffer";
import "node:events";
import "node:stream";
function Live2D() {
  const [isVisible, setIsVisible] = reactExports.useState(true);
  const containerRef = reactExports.useRef(null);
  const [isLoaded, setIsLoaded] = reactExports.useState(false);
  const [dialog, setDialog] = reactExports.useState("");
  const lastActivityRef = reactExports.useRef(Date.now());
  const scrollBottomTriggeredRef = reactExports.useRef(false);
  const [isMobile, setIsMobile] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);
  reactExports.useEffect(() => {
    if (!isVisible || !containerRef.current || isMobile) return;
    const timer = setTimeout(() => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/live2d-widget@3.0.5/lib/L2Dwidget.min.js";
      script.async = true;
      script.onload = () => {
        window.L2Dwidget.init({
          model: {
            // 选择一个可爱的模型
            jsonPath: "https://cdn.jsdelivr.net/npm/live2d-widget-model-shizuku@1.0.5/assets/shizuku.model.json"
          },
          display: {
            position: "right",
            width: 120,
            // 减小尺寸
            height: 240,
            // 减小尺寸
            hOffset: 0,
            vOffset: -20
          },
          mobile: {
            show: false,
            // 移动端禁用 Live2D 提升性能
            scale: 0.6
          },
          react: {
            opacityDefault: 0.7,
            // 降低默认透明度
            opacityOnHover: 0.8
            // 降低悬停透明度
          },
          dialog: {
            enable: true,
            scripts: {
              welcome: [
                "欢迎来到我的博客！",
                "今天也要元气满满哦~"
              ],
              click: [
                "哎呀，你戳我干嘛？",
                "好痒~",
                "Master，有什么事吗？"
              ]
            }
          }
        });
        setIsLoaded(true);
      };
      document.body.appendChild(script);
      return () => {
        clearTimeout(timer);
        if (window.L2Dwidget) {
          window.L2Dwidget.destroy();
        }
        document.body.removeChild(script);
      };
    }, 3e3);
    return () => clearTimeout(timer);
  }, [isVisible]);
  reactExports.useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollBottom = scrollTop + windowHeight >= documentHeight - 50;
      if (scrollBottom && !scrollBottomTriggeredRef.current) {
        scrollBottomTriggeredRef.current = true;
        const messages = [
          "看来你很喜欢这一篇呢~",
          "读完了吗？要不要看看其他文章？",
          "Master，你读得好认真呢！"
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        setDialog(randomMessage);
        setTimeout(() => setDialog(""), 3e3);
      } else if (!scrollBottom) {
        scrollBottomTriggeredRef.current = false;
      }
    };
    const checkTime = () => {
      const hour = (/* @__PURE__ */ new Date()).getHours();
      if (hour >= 2 && hour < 6) {
        const messages = [
          "Master，还不睡会导致秃头哦。",
          "已经这么晚了，要注意身体呢~",
          "熬夜对身体不好，快去休息吧！"
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        setDialog(randomMessage);
        setTimeout(() => setDialog(""), 4e3);
      }
    };
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };
    const checkInactivity = () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity > 3e4 && !dialog) {
        const messages = [
          "Master，你还在吗？",
          "敲敲屏幕~ 有人吗？",
          "是不是在看其他东西？"
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        setDialog(randomMessage);
        setTimeout(() => setDialog(""), 3e3);
      }
    };
    setTimeout(checkTime, 5e3);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("click", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    const inactivityInterval = setInterval(checkInactivity, 5e3);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      clearInterval(inactivityInterval);
    };
  }, [isLoaded, dialog]);
  if (isMobile) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed bottom-4 right-4 z-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: isVisible && /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 20, scale: 0.9 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 20, scale: 0.9 },
      className: "relative group",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            ref: containerRef,
            className: "w-32 h-48",
            children: !isLoaded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full flex items-center justify-center opacity-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setIsVisible(false),
            className: "absolute top-2 right-2 w-6 h-6 bg-black/20 hover:bg-black/40\r\n                         backdrop-blur-sm rounded-full flex items-center justify-center\r\n                         text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity",
            children: "✕"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: dialog && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 10, scale: 0.8 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, y: -10, scale: 0.8 },
            className: "absolute bottom-full right-0 mb-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 max-w-xs",
            style: { zIndex: 1e3 },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-800 font-medium", children: dialog }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 right-4 translate-y-1/2 rotate-45 w-3 h-3 bg-white/90 border-r border-b border-white/50" })
            ]
          }
        ) })
      ]
    }
  ) }) });
}
export {
  Live2D
};

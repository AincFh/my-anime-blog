import { j as jsxRuntimeExports, A as AnimatePresence, m as motion } from "./server-build-Bj-59ip7.js";
import { a as reactExports } from "./worker-entry-CHMicv-3.js";
import "util";
import "stream";
import "zlib";
import "assert";
import "buffer";
import "node:events";
import "node:stream";
function CopyAttribution() {
  const [showToast, setShowToast] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const handleCopy = (e) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const selectedText = selection.toString().trim();
      if (!selectedText || selectedText.length < 10) return;
      const articleContent = document.querySelector(".prose, .markdown-content, article");
      if (!articleContent || !articleContent.contains(selection.anchorNode)) {
        return;
      }
      const pageTitle = document.title;
      const pageUrl = window.location.href;
      const attribution = `

—— 摘自 ${pageTitle} ${pageUrl}`;
      const newText = selectedText + attribution;
      e.clipboardData?.setData("text/plain", newText);
      e.preventDefault();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3e3);
    };
    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: showToast && /* @__PURE__ */ jsxRuntimeExports.jsx(
    motion.div,
    {
      className: "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-xl border border-white/20",
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-gray-800", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "✓" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "复制成功！转载请记得带上出处哦 ( •̀ ω •́ )y" })
      ] })
    }
  ) });
}
export {
  CopyAttribution
};

import { j as jsxRuntimeExports, A as AnimatePresence, m as motion } from "./server-build-Bj-59ip7.js";
import { a as reactExports } from "./worker-entry-CHMicv-3.js";
import "util";
import "stream";
import "zlib";
import "assert";
import "buffer";
import "node:events";
import "node:stream";
function TheatricalMode() {
  const [isActive, setIsActive] = reactExports.useState(false);
  const observerRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            setIsActive(true);
          } else {
            setIsActive(false);
          }
        });
      },
      {
        threshold: [0.3, 0.5, 0.7],
        rootMargin: "-100px"
      }
    );
    const videos = document.querySelectorAll("video, iframe[src*='bilibili'], iframe[src*='youtube']");
    const wideImages = document.querySelectorAll("img[class*='wide'], img[class*='full'], .prose img");
    videos.forEach((el) => observerRef.current?.observe(el));
    wideImages.forEach((el) => {
      const img = el;
      if (img.naturalWidth && img.naturalHeight) {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        if (aspectRatio > 2) {
          observerRef.current?.observe(el);
        }
      }
    });
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: isActive && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        className: "fixed inset-0 bg-black/60 z-30 pointer-events-none",
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3 }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        className: "fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-black/50 text-white px-4 py-2 rounded-full text-xs pointer-events-none",
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.3, delay: 0.2 },
        children: "🎬 影院模式"
      }
    )
  ] }) });
}
export {
  TheatricalMode
};

import { j as jsxRuntimeExports, A as AnimatePresence, m as motion } from "./server-build-Bj-59ip7.js";
import { a as reactExports } from "./worker-entry-CHMicv-3.js";
import "util";
import "stream";
import "zlib";
import "assert";
import "buffer";
import "node:events";
import "node:stream";
function KonamiCode() {
  const [isLimitBreak, setIsLimitBreak] = reactExports.useState(false);
  const [timeLeft, setTimeLeft] = reactExports.useState(60);
  reactExports.useEffect(() => {
    const konamiCode = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "KeyB",
      "KeyA"
    ];
    let sequence = [];
    const handleKeyDown = (e) => {
      sequence.push(e.code);
      if (sequence.length > konamiCode.length) {
        sequence = sequence.slice(-konamiCode.length);
      }
      if (sequence.length === konamiCode.length) {
        const isMatch = sequence.every((key, index) => key === konamiCode[index]);
        if (isMatch) {
          setIsLimitBreak(true);
          setTimeLeft(60);
          sequence = [];
          document.documentElement.classList.add("limit-break");
          const timer = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                setIsLimitBreak(false);
                document.documentElement.classList.remove("limit-break");
                return 0;
              }
              return prev - 1;
            });
          }, 1e3);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: isLimitBreak && /* @__PURE__ */ jsxRuntimeExports.jsx(
    motion.div,
    {
      className: "fixed top-0 left-0 right-0 z-[200] bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 h-1",
      initial: { scaleX: 0 },
      animate: { scaleX: 1 },
      exit: { scaleX: 0 },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          className: "absolute top-0 right-0 bg-black/50 text-white px-4 py-2 text-sm font-bold",
          initial: { opacity: 0, y: -20 },
          animate: { opacity: 1, y: 0 },
          children: [
            "系统过载模式: ",
            timeLeft,
            "s"
          ]
        }
      )
    }
  ) });
}
export {
  KonamiCode
};

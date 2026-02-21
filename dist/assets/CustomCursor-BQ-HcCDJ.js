import { j as jsxRuntimeExports, m as motion } from "./server-build-Bj-59ip7.js";
import { a as reactExports } from "./worker-entry-CHMicv-3.js";
import "util";
import "stream";
import "zlib";
import "assert";
import "buffer";
import "node:events";
import "node:stream";
function CustomCursor() {
  const [mousePosition, setMousePosition] = reactExports.useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = reactExports.useState(false);
  const [clickParticles, setClickParticles] = reactExports.useState([]);
  const prevTargetRef = reactExports.useRef(null);
  const particleIdRef = reactExports.useRef(0);
  const updateMousePosition = reactExports.useCallback((e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);
  const handleMouseOver = reactExports.useCallback((e) => {
    const target = e.target;
    const isLinkOrButton = !!(target.tagName === "A" || target.tagName === "BUTTON" || target.closest("a") || target.closest("button"));
    if (isLinkOrButton !== isHovering) {
      setIsHovering(isLinkOrButton);
    }
    prevTargetRef.current = target;
  }, [isHovering]);
  const handleClick = reactExports.useCallback((e) => {
    const particles = [];
    for (let i = 0; i < 12; i++) {
      particles.push({
        id: particleIdRef.current++,
        x: e.clientX,
        y: e.clientY
      });
    }
    setClickParticles((prev) => [...prev, ...particles]);
    setTimeout(() => {
      setClickParticles((prev) => prev.filter((p) => !particles.find((pp) => pp.id === p.id)));
    }, 1e3);
  }, []);
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("mousemove", updateMousePosition, { passive: true });
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("click", handleClick, { passive: true });
    if (typeof document !== "undefined") {
      document.body.classList.add("custom-cursor");
    }
    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("click", handleClick);
      if (typeof document !== "undefined") {
        document.body.classList.remove("custom-cursor");
      }
    };
  }, [updateMousePosition, handleMouseOver, handleClick]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        className: "fixed top-0 left-0 pointer-events-none z-[60]",
        style: {
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`
        },
        animate: {
          scale: isHovering ? 0.8 : 1,
          rotate: isHovering ? 15 : 0
        },
        transition: {
          type: "spring",
          stiffness: 500,
          damping: 28
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "svg",
          {
            width: "24",
            height: "24",
            viewBox: "0 0 24 24",
            fill: "none",
            xmlns: "http://www.w3.org/2000/svg",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "path",
              {
                d: "M3 3L12 2L10 11L3 3Z",
                fill: "#FF9F43",
                stroke: "#FF6B6B",
                strokeWidth: "1.5"
              }
            )
          }
        )
      }
    ),
    clickParticles.map((particle) => {
      const angle = Math.PI * 2 * particle.id / 12;
      const distance = 50 + Math.random() * 30;
      const endX = particle.x + Math.cos(angle) * distance;
      const endY = particle.y + Math.sin(angle) * distance;
      const emoji = Math.random() > 0.5 ? "🌸" : "✨";
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.div,
        {
          className: "fixed pointer-events-none z-50 text-2xl",
          initial: {
            x: particle.x,
            y: particle.y,
            opacity: 1,
            scale: 1
          },
          animate: {
            x: endX,
            y: endY,
            opacity: 0,
            scale: 0,
            rotate: 360
          },
          transition: {
            duration: 0.8,
            ease: "easeOut"
          },
          children: emoji
        },
        particle.id
      );
    })
  ] });
}
export {
  CustomCursor
};

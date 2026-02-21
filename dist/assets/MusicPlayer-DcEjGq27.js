import { c as createLucideIcon, j as jsxRuntimeExports, A as AnimatePresence, m as motion, X } from "./server-build-Bj-59ip7.js";
import { a as reactExports } from "./worker-entry-CHMicv-3.js";
import "util";
import "stream";
import "zlib";
import "assert";
import "buffer";
import "node:events";
import "node:stream";
const __iconNode$4 = [
  ["path", { d: "M16 5H3", key: "m91uny" }],
  ["path", { d: "M11 12H3", key: "51ecnj" }],
  ["path", { d: "M11 19H3", key: "zflm78" }],
  ["path", { d: "M21 16V5", key: "yxg4q8" }],
  ["circle", { cx: "18", cy: "16", r: "3", key: "1hluhg" }]
];
const ListMusic = createLucideIcon("list-music", __iconNode$4);
const __iconNode$3 = [
  ["rect", { x: "14", y: "3", width: "5", height: "18", rx: "1", key: "kaeet6" }],
  ["rect", { x: "5", y: "3", width: "5", height: "18", rx: "1", key: "1wsw3u" }]
];
const Pause = createLucideIcon("pause", __iconNode$3);
const __iconNode$2 = [
  [
    "path",
    {
      d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",
      key: "10ikf1"
    }
  ]
];
const Play = createLucideIcon("play", __iconNode$2);
const __iconNode$1 = [
  [
    "path",
    {
      d: "M17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z",
      key: "15892j"
    }
  ],
  ["path", { d: "M3 20V4", key: "1ptbpl" }]
];
const SkipBack = createLucideIcon("skip-back", __iconNode$1);
const __iconNode = [
  ["path", { d: "M21 4v16", key: "7j8fe9" }],
  [
    "path",
    {
      d: "M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z",
      key: "zs4d6"
    }
  ]
];
const SkipForward = createLucideIcon("skip-forward", __iconNode);
function MusicPlayer() {
  const [isOpen, setIsOpen] = reactExports.useState(false);
  const [songs, setSongs] = reactExports.useState([]);
  const [currentIndex, setCurrentIndex] = reactExports.useState(0);
  const [isPlaying, setIsPlaying] = reactExports.useState(false);
  const [currentTime, setCurrentTime] = reactExports.useState(0);
  const [duration, setDuration] = reactExports.useState(0);
  const [volume, setVolume] = reactExports.useState(0.7);
  const [isMuted, setIsMuted] = reactExports.useState(false);
  const [showList, setShowList] = reactExports.useState(false);
  const [isMounted, setIsMounted] = reactExports.useState(false);
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const audioRef = reactExports.useRef(null);
  const playlistId = "13641046209";
  reactExports.useEffect(() => {
    setIsMounted(true);
  }, []);
  reactExports.useEffect(() => {
    if (!isMounted) return;
    const fetchMusic = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`https://api.i-meto.com/meting/api?server=netease&type=playlist&id=${playlistId}`);
        const data = await res.json();
        if (data && data.length > 0) {
          setSongs(data);
        }
      } catch (err) {
        console.error("Failed to fetch music list", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMusic();
  }, [isMounted, playlistId]);
  reactExports.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => handleNext();
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentIndex, songs]);
  reactExports.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  reactExports.useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex]);
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % songs.length);
    setIsPlaying(true);
  };
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
    setIsPlaying(true);
  };
  const handleSeek = (e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };
  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };
  if (!isMounted) return null;
  const currentSong = songs[currentIndex];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    songs.length > 0 && currentSong && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "audio",
      {
        ref: audioRef,
        src: currentSong.url,
        preload: "metadata"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        onClick: () => setIsOpen(false),
        className: "fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed z-50 flex flex-col items-end md:items-start \r\n                      bottom-4 right-4 md:bottom-8 md:left-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.div,
        {
          initial: { opacity: 0, y: 20, scale: 0.95 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 20, scale: 0.95 },
          transition: { type: "spring", damping: 25, stiffness: 300 },
          className: "\r\n                mb-4 overflow-hidden shadow-2xl backdrop-blur-2xl border\r\n                bg-white/70 border-white/50 text-slate-800\r\n                dark:bg-slate-900/70 dark:border-white/10 dark:text-slate-100\r\n                w-[90vw] max-w-[340px] rounded-3xl\r\n                origin-bottom-right md:origin-bottom-left\r\n              ",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-2 h-2 rounded-full bg-pink-500 animate-pulse" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold tracking-widest uppercase opacity-60", children: "Now Playing" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => setShowList(!showList),
                    className: `p-1.5 rounded-full transition-colors ${showList ? "bg-pink-500/10 text-pink-500" : "hover:bg-black/5 dark:hover:bg-white/10"}`,
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ListMusic, { size: 16 })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => setIsOpen(false),
                    className: "p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16 })
                  }
                )
              ] })
            ] }),
            !currentSong ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 flex items-center justify-center text-sm opacity-50", children: isLoading ? "加载歌单中..." : "暂无歌曲" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { mode: "wait", children: !showList ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              motion.div,
              {
                initial: { opacity: 0, x: -20 },
                animate: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: 20 },
                className: "flex flex-col items-center",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `relative w-24 h-24 sm:w-32 sm:h-32 mb-4 rounded-2xl overflow-hidden shadow-lg transition-transform duration-500 ${isPlaying ? "scale-100" : "scale-95"}`, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse -z-10" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "img",
                      {
                        src: currentSong.pic,
                        alt: currentSong.title,
                        className: "w-full h-full object-cover",
                        crossOrigin: "anonymous"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center w-full mb-4 px-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-lg truncate", children: currentSong.title }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm opacity-60 truncate", children: currentSong.author })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full mb-4 group", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "range",
                        min: "0",
                        max: duration || 100,
                        value: currentTime,
                        onChange: handleSeek,
                        className: "w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer\r\n                                         accent-pink-500 hover:h-2 transition-all",
                        style: {
                          background: `linear-gradient(to right, #ec4899 ${currentTime / (duration || 1) * 100}%, transparent 0)`
                        }
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-[10px] opacity-50 mt-1.5 font-mono", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatTime(currentTime) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatTime(duration) })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-6 mb-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handlePrev, className: "p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SkipBack, { size: 24, className: "fill-current" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: togglePlay,
                        className: "w-14 h-14 flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-full shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all",
                        children: isPlaying ? /* @__PURE__ */ jsxRuntimeExports.jsx(Pause, { size: 24, className: "fill-current" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { size: 24, className: "fill-current ml-1" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleNext, className: "p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SkipForward, { size: 24, className: "fill-current" }) })
                  ] })
                ]
              },
              "player-view"
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              motion.div,
              {
                initial: { opacity: 0, x: 20 },
                animate: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: -20 },
                className: "h-[280px] sm:h-[320px] overflow-y-auto pr-2 -mr-2 custom-scrollbar",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: songs.map((song, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => {
                      setCurrentIndex(idx);
                      setIsPlaying(true);
                    },
                    className: `w-full flex items-center gap-3 p-2 rounded-xl transition-colors text-left
                                  ${currentIndex === idx ? "bg-pink-500/10 text-pink-500" : "hover:bg-black/5 dark:hover:bg-white/10"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: song.pic, alt: "", className: "w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-slate-200 dark:bg-slate-800", crossOrigin: "anonymous" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-sm truncate ${currentIndex === idx ? "font-bold" : "font-medium"}`, children: song.title }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs opacity-60 truncate", children: song.author })
                      ] }),
                      currentIndex === idx && isPlaying && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-0.5 h-3 items-end", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { animate: { height: ["40%", "100%", "40%"] }, transition: { repeat: Infinity, duration: 0.8 }, className: "w-1 bg-pink-500 rounded-full" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { animate: { height: ["80%", "30%", "80%"] }, transition: { repeat: Infinity, duration: 0.8 }, className: "w-1 bg-pink-500 rounded-full" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { animate: { height: ["50%", "100%", "50%"] }, transition: { repeat: Infinity, duration: 0.8 }, className: "w-1 bg-pink-500 rounded-full" })
                      ] })
                    ]
                  },
                  idx
                )) })
              },
              "list-view"
            ) }) })
          ] })
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.button,
        {
          onClick: () => setIsOpen(!isOpen),
          whileHover: { scale: 1.1 },
          whileTap: { scale: 0.9 },
          animate: isOpen ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 },
          className: `
            relative group w-12 h-12 md:w-14 md:h-14 
            rounded-full shadow-lg shadow-pink-500/20
            border border-white/50 dark:border-white/10
            overflow-hidden
            bg-slate-900
            ${isOpen ? "pointer-events-none" : ""}
          `,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              motion.div,
              {
                animate: { rotate: isPlaying ? 360 : 0 },
                transition: { duration: 10, repeat: Infinity, ease: "linear" },
                className: "w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-900 to-slate-800",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1/3 h-1/3 rounded-full bg-pink-500 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-slate-900" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-full border border-white/10 scale-75" })
                ]
              }
            ),
            isPlaying && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-slate-900" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { dangerouslySetInnerHTML: { __html: `
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #ec4899;
          cursor: pointer;
          margin-top: -3px;
          box-shadow: 0 0 10px rgba(236, 72, 153, 0.5);
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          cursor: pointer;
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }
      ` } })
  ] });
}
export {
  MusicPlayer
};

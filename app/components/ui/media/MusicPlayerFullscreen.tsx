import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, ListMusic, X, Volume2, VolumeX, Minimize2, Repeat, Shuffle, List } from "lucide-react";
import { PreloadLazyImage } from "./MusicPlayerMini";
import type { Song, LyricLine } from "~/hooks/useMusicPlayer";

/**
 * 局部态组件 (Component B): 全屏沉浸式流媒体播放舱
 * 设计语言：Apple Music 高强模糊 + 网易云 PC 端巨幕排版
 */

export interface MusicPlayerFullscreenProps {
  songs: Song[];
  currentSong: Song | null;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  handleNext: () => void;
  handlePrev: () => void;
  currentTime: number;
  duration: number;
  handleSeek: (time: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isLoading: boolean;
  currentTimeRef: React.RefObject<HTMLSpanElement | null>;
  progressBarRef: React.RefObject<HTMLInputElement | null>;
  progressFillRef: React.RefObject<HTMLDivElement | null>;
  showPlaylist: boolean;
  setShowPlaylist: (show: boolean) => void;
  currentLyrics: LyricLine[];
  activeLyricIndex: number;
  stylusState: "iddle" | "lifting" | "playing";
  analyserNode: AnalyserNode | null;
  onClose: () => void;
  onMinimize: () => void;
}

export function MusicPlayerFullscreen({
  songs, currentSong, currentIndex, setCurrentIndex,
  isPlaying, togglePlay, handleNext, handlePrev,
  currentTime, duration, handleSeek,
  volume, setVolume, isMuted, setIsMuted,
  isLoading,
  currentTimeRef, progressBarRef, progressFillRef,
  showPlaylist, setShowPlaylist,
  currentLyrics, activeLyricIndex, stylusState,
  analyserNode,
  onClose,
  onMinimize
}: MusicPlayerFullscreenProps) {

  const formatTime = (time: number) => {
    if (time === Infinity || !isFinite(time)) return "LIVE";
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const [lyricOffsets, setLyricOffsets] = useState<{ top: number; height: number }[]>([]);
  const lyricListRef = useRef<HTMLDivElement>(null);

  const measureLyrics = React.useCallback(() => {
    if (lyricListRef.current) {
      const children = Array.from(lyricListRef.current.children) as HTMLElement[];
      const newOffsets = children.map(child => ({
        top: child.offsetTop,
        height: child.offsetHeight
      }));
      setLyricOffsets(newOffsets);
    }
  }, [currentLyrics]);

  React.useLayoutEffect(() => {
    measureLyrics();
    const timer = setTimeout(measureLyrics, 150);
    window.addEventListener('resize', measureLyrics);
    return () => {
      window.removeEventListener('resize', measureLyrics);
      clearTimeout(timer);
    };
  }, [currentLyrics, measureLyrics]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveStateRef = useRef({
    phase: 0,
    smoothLow: 0,
    smoothMid: 0,
    smoothHigh: 0,
    smoothOverall: 0,
  });
  const [dominantColor, setDominantColor] = useState<[number, number, number]>([255, 122, 0]);
  const svgIds = React.useId().replace(/:/g, "");

  useEffect(() => {
    if (!currentSong?.pic) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const sampleCanvas = document.createElement("canvas");
        const sCtx = sampleCanvas.getContext("2d");
        if (!sCtx) return;
        sampleCanvas.width = 8;
        sampleCanvas.height = 8;
        sCtx.drawImage(img, 0, 0, 8, 8);
        const pixels = sCtx.getImageData(0, 0, 8, 8).data;
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          const brightness = r * 0.299 + g * 0.587 + b * 0.114;
          if (brightness > 30 && brightness < 220) {
            rSum += r; gSum += g; bSum += b; count++;
          }
        }
        if (count > 0) {
          const avg = (rSum + gSum + bSum) / (count * 3);
          const boost = 1.3;
          const r = Math.min(255, Math.round(avg + (rSum / count - avg) * boost));
          const g = Math.min(255, Math.round(avg + (gSum / count - avg) * boost));
          const b = Math.min(255, Math.round(avg + (bSum / count - avg) * boost));
          setDominantColor([r, g, b]);
        }
      } catch { }
    };
    img.src = currentSong.pic;
  }, [currentSong?.pic]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio ?? 1, 2) : 1;
    const cssSize = 560;
    canvas.width = Math.round(cssSize * dpr);
    canvas.height = Math.round(cssSize * dpr);
    canvas.style.width = `${cssSize}px`;
    canvas.style.height = `${cssSize}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let rafId: number;
    const state = waveStateRef.current;
    const dataArray = analyserNode ? new Uint8Array(analyserNode.frequencyBinCount) : null;

    const render = () => {
      rafId = requestAnimationFrame(render);
      ctx.clearRect(0, 0, cssSize, cssSize);

      const cx = cssSize / 2;
      const cy = cssSize / 2;
      const [cr, cg, cb] = dominantColor;
      const discR = 190;
      const innerHoleR = discR + 3;
      state.phase += isPlaying ? 0.026 : 0.014;

      if (analyserNode && dataArray) {
        analyserNode.getByteFrequencyData(dataArray);
      }

      let bass = 0.14;
      if (isPlaying && dataArray && dataArray.length > 0) {
        let s = 0;
        const n = Math.min(24, dataArray.length);
        for (let i = 0; i < n; i++) {
          s += dataArray[i]!;
        }
        bass = s / n / 255;
      }

      const binCount = dataArray?.length ?? 1;
      const SEG = 128;

      const ringPoints = (bumpScale: number, phaseShift: number, floorH: number) => {
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i <= SEG; i++) {
          const a = (i / SEG) * Math.PI * 2;
          let w = 0.22;
          if (isPlaying && dataArray) {
            const idx = Math.min(binCount - 1, Math.floor((i / SEG) * binCount));
            w = dataArray[idx]! / 255;
          } else {
            w = 0.16 + 0.14 * Math.sin(state.phase * 1.7 + a * 2.2 + phaseShift);
          }
          const flow = Math.sin(state.phase * 3.4 + a * 5 + phaseShift * 1.3) * (isPlaying ? 0.42 : 0.24);
          // 只做轻微「水纹起伏」，禁止用过小的方位系数（曾导致右侧一整段塌掉）
          const shape = 0.8 + 0.2 * Math.abs(Math.cos(a * 0.5 + phaseShift));
          const h = Math.max(floorH, (w * bumpScale + flow * bumpScale * 0.38) * shape);
          const r = innerHoleR + 10 + h;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          pts.push({ x, y });
        }
        return pts;
      };

      const bumpOut = isPlaying ? 58 + bass * 52 : 28;
      const bumpMid = isPlaying ? 36 + bass * 36 : 16;
      const outerPts = ringPoints(bumpOut, 0, 14);
      const midPts = ringPoints(bumpMid, 0.9, 10);

      const haloR = discR + 48 + bass * 64;
      const halo = ctx.createRadialGradient(cx, cy, discR - 28, cx, cy, haloR + 130);
      halo.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${0.07 + bass * 0.09})`);
      halo.addColorStop(0.38, `rgba(${cr}, ${cg}, ${cb}, ${0.16 + bass * 0.14})`);
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, haloR + 130, 0, Math.PI * 2);
      ctx.fill();

      // 主旋律水波：外圈环形水体（挖空唱片，不挡封面）
      ctx.beginPath();
      ctx.moveTo(outerPts[0]!.x, outerPts[0]!.y);
      for (let i = 1; i <= SEG; i++) {
        ctx.lineTo(outerPts[i]!.x, outerPts[i]!.y);
      }
      ctx.closePath();
      ctx.moveTo(cx + innerHoleR, cy);
      ctx.arc(cx, cy, innerHoleR, 0, Math.PI * 2, true);
      const wGrad = ctx.createRadialGradient(cx, cy, innerHoleR - 8, cx, cy, innerHoleR + bumpOut + 60);
      wGrad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0.12)`);
      wGrad.addColorStop(0.42, `rgba(${cr}, ${cg}, ${cb}, ${isPlaying ? 0.48 : 0.26})`);
      wGrad.addColorStop(0.72, `rgba(${Math.min(255, cr + 35)}, ${Math.min(255, cg + 28)}, ${Math.min(255, cb + 18)}, ${isPlaying ? 0.32 : 0.16})`);
      wGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = wGrad;
      ctx.fill("evenodd");

      // 内层水环（外圈与中圈之间的夹层，增强液体层次）
      ctx.beginPath();
      ctx.moveTo(outerPts[0]!.x, outerPts[0]!.y);
      for (let i = 1; i <= SEG; i++) {
        ctx.lineTo(outerPts[i]!.x, outerPts[i]!.y);
      }
      ctx.closePath();
      ctx.moveTo(midPts[SEG]!.x, midPts[SEG]!.y);
      for (let i = SEG - 1; i >= 0; i--) {
        ctx.lineTo(midPts[i]!.x, midPts[i]!.y);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${isPlaying ? 0.14 : 0.07})`;
      ctx.fill("evenodd");

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      for (let i = 0; i <= SEG; i++) {
        const p = outerPts[i]!;
        if (i === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(${Math.min(255, cr + 45)}, ${Math.min(255, cg + 38)}, ${Math.min(255, cb + 25)}, 0.4)`;
      ctx.lineWidth = 5;
      ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, 0.6)`;
      ctx.shadowBlur = isPlaying ? 22 : 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(255, 255, 255, ${isPlaying ? 0.5 : 0.28})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i <= SEG; i++) {
        const p = midPts[i]!;
        if (i === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${isPlaying ? 0.22 : 0.12})`;
      ctx.lineWidth = 1.1;
      ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, 0.45)`;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    render();
    return () => cancelAnimationFrame(rafId);
  }, [analyserNode, isPlaying, dominantColor]);

  return (
    <motion.div
      layoutId="player-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-0 w-full h-full z-[60] flex flex-col overflow-hidden bg-black text-white"
    >
      {/* 沉浸式情绪背景 (The Immersive Ambient Layer) */}
      {currentSong?.pic && (
        <div className="absolute inset-0 z-0 pointer-events-none group" style={{ WebkitTransform: 'translateZ(0)' }}>
          <div className="absolute inset-[-10%] scale-110 opacity-70 saturate-[1.8] will-change-transform bg-center bg-cover" style={{ backgroundImage: `url(${currentSong.pic})`, filter: 'blur(60px)' }} />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />
        </div>
      )}

      {/* 顶部控制岛 */}
      <div className="fixed top-12 left-12 z-[100] flex items-center gap-4 bg-white/[0.08] backdrop-blur-md px-6 py-3 rounded-[2rem] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.12] transition-colors pointer-events-auto">
        <span className="text-primary-start font-black text-[13px] tracking-widest uppercase mb-[1px]">Hi-Fi</span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-white/90 text-[13px] font-bold tracking-wide mb-[1px]">Premium Audio</span>
      </div>
        
      <div className="fixed top-12 right-12 z-[100] flex items-center gap-2 bg-white/[0.08] backdrop-blur-md px-2 py-1.5 rounded-[2rem] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.12] transition-colors pointer-events-auto">
        <button onClick={onMinimize} title="缩小至迷你模式" className="w-8 h-8 rounded-[1rem] flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95">
          <Minimize2 size={16} />
        </button>
        <div className="w-px h-3 bg-white/20 mx-0.5" />
        <button onClick={onClose} title="隐藏播放器 (后台播放)" className="w-8 h-8 rounded-[1rem] flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500/20 transition-all active:scale-95">
          <X size={18} />
        </button>
      </div>

      {/* 核心中轴面板 */}
      <div className="flex-1 relative z-10 flex w-full max-w-[1600px] mx-auto overflow-hidden py-[10vh]">
        
        {/* 左域 (50%)：唱机 — 固定 560 舞台，避免唱针用「半屏 50%」定位溢出到歌词区 */}
        <div className="w-[50%] h-full flex flex-col items-center justify-center relative min-h-0">
          <div className="relative h-[560px] w-[560px] max-w-full shrink-0 overflow-visible">
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-none -translate-x-1/2 -translate-y-1/2 opacity-70"
              aria-hidden
            />

            <div
              className={`absolute left-1/2 top-1/2 z-10 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0a0a0a] shadow-[0_20px_60px_rgba(0,0,0,0.6)] ring-[8px] ring-white/10 overflow-hidden ${isPlaying ? "animate-[spin_6s_linear_infinite]" : ""}`}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
                style={{
                  background:
                    "repeating-radial-gradient(circle at center, transparent 0px, transparent 3px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 4px)",
                }}
              />
              <div className="pointer-events-none absolute inset-2 rounded-full border border-white/5" />
              <div className="pointer-events-none absolute inset-4 rounded-full border border-white/5" />

              <div className="absolute inset-[15%] overflow-hidden rounded-full border-8 border-[#1a1a1a] shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
                {currentSong ? (
                  <img src={currentSong.pic} alt="" className="h-full w-full object-cover saturate-110" crossOrigin="anonymous" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-900">
                    <ListMusic size={40} className="text-white/10" />
                  </div>
                )}
              </div>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-4 border-white/10 bg-[#111] shadow-inner" />
              </div>
            </div>

            {/* 唱针：对齐网易云 PC 黑胶 — 支点在盘心正上方，曲线力臂落在上右外圈（SVG 与 560 舞台坐标一致） */}
            <svg
              viewBox="0 0 560 560"
              className="pointer-events-none absolute inset-0 z-[21] h-full w-full overflow-visible drop-shadow-[0_10px_24px_rgba(0,0,0,0.5)]"
              aria-hidden
            >
              <defs>
                <linearGradient id={`netease-arm-${svgIds}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fafafa" />
                  <stop offset="40%" stopColor="#e4e4e7" />
                  <stop offset="100%" stopColor="#a1a1aa" />
                </linearGradient>
                <linearGradient id={`netease-base-${svgIds}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f4f4f5" />
                  <stop offset="100%" stopColor="#9ca3af" />
                </linearGradient>
              </defs>
              <g transform="translate(280, 64)">
                <rect
                  x="-44"
                  y="-52"
                  width="88"
                  height="36"
                  rx="10"
                  fill={`url(#netease-base-${svgIds})`}
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="1"
                />
                <circle cx="0" cy="8" r="12" fill="#f4f4f5" stroke="#71717a" strokeWidth="1" />
                <motion.g
                  style={{ transformOrigin: "0px 8px" }}
                  animate={{
                    rotate:
                      stylusState === "playing" ? 15 : stylusState === "lifting" ? 5 : -11,
                  }}
                  transition={{ type: "spring", stiffness: 76, damping: 19, mass: 0.82 }}
                >
                  <path
                    d="M 0 8 C 14 96, 78 118, 138 128 C 152 130, 162 128, 174 122"
                    fill="none"
                    stroke={`url(#netease-arm-${svgIds})`}
                    strokeWidth="3.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <g transform="translate(174, 122) rotate(38)">
                    <rect
                      x="-10"
                      y="-8"
                      width="22"
                      height="30"
                      rx="3"
                      fill="#18181b"
                      stroke="rgba(255,255,255,0.14)"
                      strokeWidth="1"
                    />
                    <rect x="-6" y="-4" width="12" height="3" rx="1" fill="rgba(255,255,255,0.08)" />
                    <line
                      x1="0"
                      y1="16"
                      x2="0"
                      y2="24"
                      stroke="rgba(255,255,255,0.35)"
                      strokeWidth="1"
                      strokeLinecap="round"
                    />
                  </g>
                </motion.g>
              </g>
            </svg>
          </div>
        </div>

        {/* 右域 (50%)：艺术化歌词流 */}
        <div className="w-[50%] h-full flex flex-col items-start relative overflow-hidden group/lyrics pl-8">
          <div className="w-full max-w-[600px] h-full relative">
            <div className="absolute top-[8%] left-0 z-20 pointer-events-none">
              <h1 className="text-5xl font-black text-white/90 tracking-tight drop-shadow-lg mb-4">{currentSong?.title || "未知曲目"}</h1>
              <div className="flex items-center gap-4 text-white/60">
                <span className="text-xl tracking-wide">{currentSong?.author || "Unknown Artist"}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-start" />
                <span className="text-sm px-3 py-1 bg-white/10 rounded-full border border-white/5 backdrop-blur-md shadow-sm">HQ Audio</span>
              </div>
            </div>

            <div 
              className="absolute inset-0 w-full h-full overflow-hidden"
              style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)' }}
            >
              {currentLyrics.length > 0 ? (
                <motion.div 
                  key={`lyrics-full-list-${currentSong?.url}`}
                  ref={lyricListRef}
                  className="absolute inset-x-0 w-full flex flex-col will-change-transform pb-[60vh]"
                  style={{ top: '50%' }}
                  animate={{ 
                    y: lyricOffsets[activeLyricIndex] !== undefined 
                      ? -(lyricOffsets[activeLyricIndex].top + lyricOffsets[activeLyricIndex].height / 2) 
                      : 0 // 初始态强制对齐顶部，防止跳变
                  }} 
                  transition={{ type: "spring", stiffness: 90, damping: 24, mass: 0.7 }}
                >
                  {currentLyrics.map((lyric: any, idx: number) => {
                    const isActive = idx === activeLyricIndex;
                    const isNear = Math.abs(idx - activeLyricIndex) <= 1;
                    const parts = lyric.text.split(/ \/ | \/\/ /);
                    return (
                      <div
                        key={idx} 
                        onClick={() => handleSeek(lyric.time)}
                        className={`min-h-[84px] py-6 shrink-0 flex flex-col items-start justify-center pl-0 transition-all duration-[600ms] cursor-pointer origin-left w-full
                          ${isActive ? 'text-white opacity-100' 
                            : isNear ? 'text-white/60 opacity-60 hover:text-white/80' 
                            : 'text-white/20 opacity-20 hover:text-white/40'}`}
                      >
                        {parts.map((p: string, pi: number) => (
                          <p 
                            key={pi}
                            className={`transition-all duration-500 leading-tight tracking-tight
                              ${isActive 
                                ? (pi === 0 
                                    ? 'text-2xl md:text-3xl font-extrabold drop-shadow-[0_4px_12px_rgba(255,255,255,0.4)]' 
                                    : 'text-base md:text-lg font-semibold mt-3 text-white/70') 
                                : (pi === 0 
                                    ? 'text-xl md:text-2xl font-bold' 
                                    : 'text-sm md:text-base font-medium mt-2 text-white/30')
                              }`}
                          >
                            {p.trim()}
                          </p>
                        ))}
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <div className="w-full h-full flex items-center pl-0 text-white/20 text-2xl font-bold tracking-widest">
                  暂无歌词数据 / Instrumental
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 底域控制台 */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/95 via-black/80 to-transparent z-20 flex flex-col justify-end px-12 pt-16 pb-6">
        <div className="w-full max-w-[1000px] mx-auto mb-4 flex items-center gap-6">
          <span ref={currentTimeRef} className="text-xs text-white/50 min-w-[48px] text-right font-mono">{formatTime(currentTime)}</span>
          <div className="relative group cursor-pointer h-6 flex-1 flex items-center">
            <input 
               ref={progressBarRef} type="range" min="0" max={(duration && isFinite(duration) && duration > 0) ? duration : 100} step="0.1" 
               defaultValue={currentTime || 0} onChange={(e) => handleSeek(Number(e.target.value))} 
               className="absolute z-20 w-full h-full opacity-0 cursor-pointer" 
            />
            <div className="w-full h-1 bg-white/10 rounded-full relative overflow-visible">
              <div ref={progressFillRef} className="absolute top-0 left-0 h-full bg-primary-start rounded-full min-w-[8px] max-w-full pointer-events-none shadow-[0_0_15px_rgba(255,122,0,0.6)]">
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] scale-0 group-hover:scale-100 transition-transform z-10 hidden md:block" />
              </div>
            </div>
          </div>
          <span className="text-xs text-white/30 min-w-[48px] text-left font-mono">{formatTime(duration)}</span>
        </div>

        <div className="w-full max-w-[1000px] mx-auto grid grid-cols-3 items-center h-20 relative pointer-events-auto">
          <div className="flex items-center justify-start gap-4">
            <button className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95 duration-200">
              <Repeat size={20} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95 duration-200">
              <Shuffle size={16} />
            </button>
          </div>
          <div className="flex items-center justify-center gap-8">
            <button onClick={handlePrev} className="w-12 h-12 flex items-center justify-center text-white/70 hover:text-white transition-transform hover:scale-110 active:scale-95">
              <SkipBack size={24} className="fill-current" />
            </button>
            <button onClick={togglePlay} className="w-16 h-16 shrink-0 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all">
              {isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current" />}
            </button>
            <button onClick={handleNext} className="w-12 h-12 flex items-center justify-center text-white/70 hover:text-white transition-transform hover:scale-110 active:scale-95">
              <SkipForward size={24} className="fill-current" />
            </button>
          </div>
          <div className="flex items-center justify-end gap-6 group/vol relative">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsMuted(!isMuted)} className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <div className="w-24 group-hover/vol:w-32 transition-all duration-300 flex items-center h-full">
                <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={(e) => { const v = Number(e.target.value); setVolume(v); if (v > 0) setIsMuted(false); }} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ background: `linear-gradient(to right, #ffffff ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) ${(isMuted ? 0 : volume) * 100}%)` }} />
              </div>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <button onClick={() => setShowPlaylist(!showPlaylist)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${showPlaylist ? 'bg-primary-start/20 text-primary-start' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
              <List size={22} />
            </button>

            <AnimatePresence>
              {showPlaylist && (
                <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed top-0 right-0 w-[420px] h-screen bg-black/90 backdrop-blur-xl border-l border-white/10 overflow-hidden shadow-2xl flex flex-col z-[100]">
                  <div className="px-8 mt-[10vh] pb-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-white font-bold text-2xl tracking-wide">播放队列 <span className="text-primary-start text-sm ml-2">({songs?.length || 0} 首)</span></h2>
                    <button onClick={() => setShowPlaylist(false)} className="text-white/50 hover:text-white transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 hidden-scrollbar">
                    {songs?.map((song: any, idx: number) => (
                      <button key={idx} onClick={() => { setCurrentIndex(idx); }} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${currentIndex === idx ? 'bg-primary-start/20 text-primary-start' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                        <div className="relative shrink-0">
                          <PreloadLazyImage src={song.pic} alt={song.title} className="w-12 h-12 rounded-xl object-cover" crossOrigin="anonymous" />
                          {currentIndex === idx && isPlaying && (
                            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                              <div className="w-4 h-4 flex items-end justify-between gap-0.5">
                                <div className="w-1 bg-white rounded-t-sm animate-[eqBar1_0.8s_ease-in-out_infinite]" style={{ height: '40%' }} />
                                <div className="w-1 bg-white rounded-t-sm animate-[eqBar2_0.6s_ease-in-out_infinite]" style={{ height: '80%' }} />
                                <div className="w-1 bg-white rounded-t-sm animate-[eqBar3_0.7s_ease-in-out_infinite]" style={{ height: '50%' }} />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${currentIndex === idx ? 'text-primary-start' : 'text-white'}`}>{song.title}</p>
                          <p className="text-xs text-white/50 truncate group-hover:text-white/70 transition-colors">{song.author}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

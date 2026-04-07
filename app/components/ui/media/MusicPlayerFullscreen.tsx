import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, ListMusic, X, Volume2, VolumeX, Minimize2, Maximize2, Repeat, Shuffle, List } from "lucide-react";
import { PreloadLazyImage } from "./MusicPlayerMini";

/**
 * 局部态组件 (Component B): 全屏沉浸式流媒体播放舱
 * 设计语言：Apple Music 高强模糊 + 网易云 PC 端巨幕排版
 */
export function MusicPlayerFullscreen({
  songs, currentSong, currentIndex, setCurrentIndex,
  isPlaying, togglePlay, handleNext, handlePrev,
  currentTime, duration, handleSeek,
  volume, setVolume, isMuted, setIsMuted,
  isLoading,
  currentTimeRef, progressBarRef, progressFillRef,
  showPlaylist, setShowPlaylist,
  currentLyrics, activeLyricIndex, stylusState,
  analyserNode, // 大脑传过来的分析器
  onClose,
  onMinimize
}: any) {

  const formatTime = (time: number) => {
    if (time === Infinity || !isFinite(time)) return "LIVE";
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // P5: 歌词动态高度物理偏移系统
  const [lyricOffsets, setLyricOffsets] = useState<{ top: number; height: number }[]>([]);
  const lyricListRef = useRef<HTMLDivElement>(null);

  // 测量歌词行物理位置 (使用 useCallback 保证引用稳定)
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
    // 增加延迟测量以确保换行布局、字体渲染完成
    const timer = setTimeout(measureLyrics, 150);
    
    window.addEventListener('resize', measureLyrics);
    return () => {
      window.removeEventListener('resize', measureLyrics);
      clearTimeout(timer);
    };
  }, [currentLyrics, measureLyrics]);


  // ==================== 网易云级水波纹可视化引擎 ====================
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveStateRef = useRef({
    phase: 0,
    // 平滑后的频谱值（指数衰减阻尼），消除抖动
    smoothLow: 0,
    smoothMid: 0,
    smoothHigh: 0,
    smoothOverall: 0,
  });
  // 从封面图提取的主色调
  const [dominantColor, setDominantColor] = useState<[number, number, number]>([255, 122, 0]);

  // ==================== 封面图色彩提取 ====================
  useEffect(() => {
    if (!currentSong?.pic) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const sampleCanvas = document.createElement("canvas");
        const sCtx = sampleCanvas.getContext("2d");
        if (!sCtx) return;
        // 缩小至 8x8 用于快速色彩取样
        sampleCanvas.width = 8;
        sampleCanvas.height = 8;
        sCtx.drawImage(img, 0, 0, 8, 8);
        const pixels = sCtx.getImageData(0, 0, 8, 8).data;
        // 取所有像素的加权平均色，跳过过暗/过亮像素
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          const brightness = r * 0.299 + g * 0.587 + b * 0.114;
          // 过滤过暗(<30)和过亮(>220)的像素，避免提取到黑/白边
          if (brightness > 30 && brightness < 220) {
            rSum += r; gSum += g; bSum += b; count++;
          }
        }
        if (count > 0) {
          // 轻微提高饱和度：将 RGB 偏移向远离灰度的方向
          const avg = (rSum + gSum + bSum) / (count * 3);
          const boost = 1.3;
          const r = Math.min(255, Math.round(avg + (rSum / count - avg) * boost));
          const g = Math.min(255, Math.round(avg + (gSum / count - avg) * boost));
          const b = Math.min(255, Math.round(avg + (bSum / count - avg) * boost));
          setDominantColor([r, g, b]);
        }
      } catch { /* 跨域失败时保持默认橙色 */ }
    };
    img.src = currentSong.pic;
  }, [currentSong?.pic]);

  // ==================== Canvas 渲染主循环（P1: 查找表 + 半段优化） ====================
  useEffect(() => {
    if (!analyserNode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let rafId: number;
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    const state = waveStateRef.current;
    const SMOOTH = 0.82;
    
    // P1: 预计算三角函数查找表（90段，计算量减半）
    const SEG = 90;
    const cosLUT = new Float32Array(SEG + 1);
    const sinLUT = new Float32Array(SEG + 1);
    for (let j = 0; j <= SEG; j++) {
      const a = (j / SEG) * Math.PI * 2;
      cosLUT[j] = Math.cos(a);
      sinLUT[j] = Math.sin(a);
    }
    
    // P3: 渐变缓存
    let cachedGlowRadius = -1;
    let cachedGradient: CanvasGradient | null = null;
    
    const render = () => {
      rafId = requestAnimationFrame(render);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!isPlaying) return;
      
      analyserNode.getByteFrequencyData(dataArray);
      state.phase += 0.015;
      
      let lowRaw = 0, midRaw = 0, highRaw = 0;
      for (let i = 0; i < 6; i++) lowRaw += dataArray[i];
      for (let i = 6; i < 16; i++) midRaw += dataArray[i];
      for (let i = 16; i < 28; i++) highRaw += dataArray[i];
      lowRaw /= 6; midRaw /= 10; highRaw /= 12;
      
      state.smoothLow = Math.max(state.smoothLow * SMOOTH, lowRaw * (1 - SMOOTH) + state.smoothLow * SMOOTH);
      state.smoothMid = Math.max(state.smoothMid * SMOOTH, midRaw * (1 - SMOOTH) + state.smoothMid * SMOOTH);
      state.smoothHigh = Math.max(state.smoothHigh * SMOOTH, highRaw * (1 - SMOOTH) + state.smoothHigh * SMOOTH);
      state.smoothOverall = (state.smoothLow * 0.5 + state.smoothMid * 0.3 + state.smoothHigh * 0.2);
      
      const { smoothLow, smoothMid, smoothHigh, smoothOverall, phase } = state;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const [cr, cg, cb] = dominantColor;
      
      // 绘制 5 层同心波环（P1: 90 段代替 180 段）
      for (let ri = 0; ri < 5; ri++) {
        const baseRadius = 200 + ri * 18;
        const ringEnergy = ri < 2 ? smoothLow : ri < 4 ? smoothMid : smoothHigh;
        const ne = ringEnergy / 255;
        const wc = 4 + ri;
        const ws = 0.8 + ri * 0.15;
        const ma = (12 - ri * 1.5) * (0.3 + ne * 0.7);
        const alpha = (0.25 - ri * 0.04) * (0.4 + ne * 0.6);
        
        ctx.beginPath();
        for (let j = 0; j <= SEG; j++) {
          const a = (j / SEG) * Math.PI * 2;
          const w1 = Math.sin(a * wc + phase * ws) * ma;
          const w2 = Math.sin(a * (wc + 2) - phase * ws * 1.3) * ma * 0.4;
          const w3 = cosLUT[j] * phase * 0.5 > 0 ? Math.cos(a * 2 + phase * 0.5) * ma * 0.2 : -Math.cos(a * 2 + phase * 0.5) * ma * 0.2;
          const r = baseRadius + w1 + w2 + (Math.cos(a * 2 + phase * 0.5) * ma * 0.2);
          if (j === 0) ctx.moveTo(cx + cosLUT[j] * r, cy + sinLUT[j] * r);
          else ctx.lineTo(cx + cosLUT[j] * r, cy + sinLUT[j] * r);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha.toFixed(3)})`;
        ctx.lineWidth = Math.max(1, 2.5 - ri * 0.3);
        ctx.stroke();
      }
      
      // P3: 渐变缓存复用
      const gi = smoothOverall / 255;
      const gr = Math.round(200 + gi * 30);
      if (gr !== cachedGlowRadius || !cachedGradient) {
        cachedGlowRadius = gr;
        cachedGradient = ctx.createRadialGradient(cx, cy, 160, cx, cy, gr + 80);
        cachedGradient.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${(0.06 * gi).toFixed(3)})`);
        cachedGradient.addColorStop(0.6, `rgba(${cr}, ${cg}, ${cb}, ${(0.03 * gi).toFixed(3)})`);
        cachedGradient.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
      }
      ctx.beginPath();
      ctx.arc(cx, cy, gr + 80, 0, Math.PI * 2);
      ctx.fillStyle = cachedGradient!;
      ctx.fill();
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
      {/* 沉浸式情绪背景 (The Immersive Ambient Layer) - 高色彩穿透滤膜 */}
      {currentSong?.pic && (
        <div className="absolute inset-0 z-0 pointer-events-none group" style={{ WebkitTransform: 'translateZ(0)' }}>
          {/* 放开透明度至 opacity-70 允许强烈色彩渗出，与黑胶网易云光影同频 */}
          <div className="absolute inset-[-10%] scale-110 opacity-70 saturate-[1.8] will-change-transform bg-center bg-cover" style={{ backgroundImage: `url(${currentSong.pic})`, filter: 'blur(60px)' }} />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />
        </div>
      )}

      {/* 顶部控制岛 (Top Islands) - 剥离 Relative 流，使用 Fixed 几何坐标与主导航栏严丝合缝平齐 */}
      <div className="fixed top-12 left-12 z-[100] flex items-center gap-4 bg-white/[0.08] backdrop-blur-md px-6 py-3 rounded-[2rem] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.12] transition-colors pointer-events-auto">
        <span className="text-primary-start font-black text-[13px] tracking-widest uppercase mb-[1px]">Hi-Fi</span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-white/90 text-[13px] font-bold tracking-wide mb-[1px]">Premium Audio</span>
      </div>
        
      {/* 右上角：收紧胶囊外宽，回归苹果系统精致感，剥离臃肿 */}
      <div className="fixed top-12 right-12 z-[100] flex items-center gap-2 bg-white/[0.08] backdrop-blur-md px-2 py-1.5 rounded-[2rem] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.12] transition-colors pointer-events-auto">
        <button onClick={onMinimize} title="缩小至局域卡片" className="w-8 h-8 rounded-[1rem] flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95">
          <Minimize2 size={16} />
        </button>
        <div className="w-px h-3 bg-white/20 mx-0.5" />
        <button onClick={onClose} title="退出全屏并保持播放" className="w-8 h-8 rounded-[1rem] flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500/20 transition-all active:scale-95">
          <X size={18} />
        </button>

      </div>

      {/* 核心中轴：绝对 50-50 切割区，完全居中，不再故意失衡上下排压 */}
      <div className="flex-1 relative z-10 flex w-full max-w-[1600px] mx-auto overflow-hidden py-[10vh]">
        
        {/* 左域 (50%)：神级转机与跳动核 */}
        <div className="w-[50%] h-full flex flex-col items-center justify-center relative">
          <canvas ref={canvasRef} width={600} height={600} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none opacity-80" />
          
          <div className={`relative w-[380px] h-[380px] rounded-full bg-[#0a0a0a] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden ring-[8px] ring-white/10 z-10 ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}>
            {/* P4: 纯 CSS 黑胶沟槽纹理（移除外部 CDN 依赖） */}
            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{ background: 'repeating-radial-gradient(circle at center, transparent 0px, transparent 3px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 4px)' }} />
            <div className="absolute inset-2 border border-white/5 rounded-full pointer-events-none" />
            <div className="absolute inset-4 border border-white/5 rounded-full pointer-events-none" />
            <div className="absolute inset-[15%] rounded-full overflow-hidden border-8 border-[#1a1a1a] shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
              {currentSong ? (
                <img src={currentSong.pic} alt="" className="w-full h-full object-cover saturate-110" crossOrigin="anonymous" />
              ) : (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                  <ListMusic size={40} className="text-white/10" />
                </div>
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full bg-[#111] border-4 border-white/10 shadow-inner" />
            </div>
          </div>

          {/* 大型质感工业唱臂 (拟物化深度重构：配重块 + 复合转轴 + 高精拾音头) */}
          <motion.div
            animate={{ rotate: stylusState === "playing" ? 28 : stylusState === "lifting" ? 10 : 0 }}
            transition={{ type: "spring", stiffness: 35, damping: 20, mass: 1.5 }}
            style={{ transformOrigin: "64px 64px" }} // 绝对中轴支点
            className="absolute top-[12%] left-[calc(50%+190px)] w-32 h-[420px] z-20 pointer-events-none drop-shadow-2xl"
          >
            {/* 后置平衡配重块 (Counterweight) */}
            <div className="absolute top-0 left-12 w-8 h-12 bg-gradient-to-r from-[#888] via-[#eee] to-[#666] rounded-sm border border-white/10 shadow-lg z-10" />
            <div className="absolute top-4 left-10 w-12 h-4 bg-[#222] rounded-full z-10 border border-white/5" />
            
            {/* 核心转轴总成 (Pivot Assembly) */}
            <div className="absolute top-4 left-4 w-24 h-24 rounded-full bg-gradient-to-br from-[#f5f5f5] via-[#a0a0a0] to-[#666] border-[2.5px] border-white/20 shadow-[-5px_10px_20px_rgba(0,0,0,0.5)] z-20" />
            <div className="absolute top-10 left-10 w-12 h-12 rounded-full bg-[#111] border border-white/10 z-30 shadow-[inset_0_2px_8px_rgba(0,0,0,1)] flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-start/60 blur-[1px]" />
            </div>
            
            {/* 唱臂杆体 (Tonearm Tube) */}
            <div className="absolute top-[90px] left-[61px] w-1.5 h-[260px] bg-gradient-to-r from-[#ccc] via-[#fff] to-[#999] rounded-full shadow-[3px_0_12px_rgba(0,0,0,0.4)] z-10" />
            
            {/* 高精拾音头组 (Cartridge & Headshell) */}
            <div className="absolute top-[340px] left-[38px] w-[54px] h-6 bg-gradient-to-b from-[#777] to-[#444] rounded-sm rotate-[22deg] origin-right border-r border-white/20 shadow-md" />
            <div className="absolute top-[355px] left-4 w-12 h-16 bg-gradient-to-br from-[#2a2a2a] via-[#111] to-black rounded-[2px] rotate-[22deg] shadow-[-10px_10px_30px_rgba(0,0,0,0.8)] border border-white/5 flex flex-col items-center pt-2">
              <div className="w-8 h-1 bg-white/10 rounded-full" />
              <div className="w-6 h-0.5 bg-white/5 rounded-full mt-2" />
              <div className="mt-auto mb-2 w-full h-px bg-primary-start/20" />
            </div>
            {/* 针尖悬挂 (Stylus Tip) */}
            <div className="absolute top-[410px] left-[35px] w-0.5 h-4 bg-white/40 rounded-full blur-[0.5px] rotate-[22deg]" />
          </motion.div>

        </div>


        {/* 右域 (50%)：歌词区靠左对齐以收窄左右间距 */}
        <div className="w-[50%] h-full flex flex-col items-start relative overflow-hidden group/lyrics pl-8">
          {/* 安全模具：限制最大宽度为 600px，靠左对齐拉近与 CD 的视觉距离 */}
          <div className="w-full max-w-[600px] h-full relative">
            
            {/* 绝对置顶的抬头信息 */}
            <div className="absolute top-[8%] left-0 z-20 pointer-events-none">
              <h1 className="text-5xl font-black text-white/90 tracking-tight drop-shadow-lg mb-4">{currentSong?.title || "未知曲目"}</h1>
              <div className="flex items-center gap-4 text-white/60">
                <span className="text-xl tracking-wide">{currentSong?.author || "Unknown Artist"}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-start" />
                <span className="text-sm px-3 py-1 bg-white/10 rounded-full border border-white/5 backdrop-blur-md shadow-sm">HQ Audio</span>
              </div>
            </div>

            {/* 全局巨幕滚动手势歌词 - 绝对满屏，绝对50%死锁居中 */}
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
                  // 物理对齐：将当前行的中心点偏移到视口中心。如果尚未测量，退回到估算的线性偏移
                  animate={{ 
                    y: lyricOffsets[activeLyricIndex] !== undefined 
                      ? -(lyricOffsets[activeLyricIndex].top + lyricOffsets[activeLyricIndex].height / 2) 
                      : -(Math.max(0, activeLyricIndex) * 84 + 42)
                  }} 
                  transition={{ type: "spring", stiffness: 90, damping: 24, mass: 0.7 }}
                >
                  {currentLyrics.map((lyric: any, idx: number) => {
                    const isActive = idx === activeLyricIndex;
                    const isNear = Math.abs(idx - activeLyricIndex) <= 1;
                    // 处理翻译内容 (通常 Netease 用 / 或 空格 分隔)
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
                        {/* 强制分层排版：pi=0 为原词(主)，pi>0 为翻译(从) */}
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

      {/* 底域：极简高奢控制台 (The Industrial Console) - 缩减体量释放上方视区 */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/95 via-black/80 to-transparent z-20 flex flex-col justify-end px-12 pt-16 pb-6">
        
        {/* 超长精度音频轨道 */}
        <div className="w-full max-w-[1000px] mx-auto mb-4 flex items-center gap-6">
          <span ref={currentTimeRef} className="text-xs text-white/50 min-w-[48px] text-right font-mono">{formatTime(currentTime)}</span>
          
          <div className="relative group cursor-pointer h-6 flex-1 flex items-center">
            {/* 隐形的大面积原生滚动捕捉 */}
            <input 
               ref={progressBarRef} type="range" min="0" max={(duration && isFinite(duration) && duration > 0) ? duration : 100} step="0.1" 
               defaultValue={currentTime || 0} onChange={(e) => handleSeek(Number(e.target.value))} 
               className="absolute z-20 w-full h-full opacity-0 cursor-pointer" 
            />
            {/* 骨架 */}
            <div className="w-full h-1 bg-white/10 rounded-full relative overflow-visible">
              <div ref={progressFillRef} className="absolute top-0 left-0 h-full bg-primary-start rounded-full min-w-[8px] max-w-full pointer-events-none shadow-[0_0_15px_rgba(255,122,0,0.6)]">
                {/* 显性点球 */}
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] scale-0 group-hover:scale-100 transition-transform z-10 hidden md:block" />
              </div>
            </div>
          </div>
          <span className="text-xs text-white/30 min-w-[48px] text-left font-mono">{formatTime(duration)}</span>
        </div>

        {/* 核心控制中枢：无误差三宫格矩阵，彻底封杀 Baseline 沉降误差 */}
        <div className="w-full max-w-[1000px] mx-auto grid grid-cols-3 items-center h-20 relative pointer-events-auto">
          
          {/* 左侧区：向左推死锚定 */}
          <div className="flex items-center justify-start gap-4">
            <button className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95 duration-200">
              <Repeat size={20} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95 duration-200">
              <Shuffle size={16} />
            </button>
          </div>

          {/* 中央区：物理绝对中轴 */}
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

          {/* 右侧区：向右推死锚定 */}
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

            {/* 桌面级：全屏端侧滑播放列表平窗 (苹果侧边栏逻辑) */}
            <AnimatePresence>
              {showPlaylist && (
                <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed top-0 right-0 w-[420px] h-screen bg-black/90 backdrop-blur-xl border-l border-white/10 overflow-hidden shadow-2xl flex flex-col z-[100]">
                  <div className="px-8 mt-[10vh] pb-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-white font-bold text-2xl tracking-wide">播放队列 <span className="text-primary-start text-sm ml-2">({songs.length} 首)</span></h2>
                    <button onClick={() => setShowPlaylist(false)} className="text-white/50 hover:text-white transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 hidden-scrollbar">
                    {songs.map((song: any, idx: number) => (
                      <button key={idx} onClick={() => { setCurrentIndex(idx); }} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${currentIndex === idx ? 'bg-primary-start/20 text-primary-start' : 'hover:bg-white/10'} group`}>
                        <div className="relative shrink-0">
                          <PreloadLazyImage src={song.pic} alt={song.title} className="w-12 h-12 rounded-xl object-cover" crossOrigin="anonymous" />
                          {currentIndex === idx && isPlaying && (
                            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                              {/* V4: 纯 CSS 动画替代 framer-motion JS 驱动 */}
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

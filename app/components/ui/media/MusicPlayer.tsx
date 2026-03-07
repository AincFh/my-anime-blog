import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, ListMusic, X, Volume2, VolumeX } from "lucide-react";
import { useMusicPlayer, parseLRC } from "~/hooks/useMusicPlayer";

/**
 * MusicPlayer - 专门针对桌面端/大屏幕优化
 * 包含完整的 Web Audio 可视化、Hi-Fi 动效和完整的歌词同步
 */
export function MusicPlayer({ playlistId: externalId }: { playlistId?: string }) {
  const {
    songs,
    currentSong,
    currentIndex,
    setCurrentIndex,
    isPlaying,
    setIsPlaying,
    togglePlay,
    handleNext,
    handlePrev,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    handleSeek,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    isLoading,
    isVisible,
    audioRef
  } = useMusicPlayer(externalId);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentLyrics, setCurrentLyrics] = useState<any[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [stylusState, setStylusState] = useState<"iddle" | "lifting" | "playing">("iddle");
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const activeTrackRef = useRef<HTMLButtonElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 歌词解析
  useEffect(() => {
    if (currentSong?.lrc) {
      setCurrentLyrics(parseLRC(currentSong.lrc));
    } else {
      setCurrentLyrics([]);
    }
  }, [currentSong]);

  // 歌词同步
  useEffect(() => {
    const index = currentLyrics.findIndex((l, i) =>
      l.time <= currentTime && (!currentLyrics[i + 1] || currentLyrics[i + 1].time > currentTime)
    );
    setActiveLyricIndex(index);
  }, [currentTime, currentLyrics]);

  // Web Audio Visualizer (极致性能控制)
  useEffect(() => {
    if (!isPlaying || !audioRef.current) return;

    // 延迟初始化 AudioContext 以应对浏览器自动播放限制
    if (!audioContextRef.current) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const source = ctx.createMediaElementSource(audioRef.current);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyser.connect(ctx.destination);

        audioContextRef.current = ctx;
        analyserRef.current = analyser;
      } catch (e) {
        console.warn("AudioContext failed", e);
        return;
      }
    }

    const update = () => {
      if (analyserRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        setAudioData(new Uint8Array(data));
      }
      animationFrameRef.current = requestAnimationFrame(update);
    };
    update();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying]);

  // 内存守护：卸载时彻底关闭 AudioContext
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, []);

  // 物理状态：唱针
  useEffect(() => {
    if (isPlaying) {
      setStylusState("lifting");
      const timer = setTimeout(() => setStylusState("playing"), 500);
      return () => clearTimeout(timer);
    } else {
      setStylusState("iddle");
    }
  }, [isPlaying]);

  // 强制同步时钟守护线程 (rAF)：不依赖脆弱的 onTimeUpdate 以治愈进度条停摆顽疾
  useEffect(() => {
    let animationFrameId: number;
    const syncAudioState = () => {
      if (audioRef.current) {
        if (!audioRef.current.paused) {
          setCurrentTime(audioRef.current.currentTime);
        }
        if (audioRef.current.duration && audioRef.current.duration !== duration) {
          setDuration(audioRef.current.duration);
        }
      }
      animationFrameId = requestAnimationFrame(syncAudioState);
    };
    animationFrameId = requestAnimationFrame(syncAudioState);
    return () => cancelAnimationFrame(animationFrameId);
  }, [setCurrentTime, setDuration, duration]);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const formatTime = (time: number) => {
    if (time === Infinity || !isFinite(time)) return "LIVE";
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isMounted || !isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 group/player pointer-events-auto hidden md:block">
      {songs.length > 0 && currentSong && (
        <audio 
          ref={audioRef} 
          src={currentSong.url} 
          preload="metadata" 
          crossOrigin="anonymous" 
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={handleNext}
        />
      )}

      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.div
            key="cd-mini"
            initial={{ scale: 0.8, opacity: 0, x: -20 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0.8, opacity: 0, x: -20 }}
            className="relative flex items-center group/mini"
          >
            <div className="absolute -inset-2 bg-black/5 dark:bg-white/5 blur-2xl rounded-full opacity-0 group-hover/mini:opacity-100 transition-opacity duration-500" />

            <button
              onClick={toggleExpand}
              className="relative w-20 h-20 flex items-center justify-center focus:outline-none"
            >
              <div
                className={`relative w-16 h-16 rounded-full bg-[#111] shadow-2xl overflow-hidden ring-4 ring-black/20 dark:ring-white/10 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}
              >
                <div className="absolute inset-[15%] rounded-full overflow-hidden border border-black/50 shadow-inner">
                  {currentSong ? (
                    <img src={currentSong.pic} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <ListMusic size={14} className="text-white/20" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-[#222] border-2 border-white/20 shadow-inner" />
                </div>
              </div>

              {/* 装饰唱针 */}
              <motion.div
                animate={{
                  rotate: stylusState === "playing" ? 8 : stylusState === "lifting" ? 2 : -5,
                  y: stylusState === "lifting" ? -6 : 0,
                  x: stylusState === "playing" ? 2 : 0
                }}
                className="absolute -top-1 -right-3 w-10 h-14 origin-top-right pointer-events-none z-10"
              >
                <div className="absolute top-0 right-2 w-2 h-2 rounded-full bg-slate-400 border border-slate-600 shadow-md" />
                <div className="absolute top-[4px] right-[6px] w-0.5 h-10 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full" />
                <div className="absolute top-[36px] right-0 w-2.5 h-5 bg-slate-500 rounded-sm rotate-[15deg]" />
              </motion.div>

              {/* 加载/播放状态遮罩 */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/mini:bg-black/20 rounded-full transition-colors overflow-hidden">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : !isPlaying && (
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Play size={16} className="text-white fill-white ml-0.5" />
                  </div>
                )}
              </div>
            </button>

            <div className="ml-4 opacity-0 group-hover/mini:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover/mini:translate-x-0 pointer-events-none shrink-0">
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-white/10 px-4 py-2 rounded-2xl shadow-xl">
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{currentSong?.title || "No Track"}</p>
                <p className="text-[10px] text-slate-500 dark:text-white/40 truncate">{currentSong?.author || "Artist"}</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cd-expanded"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-white/30 dark:border-white/10 rounded-[2rem] shadow-2xl transition-all duration-700 ${currentLyrics.length > 0 ? 'w-[680px]' : 'w-[320px]'}`}
          >
            {/* 头部装饰 */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-primary-start/10 rounded-lg">
                  <span className="text-[10px] font-black text-primary-start uppercase tracking-widest">Hi-Fi</span>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-white/80">Premium Audio</span>
              </div>
              <button
                onClick={toggleExpand}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-white/40 dark:hover:text-white/80 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 pt-5 flex gap-8">
              {/* 左侧：可视化唱片 */}
              <div className="w-[280px] shrink-0 space-y-8">
                <div className="relative flex justify-center mt-2 mb-4">

                  {/* 恢复为极简克制的原生同心圆跳动水波纹 */}
                  {isPlaying && audioData && (() => {
                    const lowFreq = Array.from(audioData.slice(0, 10)).reduce((a, b) => a + b, 0) / 10;
                    const midFreq = Array.from(audioData.slice(10, 22)).reduce((a, b) => a + b, 0) / 12;
                    const highFreq = Array.from(audioData.slice(22, 32)).reduce((a, b) => a + b, 0) / 10;
                    
                    // 把缩放限死在一个极为安全的区间（1倍到1.3倍之间），保证绝对不会大屏溢出
                    const scaleL = 1 + Math.min(lowFreq / 500, 0.3); 
                    const scaleM = 1 + Math.min(midFreq / 400, 0.25);
                    const scaleH = 1 + Math.min(highFreq / 300, 0.15);
                    
                    return (
                      <div className="absolute top-1/2 left-1/2 w-0 h-0 z-0 pointer-events-none flex items-center justify-center">
                        {/* 扩散高频环 */}
                        <div 
                          className="absolute w-52 h-52 rounded-full border border-primary-start/10 transition-transform duration-75"
                          style={{ transform: `scale(${scaleH * 1.15})` }}
                        />
                        {/* 脉冲中频环 */}
                        <div 
                          className="absolute w-44 h-44 rounded-full border border-primary-start/30 transition-transform duration-100"
                          style={{ transform: `scale(${scaleM * 1.08})` }}
                        />
                        {/* 深水低频实心柔和核 */}
                        <div 
                          className="absolute w-40 h-40 rounded-full bg-primary-start/5 opacity-80 transition-transform duration-100"
                          style={{ transform: `scale(${scaleL})` }}
                        />
                      </div>
                    );
                  })()}

                  {/* CD 唱片图 (调整为适中尺寸规避拥挤感) */}
                  <div
                    className={`relative w-48 h-48 rounded-full bg-[#111] shadow-2xl overflow-hidden ring-[6px] ring-black/40 dark:ring-white/10 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''} z-10`}
                  >
                    <div className="absolute inset-[15%] rounded-full overflow-hidden border-4 border-[#222]">
                      <img src={currentSong?.pic} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                    </div>
                  </div>

                  {/* 悬臂与唱针 */}
                  <motion.div
                    animate={{
                      rotate: stylusState === "playing" ? 8 : stylusState === "lifting" ? 2 : -5,
                    }}
                    transition={{ type: "spring", stiffness: 45, damping: 15 }}
                    style={{ transformOrigin: "16px 16px" }}
                    className="absolute -top-4 right-2 w-8 h-48 z-20 pointer-events-none drop-shadow-xl"
                  >
                    {/* 唱臂转轴 */}
                    <div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-200 border border-slate-300 shadow-md z-20" />
                    <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-slate-500 border border-slate-600 z-30 shadow-inner" />
                    {/* 唱臂杆 */}
                    <div className="absolute top-4 left-[14px] w-1 h-[140px] bg-gradient-to-r from-slate-300 via-white to-slate-400 rounded-full shadow-sm" />
                    {/* 唱针拾音头连接件 */}
                    <div className="absolute top-[141px] left-[10px] w-2 h-4 bg-slate-400 rounded-sm rotate-[18deg]" />
                    {/* 唱针拾音头 */}
                    <div className="absolute top-[144px] -left-[3px] w-4 h-8 bg-gradient-to-b from-slate-600 to-slate-800 rounded-sm rotate-[18deg] shadow-lg border-t border-slate-500" />
                  </motion.div>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white truncate">{currentSong?.title || "未知曲目"}</h3>
                  <p className="text-xs font-bold text-primary-start uppercase tracking-widest">{currentSong?.author || "Unknown Artist"}</p>
                </div>
              </div>

              {/* 右侧：歌词 */}
              {currentLyrics.length > 0 && (
                <div
                  className="flex-1 h-[280px] overflow-hidden relative"
                  style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)' }}
                >
                  <motion.div
                    className="space-y-4 py-20"
                    animate={{ y: -activeLyricIndex * 42 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  >
                    {currentLyrics.map((lyric, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSeek(lyric.time)}
                        className={`text-[15px] font-bold transition-all duration-500 text-center cursor-pointer hover:text-slate-600 dark:hover:text-white/80 ${idx === activeLyricIndex ? 'text-primary-start scale-[1.15] opacity-100 drop-shadow-md' : 'text-slate-400 dark:text-white/30 opacity-60'}`}
                      >
                        {lyric.text}
                      </div>
                    ))}
                  </motion.div>
                </div>
              )}
            </div>

              {/* 底部控制 */}
            <div className="px-6 pb-6 space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-white/40">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                {(() => {
                  const safeDuration = (duration && isFinite(duration) && !isNaN(duration) && duration > 0) ? duration : 100;
                  const progressPercent = Math.max(0, Math.min((currentTime / safeDuration) * 100, 100)) || 0;
                  return (
                    <div className="relative group cursor-pointer h-4 flex items-center mt-2">
                      <input
                        type="range"
                        min="0"
                        max={safeDuration}
                        step="0.1"
                        value={currentTime || 0}
                        onChange={(e) => handleSeek(Number(e.target.value))}
                        className="absolute z-20 w-full opacity-0 cursor-pointer h-full"
                      />
                      {/* 显性底部细灰色轨道 */}
                      <div className="w-full h-1.5 bg-slate-200/80 dark:bg-white/10 rounded-full relative overflow-visible">
                        {/* 绝对可视化的深色已播放段 (去除会导致渲染掉帧冲突的 transition-all 以保持拖拽即时反馈) */}
                        <div 
                          className="absolute top-0 left-0 h-full bg-primary-start rounded-full min-w-[6px]"
                          style={{ width: `${progressPercent}%` }}
                        >
                          {/* 永不消失的醒目点球指示针 */}
                          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-primary-start group-hover:scale-110 transition-transform z-10" />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between relative">
                {/* 播放列表开关 */}
                <button
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${showPlaylist ? 'bg-primary-start text-white shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}
                >
                  <ListMusic size={18} />
                </button>

                {/* 强化横向居中的中心坐标系限定，缩小 gap 到 6 使左右切歌控件更紧凑不“过宽” */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-6">
                  <button onClick={handlePrev} className="text-slate-400 hover:text-primary-start transition-colors"><SkipBack size={24} className="fill-current" /></button>
                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
                  >
                    {isPlaying ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
                  </button>
                  <button onClick={handleNext} className="text-slate-400 hover:text-primary-start transition-colors"><SkipForward size={24} className="fill-current" /></button>
                </div>

                {/* 音量控制 (垂直向上悬浮抽屉弹窗, 避免挤压同层布局) */}
                <div className="relative flex items-center justify-center shrink-0 group hover:z-50 ml-auto">
                  <div 
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-transparent group-hover:bg-slate-200 dark:group-hover:bg-white/10 transition-colors cursor-pointer text-slate-500 hover:text-slate-700 dark:text-white/60 dark:hover:text-white"
                  >
                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </div>
                  {/* 向上滑出的垂直弹层 */}
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-10 h-32 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-full shadow-2xl opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 flex flex-col items-center justify-center py-4 z-50">
                    <div className="flex-1 w-full flex items-center justify-center">
                      <input
                        type="range"
                        min="0" max="1" step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setVolume(v);
                          if (v > 0) setIsMuted(false);
                        }}
                        className="w-[88px] h-1.5 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-start origin-center -rotate-90 hover:[&::-webkit-slider-thumb]:scale-125 shadow-inner"
                        style={{
                          background: `linear-gradient(to right, #FF7A00 ${(isMuted ? 0 : volume) * 100}%, transparent ${(isMuted ? 0 : volume) * 100}%)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 播放列表抽屉 */}
              <AnimatePresence>
                {showPlaylist && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 180, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-200 dark:border-white/5 -mx-6 px-4 py-4 overflow-y-auto"
                  >
                    {songs.map((song, idx) => (
                      <button
                        key={idx}
                        ref={currentIndex === idx ? activeTrackRef : null}
                        onClick={() => { setCurrentIndex(idx); setIsPlaying(true); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${currentIndex === idx ? 'bg-primary-start/10 text-primary-start' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}
                      >
                        <img src={song.pic} alt="" className="w-10 h-10 rounded-lg object-cover" crossOrigin="anonymous" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{song.title}</p>
                          <p className="text-[10px] opacity-60 truncate">{song.author}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

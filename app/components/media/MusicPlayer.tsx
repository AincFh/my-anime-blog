import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, ListMusic, X, Volume2, VolumeX } from "lucide-react";

interface Song {
  title: string;
  author: string;
  url: string;
  pic: string;
  lrc: string;
}

interface LyricLine {
  time: number;
  text: string;
}

function parseLRC(lrc: string): LyricLine[] {
  if (!lrc) return [];
  const lines = lrc.split("\n");
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d+):(\d+\.\d+)\]/;

  lines.forEach((line) => {
    const match = timeRegex.exec(line);
    if (match) {
      const mins = parseInt(match[1]);
      const secs = parseFloat(match[2]);
      const text = line.replace(timeRegex, "").trim();
      if (text) {
        result.push({ time: mins * 60 + secs, text });
      }
    }
  });

  return result.sort((a, b) => a.time - b.time);
}

const MUSIC_PLAYER_TOGGLE_EVENT = "music-player-toggle";

export function musicPlayerToggle() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MUSIC_PLAYER_TOGGLE_EVENT));
  }
}

export function MusicPlayer({ playlistId: externalId }: { playlistId?: string }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isVisible, setIsVisible] = useState(true);
  const [currentLyrics, setCurrentLyrics] = useState<LyricLine[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [stylusState, setStylusState] = useState<"iddle" | "lifting" | "playing">("iddle");
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const activeTrackRef = useRef<HTMLButtonElement>(null);
  const playlistId = externalId || "13641046209";
  const currentSong = songs[currentIndex];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleToggle = () => {
      setIsVisible((prev) => !prev);
    };
    window.addEventListener(MUSIC_PLAYER_TOGGLE_EVENT, handleToggle);
    return () => window.removeEventListener(MUSIC_PLAYER_TOGGLE_EVENT, handleToggle);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const fetchMusic = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`https://api.i-meto.com/meting/api?server=netease&type=playlist&id=${playlistId}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSongs(data);
          setCurrentIndex(0);
        }
      } catch (err) {
        console.error("Failed to fetch music list", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMusic();
  }, [isMounted, playlistId]);

  useEffect(() => {
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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex, isMuted, volume]);

  useEffect(() => {
    if (showPlaylist && activeTrackRef.current && listContainerRef.current) {
      const timeout = setTimeout(() => {
        activeTrackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [showPlaylist, currentIndex]);

  // LRC 解析与同步
  useEffect(() => {
    if (currentSong?.lrc) {
      setCurrentLyrics(parseLRC(currentSong.lrc));
    } else {
      setCurrentLyrics([]);
    }
  }, [currentIndex, songs]);

  useEffect(() => {
    let index = -1;
    for (let i = 0; i < currentLyrics.length; i++) {
      if (currentLyrics[i].time <= currentTime) {
        index = i;
      } else {
        break;
      }
    }
    setActiveLyricIndex(index);
  }, [currentTime, currentLyrics]);

  // Web Audio Visualizer 逻辑
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying || !audioRef.current) return;

    if (!analyserRef.current) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        const source = ctx.createMediaElementSource(audioRef.current);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        analyserRef.current = analyser;
      } catch (e) {
        console.warn("Visualizer failed to initialize (CORS or AudioContext block)", e);
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

  // 唱针物理状态机
  useEffect(() => {
    if (isPlaying) {
      setStylusState("lifting");
      const timer = setTimeout(() => setStylusState("playing"), 500);
      return () => clearTimeout(timer);
    } else {
      setStylusState("iddle");
    }
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % songs.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
    setIsPlaying(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (audioRef.current) audioRef.current.volume = vol;
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume || 1;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isMounted || !isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[100] group/player pointer-events-auto">
      {songs.length > 0 && currentSong && (
        <audio ref={audioRef} src={currentSong.url} preload="metadata" crossOrigin="anonymous" />
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
            {/* 唱片座/底座 (微影) */}
            <div className="absolute -inset-2 bg-black/5 dark:bg-white/5 blur-2xl rounded-full opacity-0 group-hover/mini:opacity-100 transition-opacity duration-500" />

            <button
              onClick={toggleExpand}
              className="relative w-20 h-20 flex items-center justify-center focus:outline-none"
            >
              {/* 唱片本体 (Vinyl Record) */}
              <motion.div
                animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                transition={{
                  duration: 4,
                  repeat: isPlaying ? Infinity : 0,
                  ease: "linear",
                }}
                className="relative w-16 h-16 rounded-full bg-[#111] shadow-2xl overflow-hidden ring-4 ring-black/20 dark:ring-white/10"
              >
                {/* 唱片纹理 (Grooves) */}
                <div className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle,transparent_0,transparent_1px,rgba(255,255,255,0.03)_1.5px,rgba(255,255,255,0.03)_2px)]" />
                <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0,rgba(255,255,255,0.05)_45deg,transparent_90deg,rgba(255,255,255,0.05)_135deg,transparent_180deg,rgba(255,255,255,0.05)_225deg,transparent_270deg,rgba(255,255,255,0.05)_315deg,transparent_360deg)]" />

                {/* 中心图片 (Album Art) */}
                <div className="absolute inset-[15%] rounded-full overflow-hidden border border-black/50 shadow-inner">
                  {currentSong ? (
                    <img src={currentSong.pic} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <ListMusic size={14} className="text-white/20" />
                    </div>
                  )}
                </div>

                {/* 中心孔 (Spindle Hole) */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#222] border border-white/20 shadow-inner" />
                </div>
              </motion.div>

              {/* 唱针 (Stylus/Needle) - 修正定位以确保能够触及唱片 */}
              <motion.div
                initial={false}
                animate={{
                  rotate: stylusState === "playing" ? 28 : stylusState === "lifting" ? 18 : 0,
                  y: stylusState === "lifting" ? -6 : 0,
                  x: stylusState === "playing" ? 4 : 0
                }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="absolute -top-1 -right-3 w-10 h-14 origin-top-right pointer-events-none z-10"
              >
                <div className="absolute top-0 right-2 w-2 h-2 rounded-full bg-slate-400 border border-slate-600 shadow-md" />
                <div className="absolute top-[4px] right-[6px] w-0.5 h-10 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full" />
                <div className="absolute top-[36px] right-0 w-2.5 h-5 bg-slate-500 rounded-sm rotate-[15deg] border border-slate-400/50 shadow-lg" />
              </motion.div>

              {/* 播放/加载状态浮层 */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/mini:bg-black/20 rounded-full transition-colors overflow-hidden">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : !isPlaying && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
                  >
                    <Play size={16} className="text-white fill-white ml-0.5" />
                  </motion.div>
                )}
              </div>
            </button>

            {/* 迷你信息预览 (悬浮展示) */}
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
            className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-white/30 dark:border-white/10 rounded-[2.5rem] shadow-2xl transition-all duration-700 ${currentLyrics.length > 0 ? 'w-[720px]' : 'w-[380px]'}`}
          >
            {/* 顶部装饰栏 */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/20 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-primary-start/10 rounded-lg">
                  <span className="text-[10px] font-black text-primary-start uppercase tracking-widest">Hi-Fi</span>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-white/80">Premium Audio</span>
              </div>
              <button
                onClick={toggleExpand}
                className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-white/40 hover:bg-slate-300 dark:hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 pt-8 flex gap-8">
              {/* 左侧：唱片与详情 */}
              <div className="w-[280px] shrink-0 space-y-6">
                <div className="relative flex justify-center">
                  <motion.div
                    animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 10, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
                    className="relative w-48 h-48 rounded-full bg-[#111] shadow-2xl shadow-black/40 ring-8 ring-white/10 dark:ring-white/5 group/vinyl overflow-hidden"
                  >
                    {/* Aurora Visualizer (环形频谱) */}
                    <AnimatePresence>
                      {isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 rounded-full bg-primary-start/40"
                              style={{
                                rotate: i * 30,
                                transformOrigin: "center 100px",
                                height: audioData ? `${Math.max(10, audioData[i % audioData.length] / 3)}px` : '10px'
                              }}
                              animate={{
                                opacity: [0.3, 0.6, 0.3],
                                filter: ["blur(1px)", "blur(2px)", "blur(1px)"]
                              }}
                              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                            />
                          ))}
                        </div>
                      )}
                    </AnimatePresence>

                    {/* 唱片图层 */}
                    <div className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle,transparent_0,transparent_1px,rgba(255,255,255,0.02)_1.5px,rgba(255,255,255,0.02)_2px)]" />
                    <div className="absolute inset-[12%] rounded-full overflow-hidden border-4 border-[#222]">
                      <img src={currentSong?.pic} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-[#111] border-2 border-white/20" />
                    </div>
                  </motion.div>

                  {/* 唱针部件 - 细化物理反馈并确保能够压在唱盘上 */}
                  <motion.div
                    animate={{
                      rotate: stylusState === "playing" ? 22 : stylusState === "lifting" ? 12 : 0,
                      y: stylusState === "lifting" ? -12 : 0,
                      x: stylusState === "playing" ? 6 : 0,
                      filter: stylusState === "lifting" ? "drop-shadow(8px 15px 15px rgba(0,0,0,0.4))" : "drop-shadow(2px 4px 4px rgba(0,0,0,0.2))"
                    }}
                    transition={{ type: "spring", stiffness: 80, damping: 12 }}
                    className="absolute -top-6 -right-6 w-24 h-28 origin-top-right z-10 pointer-events-none"
                  >
                    <div className="absolute top-0 right-3 w-4 h-4 rounded-full bg-slate-400 border-2 border-slate-600 shadow-lg" />
                    <div className="absolute top-4 right-4 w-1.5 h-24 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full" />
                    <div className="absolute bottom-0 right-0 w-6 h-12 bg-gradient-to-br from-slate-500 to-slate-800 rounded-md border border-slate-400/50 shadow-inner overflow-hidden">
                      <div className="w-full h-1.5 bg-white/10" />
                    </div>
                  </motion.div>
                </div>

                {/* 歌曲详情 */}
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white truncate">{currentSong?.title || "未知曲目"}</h3>
                  <p className="text-xs font-bold text-primary-start uppercase tracking-widest">{currentSong?.author || "Unknown Artist"}</p>
                </div>
              </div>

              {/* 右侧：歌词屏 (Conditional) */}
              <AnimatePresence>
                {currentLyrics.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 h-[280px] overflow-hidden relative group/lyrics"
                  >
                    <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/70 dark:from-slate-900/70 to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/70 dark:from-slate-900/70 to-transparent z-10 pointer-events-none" />

                    <motion.div
                      className="space-y-4 py-20"
                      animate={{ y: -activeLyricIndex * 40 }}
                      transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    >
                      {currentLyrics.map((lyric, idx) => (
                        <div
                          key={idx}
                          className={`text-sm font-bold transition-all duration-500 text-center ${idx === activeLyricIndex ? 'text-primary-start scale-110 blur-0 opacity-100' : 'text-slate-400 dark:text-white/20 blur-[1px] opacity-40'}`}
                        >
                          {lyric.text}
                          {idx === activeLyricIndex && (
                            <motion.div
                              layoutId="lyricLine"
                              className="w-8 h-0.5 bg-primary-start mx-auto mt-1 rounded-full"
                            />
                          )}
                        </div>
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="px-6 pb-8 space-y-6">
              {/* 进度控制 */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-white/30 px-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="relative group/seeker px-1">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-start [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-slate-800 transition-all"
                  />
                  <div
                    className="absolute top-0 left-1 h-1.5 bg-gradient-to-r from-primary-start to-primary-end rounded-full pointer-events-none"
                    style={{ width: `calc(${(currentTime / (duration || 1)) * 100}% - 8px)` }}
                  />
                </div>
              </div>

              {/* 播放控制 */}
              <div className="flex items-center justify-between px-2">
                <button
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${showPlaylist ? 'bg-primary-start text-white shadow-lg shadow-primary-start/30' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                >
                  <ListMusic size={18} />
                </button>

                <div className="flex-1 flex justify-center">
                  <div className="flex items-center gap-5">
                    <button onClick={handlePrev} className="w-10 h-10 rounded-full text-slate-400 dark:text-white/30 hover:text-primary-start transition-colors flex items-center justify-center">
                      <SkipBack size={20} className="fill-current" />
                    </button>
                    <button
                      onClick={togglePlay}
                      className="w-14 h-14 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      {isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
                    </button>
                    <button onClick={handleNext} className="w-10 h-10 rounded-full text-slate-400 dark:text-white/30 hover:text-primary-start transition-colors flex items-center justify-center">
                      <SkipForward size={20} className="fill-current" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={toggleMute}
                  className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors ml-auto"
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>

              {/* 播放列表抽屉 */}
              <AnimatePresence>
                {showPlaylist && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 200, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-200 dark:border-white/5 -mx-6 px-4 py-2 overflow-y-auto custom-scrollbar"
                  >
                    {songs.map((song, idx) => (
                      <button
                        key={idx}
                        ref={currentIndex === idx ? activeTrackRef : null}
                        onClick={() => { setCurrentIndex(idx); setIsPlaying(true); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left group/item ${currentIndex === idx ? 'bg-primary-start/10 text-primary-start' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-white/50'}`}
                      >
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                          <img src={song.pic} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                          {currentIndex === idx && isPlaying && (
                            <div className="absolute inset-0 bg-primary-start/40 flex items-center justify-center gap-0.5">
                              <motion.div animate={{ height: [4, 10, 4] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-0.5 bg-white rounded-full" />
                              <motion.div animate={{ height: [8, 4, 8] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-0.5 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
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

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); }
      `}} />
    </div>
  );
}

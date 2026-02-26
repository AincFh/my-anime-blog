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

  const audioRef = useRef<HTMLAudioElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const activeTrackRef = useRef<HTMLButtonElement>(null);
  const playlistId = externalId || "13641046209";

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

  const currentSong = songs[currentIndex];

  return (
    <div className="fixed bottom-6 left-6 z-[100] group/player pointer-events-auto">
      {songs.length > 0 && currentSong && (
        <audio ref={audioRef} src={currentSong.url} preload="metadata" />
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

              {/* 唱针 (Stylus/Needle) */}
              <motion.div
                initial={false}
                animate={{ rotate: isPlaying ? 25 : 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="absolute top-0 right-1 w-8 h-12 origin-top-right pointer-events-none z-10"
              >
                <div className="absolute top-0 right-1 w-1.5 h-1.5 rounded-full bg-slate-400 border border-slate-600 shadow-sm" />
                <div className="absolute top-[3px] right-[4px] w-0.5 h-8 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full" />
                <div className="absolute top-[30px] right-[2px] w-2 h-4 bg-slate-500 rounded-sm rotate-12 border border-slate-400/50" />
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
            className="w-80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-white/30 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
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

            <div className="p-6 pt-8 space-y-6">
              {/* 核心唱片区 (Expanded Record) */}
              <div className="relative flex justify-center">
                <motion.div
                  animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 10, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
                  className="relative w-48 h-48 rounded-full bg-[#111] shadow-2xl shadow-black/40 ring-8 ring-white/10 dark:ring-white/5 group/vinyl overflow-hidden"
                >
                  <div className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle,transparent_0,transparent_1px,rgba(255,255,255,0.02)_1.5px,rgba(255,255,255,0.02)_2px)]" />
                  <div className="absolute inset-[12%] rounded-full overflow-hidden border-4 border-[#222]">
                    <img src={currentSong?.pic} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-[#111] border-2 border-white/20" />
                  </div>
                </motion.div>

                {/* 唱针部件 */}
                <motion.div
                  animate={{ rotate: isPlaying ? 22 : 0 }}
                  className="absolute -top-4 -right-4 w-20 h-24 origin-top-right z-10 pointer-events-none"
                >
                  <div className="absolute top-0 right-2 w-3 h-3 rounded-full bg-slate-400 border-2 border-slate-600 shadow-md" />
                  <div className="absolute top-3 right-3 w-1 h-20 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full" />
                  <div className="absolute bottom-0 right-0 w-4 h-8 bg-slate-500 rounded-md border border-slate-400 shadow-inner" />
                </motion.div>
              </div>

              {/* 歌曲详情 */}
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-slate-800 dark:text-white truncate">{currentSong?.title || "未知曲目"}</h3>
                <p className="text-xs font-bold text-primary-start uppercase tracking-widest">{currentSong?.author || "Unknown Artist"}</p>
              </div>

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

                <div className="flex items-center gap-4">
                  <button onClick={handlePrev} className="w-10 h-10 rounded-full text-slate-400 dark:text-white/30 hover:text-primary-start transition-colors">
                    <SkipBack size={20} className="fill-current" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    {isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
                  </button>
                  <button onClick={handleNext} className="w-10 h-10 rounded-full text-slate-400 dark:text-white/30 hover:text-primary-start transition-colors">
                    <SkipForward size={20} className="fill-current" />
                  </button>
                </div>

                <button
                  onClick={toggleMute}
                  className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
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

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ListMusic } from "lucide-react";

interface Song {
  title: string;
  author: string;
  url: string;
  pic: string;
}

export function AdminMusicPlayer({ playlistId = "13641046209" }: { playlistId?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchMusic = async () => {
      if (!playlistId) return;
      try {
        setIsLoading(true);
        const res = await fetch(`https://api.i-meto.com/meting/api?server=netease&type=playlist&id=${playlistId}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && isMounted) {
          setSongs(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMusic();
    return () => { isMounted = false; };
  }, [playlistId]);

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleDurationChange);
    audio.addEventListener("ended", handleNext);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleDurationChange);
      audio.removeEventListener("ended", handleNext);
    };
  }, [currentIndex, songs]);

  useEffect(() => {
    if (!audioRef.current && songs.length > 0) {
      audioRef.current = new Audio(songs[currentIndex].url);
      audioRef.current.volume = isMuted ? 0 : volume;
      const handleEnded = () => handleNext();
      audioRef.current.addEventListener("ended", handleEnded);
    }
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
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleNext = () => {
    if (songs.length === 0) return;
    const next = (currentIndex + 1) % songs.length;
    setCurrentIndex(next);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = songs[next].url;
      if (isPlaying) {
        audioRef.current.play().catch(() => { });
      }
    }
  };

  const handlePrev = () => {
    if (songs.length === 0) return;
    const prev = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentIndex(prev);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = songs[prev].url;
      if (isPlaying) {
        audioRef.current.play().catch(() => { });
      }
    }
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

  const currentSong = songs[currentIndex];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full px-2">
      <div className="relative group/admin-player bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-violet-500/30">
        {/* 精致流光边框 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/30 to-transparent" />

        {/* 核心展示区 */}
        <div className="p-4 relative">
          <div className="flex items-center gap-4">
            {/* 迷你控制中心 (黑胶外层) */}
            <div className="relative shrink-0 group/disc-outer">
              <motion.div
                animate={isPlaying ? {
                  rotate: 360,
                  boxShadow: [
                    "0 0 15px rgba(139, 92, 246, 0.2)",
                    "0 0 30px rgba(139, 92, 246, 0.4)",
                    "0 0 15px rgba(139, 92, 246, 0.2)"
                  ]
                } : {
                  rotate: 0,
                  boxShadow: "0 0 10px rgba(0,0,0,0.3)"
                }}
                transition={{
                  rotate: { duration: 6, repeat: isPlaying ? Infinity : 0, ease: "linear" },
                  boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }}
                className="w-14 h-14 rounded-full bg-black ring-1 ring-white/10 relative overflow-hidden flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                onClick={togglePlay}
              >
                {currentSong?.pic ? (
                  <img src={currentSong.pic} alt="" className="w-full h-full object-cover opacity-90 transition-opacity" crossOrigin="anonymous" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                    <ListMusic size={20} className="text-white/10" />
                  </div>
                )}
                {/* 黑胶拉丝纹理 */}
                <div className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle,transparent_0,transparent_1.5px,rgba(255,255,255,0.02)_1.8px,rgba(255,255,255,0.02)_2px)] pointer-events-none" />
                <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0,rgba(255,255,255,0.05)_90deg,transparent_180deg,rgba(255,255,255,0.05)_270deg,transparent_360deg)] pointer-events-none" />

                {/* 中心轴 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-white/20 shadow-inner z-10" />
                </div>
              </motion.div>

              {/* 播放状态的小点 */}
              {isPlaying && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full border-2 border-[#000]"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              )}
            </div>

            {/* 歌曲导视区 */}
            <div className="flex-1 min-w-0">
              <div className="overflow-hidden whitespace-nowrap relative">
                <motion.h4
                  animate={isPlaying && (currentSong?.title?.length || 0) > 10 ? { x: [0, -120, 0] } : { x: 0 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="inline-block text-[13px] font-bold text-white tracking-tight pr-10"
                >
                  {isLoading ? "Synchronizing Matrix..." : currentSong?.title || "System Idle"}
                </motion.h4>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-violet-400 font-mono uppercase tracking-tighter opacity-80">
                  {currentSong?.author || "Aincrad Archive"}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <span className="text-[9px] text-white/30 font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* 紧凑频谱仪 */}
            <div className="flex gap-0.5 items-end h-5 px-1 pb-1">
              {[0.4, 0.8, 0.6, 0.9, 0.5].map((d, i) => (
                <motion.div
                  key={i}
                  animate={isPlaying ? { height: ["20%", "100%", "30%"] } : { height: "20%" }}
                  transition={{ repeat: Infinity, duration: d + 0.3, ease: "easeInOut", delay: i * 0.1 }}
                  className="w-1 bg-gradient-to-t from-violet-600/80 to-fuchsia-400/80 rounded-full"
                />
              ))}
            </div>
          </div>

          {/* 交互控制层 */}
          <div className="mt-5 flex items-center justify-between gap-4">
            {/* 极简进度条 */}
            <div className="flex-1 relative group/progress-bar pt-1">
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-400"
                  style={{ width: `${progress}%`, boxShadow: "0 0 10px rgba(139, 92, 246, 0.4)" }}
                />
              </div>
              <input
                type="range"
                min="0" max={duration || 100} value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handlePrev} className="text-white/30 hover:text-white transition-colors">
                <SkipBack size={14} />
              </button>
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-white text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                {isPlaying ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current ml-0.5" />}
              </button>
              <button onClick={handleNext} className="text-white/30 hover:text-white transition-colors">
                <SkipForward size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* 底部扩展 (列表项悬浮展示) */}
        <div className="px-4 py-2 bg-white/5 flex items-center justify-between border-t border-white/5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-violet-400 transition-colors"
          >
            <ListMusic size={12} />
            DATABASE INDEX
          </button>
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-white/30 hover:text-white transition-colors">
              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
            <input
              type="range" min="0" max="1" step="0.1" value={volume}
              onChange={handleVolumeChange}
              className="w-12 h-1 accent-violet-500 bg-white/10 rounded-full appearance-none cursor-pointer"
            />
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 160 }}
              exit={{ height: 0 }}
              className="overflow-y-auto bg-slate-950/80 custom-scrollbar divide-y divide-white/5"
            >
              {songs.map((song, idx) => (
                <button
                  key={idx}
                  onClick={() => { setCurrentIndex(idx); setIsPlaying(true); }}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-all ${currentIndex === idx ? 'bg-violet-500/10' : 'hover:bg-white/5'}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-black/40 overflow-hidden shrink-0 border border-white/5">
                    <img src={song.pic} alt="" className="w-full h-full object-cover opacity-60" crossOrigin="anonymous" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-bold truncate ${currentIndex === idx ? 'text-violet-400' : 'text-white/60'}`}>
                      {idx.toString().padStart(2, '0')}. {song.title}
                    </p>
                    <p className="text-[9px] text-white/20 mt-0.5 truncate">{song.author}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.2); border-radius: 10px; }
      `}} />
    </div>
  );
}

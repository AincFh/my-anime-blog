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
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
        {/* 核心展示区 */}
        <div className="p-3">
          <div className="flex items-center gap-3">
            {/* 迷你封面旋转 - 增加呼吸感和发光 */}
            <motion.div
              animate={isPlaying ? { 
                rotate: 360,
                boxShadow: [
                  "0 0 10px rgba(139, 92, 246, 0.2)",
                  "0 0 20px rgba(139, 92, 246, 0.4)",
                  "0 0 10px rgba(139, 92, 246, 0.2)"
                ]
              } : { 
                rotate: 0,
                boxShadow: "0 0 5px rgba(0,0,0,0.2)"
              }}
              transition={{ 
                rotate: { duration: 4, repeat: isPlaying ? Infinity : 0, ease: "linear" },
                boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              className="w-12 h-12 rounded-full bg-[#111] ring-2 ring-violet-500/40 shrink-0 relative overflow-hidden group/disc cursor-pointer"
              onClick={togglePlay}
            >
              {currentSong ? (
                <img src={currentSong.pic} alt="" className="w-full h-full object-cover opacity-80 group-hover/disc:opacity-100 transition-opacity" crossOrigin="anonymous" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ListMusic size={16} className="text-white/20" />
                </div>
              )}
              {/* 唱盘纹路细节 */}
              <div className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle,transparent_0,transparent_1px,rgba(255,255,255,0.03)_1.5px,rgba(255,255,255,0.03)_2px)] pointer-events-none" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-[#111] border border-white/30 shadow-inner" />
              </div>
            </motion.div>

            {/* 歌曲信息 - 引入跑马灯 (Marquee) */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="overflow-hidden whitespace-nowrap relative group/marquee">
                <motion.h4 
                  animate={isPlaying && (currentSong?.title?.length || 0) > 12 ? { x: [0, -100, 0] } : { x: 0 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="inline-block text-[12px] font-black text-white pr-8"
                >
                  {isLoading ? "Synchronizing..." : currentSong?.title || "No Signal"}
                </motion.h4>
              </div>
              <p className="text-[9px] text-violet-400/60 font-orbitron uppercase tracking-widest mt-0.5">
                {currentSong?.author || "Aincrad Archive"}
              </p>
            </div>

            {/* 视觉动向指示器 (更加精致的波形) */}
            {isPlaying && (
              <div className="flex gap-0.5 items-end h-4 px-1">
                {[0.4, 0.7, 0.5, 0.8].map((d, i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: ["20%", "100%", "20%"] }} 
                    transition={{ repeat: Infinity, duration: d + 0.2, ease: "easeInOut" }} 
                    className="w-0.5 bg-gradient-to-t from-violet-600 to-fuchsia-400 rounded-full" 
                  />
                ))}
              </div>
            )}
          </div>

          {/* 进度条 (玻璃拟态增强) */}
          <div className="mt-4 group/progress relative">
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              />
            </div>
            {/* 隐形点击层 */}
            <input 
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>

          {/* 精密控制按钮组 */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1, x: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePrev}
                disabled={songs.length === 0}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all disabled:opacity-20"
              >
                <SkipBack size={14} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePlay}
                disabled={songs.length === 0}
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all disabled:opacity-50 relative overflow-hidden group/play"
              >
                <div className="absolute inset-0 bg-white/0 group-hover/play:bg-white/10 transition-colors" />
                {isPlaying ? <Pause size={18} className="fill-current relative z-10" /> : <Play size={18} className="fill-current ml-0.5 relative z-10" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1, x: 2 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleNext}
                disabled={songs.length === 0}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all disabled:opacity-20"
              >
                <SkipForward size={14} />
              </motion.button>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={toggleMute} 
                className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/30 hover:text-violet-400 transition-colors"
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <div className="px-2 py-1 rounded bg-black/40 border border-white/5">
                <span className="text-[10px] font-mono text-violet-300/80 tracking-tighter">{formatTime(currentTime)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 底部功能栏 (播放列表预览) */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-1.5 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-1.5 border-t border-white/5 transition-colors"
        >
          <ListMusic size={10} className="text-white/40" />
          <span className="text-[10px] text-white/30 font-medium">Playlist ({songs.length})</span>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 120 }}
              exit={{ height: 0 }}
              className="overflow-y-auto custom-scrollbar bg-black/20"
            >
              {songs.map((song, idx) => (
                <button
                  key={idx}
                  onClick={() => { setCurrentIndex(idx); setIsPlaying(true); }}
                  className={`w-full flex items-center gap-2 p-2 px-3 text-left transition-colors ${currentIndex === idx ? 'bg-violet-500/20 border-l-2 border-violet-500' : 'hover:bg-white/5'}`}
                >
                  <div className="w-6 h-6 rounded bg-black/40 overflow-hidden shrink-0">
                    <img src={song.pic} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] truncate ${currentIndex === idx ? 'text-violet-300 font-bold' : 'text-white/50'}`}>{song.title}</p>
                    <p className="text-[8px] text-white/20 truncate">{song.author}</p>
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

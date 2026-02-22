import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, ListMusic, X } from "lucide-react";

interface Song {
  title: string;
  author: string;
  url: string;
  pic: string;
  lrc: string;
}

export function MusicPlayer({ playlistId: externalId }: { playlistId?: string }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showList, setShowList] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLock, setIsLock] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const activeTrackRef = useRef<HTMLButtonElement>(null);
  const playlistId = externalId || "13641046209";

  useEffect(() => {
    setIsMounted(true);
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
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex]);

  // Scroll into view logic
  useEffect(() => {
    if (showList) {
      // Provide a small delay to ensure DOM is ready and animations started
      const timeout = setTimeout(() => {
        if (activeTrackRef.current && listContainerRef.current) {
          activeTrackRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [showList, currentIndex]);

  const togglePlay = () => {
    if (isLock) return;
    setIsLock(true);
    setIsPlaying(!isPlaying);
    setTimeout(() => setIsLock(false), 300);
  };

  const handleNext = () => {
    if (isLock) return;
    setIsLock(true);
    setCurrentIndex((prev) => (prev + 1) % songs.length);
    setIsPlaying(true);
    setTimeout(() => setIsLock(false), 300);
  };

  const handlePrev = () => {
    if (isLock) return;
    setIsLock(true);
    setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
    setIsPlaying(true);
    setTimeout(() => setIsLock(false), 300);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  if (!isMounted) return null;

  const currentSong = songs[currentIndex];

  return (
    <div className="fixed bottom-6 left-6 z-[100] w-72 group/player pointer-events-auto">
      {songs.length > 0 && currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.url}
          preload="metadata"
        />
      )}

      {/* 迷你控制条形态 - 胶囊悬浮形态 */}
      <div className="w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:ring-2 hover:ring-primary-start/30">

        {/* 顶部进度条 */}
        <div className="w-full h-1 bg-black/20 group relative cursor-pointer">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div
            className="h-full bg-gradient-to-r from-primary-start to-primary-end pointer-events-none transition-all duration-100 group-hover:from-primary-start group-hover:to-primary-end"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
        </div>

        <div className="p-3">
          {!currentSong ? (
            <div className="h-10 flex items-center justify-center text-xs opacity-50">
              {isLoading ? "Loading..." : "No track"}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* 封面与播放动画 */}
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-md">
                <img
                  src={currentSong.pic}
                  alt={currentSong.title}
                  className={`w-full h-full object-cover transition-transform duration-[10s] ease-linear ${isPlaying ? 'scale-125' : 'scale-100'}`}
                  crossOrigin="anonymous"
                />
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-[2px]">
                    <motion.div animate={{ height: ["40%", "100%", "40%"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-white rounded-full" />
                    <motion.div animate={{ height: ["80%", "30%", "80%"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-white rounded-full" />
                    <motion.div animate={{ height: ["50%", "100%", "50%"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-white rounded-full" />
                  </div>
                )}
              </div>

              {/* 曲目信息 */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="text-sm font-semibold text-white/90 truncate tracking-tight">{currentSong.title}</div>
                <div className="text-[10px] text-white/50 truncate uppercase tracking-wider">{currentSong.author}</div>
              </div>

              {/* 控制组 */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={togglePlay} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/80 hover:bg-primary-start/20 hover:text-primary-start transition-colors">
                  {isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />}
                </button>
                <button onClick={() => setShowList(!showList)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${showList ? 'bg-primary-start/20 text-primary-start' : 'bg-transparent text-white/50 hover:bg-white/5 hover:text-white/80'}`}>
                  {showList ? <X size={14} /> : <ListMusic size={14} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 弹出的播放列表 (吸附组件上方) */}
      <AnimatePresence>
        {showList && songs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-[calc(100%+8px)] left-0 w-full bg-[#1e293b]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col"
          >
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-black/20">
              <span className="text-xs font-bold text-white/60 uppercase tracking-widest pl-1">Playlist</span>
              <span className="text-[10px] font-mono text-white/40">{songs.length} Tracks</span>
            </div>

            <div
              ref={listContainerRef}
              className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar space-y-1"
            >
              {songs.map((song, idx) => (
                <button
                  key={idx}
                  ref={currentIndex === idx ? activeTrackRef : null}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group
                    ${currentIndex === idx
                      ? 'bg-primary-start/15 border border-primary-start/20'
                      : 'hover:bg-white/5 border border-transparent'}`}
                >
                  <img src={song.pic} alt="" className={`w-8 h-8 rounded-lg object-cover flex-shrink-0 transition-transform ${currentIndex === idx && isPlaying ? 'scale-110 shadow-[0_0_10px_rgba(255,159,67,0.5)]' : 'group-hover:scale-105'}`} crossOrigin="anonymous" />
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs truncate ${currentIndex === idx ? 'font-bold text-primary-start' : 'font-medium text-white/80'}`}>
                      {song.title}
                    </div>
                    <div className={`text-[10px] truncate ${currentIndex === idx ? 'text-primary-start/70' : 'text-white/40'}`}>
                      {song.author}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 159, 67, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 159, 67, 0.5);
        }
      `}} />
    </div>
  );
}

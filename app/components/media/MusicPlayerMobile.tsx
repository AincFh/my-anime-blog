import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, X, ListMusic, Volume2, VolumeX } from "lucide-react";

interface Song {
  title: string;
  author: string;
  url: string;
  pic: string;
}

export function MusicPlayerMobile({ playlistId = "13641046209" }: { playlistId?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
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
      audioRef.current.src = songs[next].url;
      if (isPlaying) audioRef.current.play().catch(() => {});
    }
  };

  const handlePrev = () => {
    if (songs.length === 0) return;
    const prev = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentIndex(prev);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.src = songs[prev].url;
      if (isPlaying) audioRef.current.play().catch(() => {});
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

  return (
    <>
      <motion.button
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-primary-start to-primary-end text-white shadow-lg shadow-primary-start/30 md:hidden"
        onClick={() => setIsExpanded(!isExpanded)}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 3, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
          className="w-full h-full rounded-full relative overflow-hidden"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-800/50 to-slate-900/50" />
          <div className="absolute inset-[4px] rounded-full overflow-hidden">
            {currentSong ? (
              <img src={currentSong.pic} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-700/50">
                <ListMusic size={20} className="text-white/50" />
              </div>
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-500" />
          </div>
        </motion.div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed bottom-36 right-4 z-40 w-72 glass-card rounded-2xl p-4 shadow-xl md:hidden"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-start to-primary-end flex items-center justify-center">
                  <ListMusic size={12} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-white/90">正在播放</span>
              </div>
              <button onClick={() => setIsExpanded(false)} className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center">
                <X size={14} className="text-white/50" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <motion.div
                animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 3, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shrink-0 relative overflow-hidden"
              >
                <div className="absolute inset-[3px] rounded-full overflow-hidden">
                  {currentSong ? (
                    <img src={currentSong.pic} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <div className="w-full h-full bg-slate-700" />
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-600" />
                </div>
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{currentSong?.title || "未知曲目"}</p>
                <p className="text-xs text-white/50 truncate">{currentSong?.author || "未知艺术家"}</p>
                <p className="text-[10px] text-white/30 font-mono mt-0.5">{formatTime(currentTime)} / {formatTime(duration)}</p>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer mb-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-start"
            />

            <div className="flex items-center justify-center gap-3 mb-3">
              <button onClick={handlePrev} disabled={songs.length === 0} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center disabled:opacity-30">
                <SkipBack size={16} className="text-white/70 fill-white/70" />
              </button>
              <button onClick={togglePlay} disabled={songs.length === 0} className="w-11 h-11 rounded-full bg-gradient-to-r from-primary-start to-primary-end flex items-center justify-center shadow-lg shadow-primary-start/30 disabled:opacity-50">
                {isPlaying ? <Pause size={18} className="text-white fill-white" /> : <Play size={18} className="text-white fill-white ml-0.5" />}
              </button>
              <button onClick={handleNext} disabled={songs.length === 0} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center disabled:opacity-30">
                <SkipForward size={16} className="text-white/70 fill-white/70" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button onClick={toggleMute} className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center">
                  {isMuted ? <VolumeX size={12} className="text-white/40" /> : <Volume2 size={12} className="text-white/40" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-14 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/60"
                />
              </div>
              <span className="text-[10px] text-white/30">{songs.length} 曲</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

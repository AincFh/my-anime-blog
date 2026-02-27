import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, X, ListMusic, Volume2, VolumeX } from "lucide-react";
import { useMusicPlayer } from "~/hooks/useMusicPlayer";

/**
 * MusicPlayerMobile - 专注于移动端的轻量化版本
 * 消费 useMusicPlayer 钩子，共享播放逻辑。
 */
export function MusicPlayerMobile({ playlistId = "13641046209" }: { playlistId?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    currentSong,
    isPlaying,
    setIsPlaying,
    handleNext,
    handlePrev,
    currentTime,
    duration,
    handleSeek,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    isLoading,
    songs
  } = useMusicPlayer(playlistId);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };


  return (
    <div className="md:hidden">
      <motion.button
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-primary-start to-primary-end text-white shadow-lg shadow-primary-start/30"
        onClick={() => setIsExpanded(!isExpanded)}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 3, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
          className="w-full h-full rounded-full relative overflow-hidden p-1"
        >
          <div className="w-full h-full rounded-full overflow-hidden">
            {currentSong ? (
              <img src={currentSong.pic} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <ListMusic className="w-full h-full p-3 opacity-50" />
            )}
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
            className="fixed bottom-36 right-4 z-40 w-72 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white/70">Mobile Player</span>
              <button onClick={() => setIsExpanded(false)}><X size={14} className="text-white/40" /></button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                <img src={currentSong?.pic} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{currentSong?.title || "未知曲目"}</p>
                <p className="text-xs text-white/40 truncate">{currentSong?.author || "Unknown Artist"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-white/30 font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-start"
                />
              </div>

              <div className="flex items-center justify-center gap-6">
                <button onClick={handlePrev} className="text-white/40"><SkipBack size={20} /></button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-primary-start text-white flex items-center justify-center shadow-lg"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                </button>
                <button onClick={handleNext} className="text-white/40"><SkipForward size={20} /></button>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? <VolumeX size={14} className="text-white/40" /> : <Volume2 size={14} className="text-white/40" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setVolume(v);
                    if (v > 0) setIsMuted(false);
                  }}
                  className="flex-1 h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/40"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

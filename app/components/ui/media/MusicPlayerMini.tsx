import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, ListMusic, X, Volume2, VolumeX, Maximize2 } from "lucide-react";
import type { Song } from "~/hooks/useMusicPlayer";

/**
 * 局部态组件 (Component A): 原有的小尺寸悬浮播放器
 * 纯粹的 UI 视图组件，所有数据和音轨函数由 Props (大脑) 从外部打入
 */

// 智能预先提取视界内图片的骨架屏防糊组件
interface PreloadLazyImageProps {
  src: string;
  alt: string;
  className?: string;
  crossOrigin?: "anonymous" | "use-credentials" | "";
}

export const PreloadLazyImage = ({ src, alt, className, crossOrigin }: PreloadLazyImageProps) => {
  return (
    <div className={`relative overflow-hidden bg-slate-200 dark:bg-white/5 shrink-0 ${className}`}>
      <img src={src} alt={alt} crossOrigin={crossOrigin} className="w-full h-full object-cover transition-opacity duration-500" />
    </div>
  );
};

export interface MusicPlayerMiniProps {
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
  isExpanded: boolean;
  toggleExpand: () => void;
  showPlaylist: boolean;
  setShowPlaylist: (show: boolean) => void;
  stylusState: "iddle" | "lifting" | "playing";
  audioData: Uint8Array | null;
  onFullscreen: () => void;
  networkStatus?: 'idle' | 'slow' | 'error';
}

export function MusicPlayerMini({
  songs = [],
  currentSong,
  currentIndex,
  setCurrentIndex,
  isPlaying,
  togglePlay,
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
  currentTimeRef,
  progressBarRef,
  progressFillRef,
  isExpanded,
  toggleExpand,
  showPlaylist,
  setShowPlaylist,
  stylusState,
  audioData,
  onFullscreen,
  networkStatus = 'idle'
}: MusicPlayerMiniProps) {

  const formatTime = (time: number) => {
    if (time === Infinity || !isFinite(time)) return "LIVE";
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-6 left-6 z-[50] group/player pointer-events-auto hidden md:block">
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

            <button onClick={toggleExpand} className="relative w-20 h-20 flex items-center justify-center focus:outline-none">
              <div className={`relative w-16 h-16 rounded-full bg-[#111] shadow-2xl overflow-hidden ring-4 ring-black/20 dark:ring-white/10 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
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

              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/mini:bg-black/20 rounded-full transition-colors overflow-hidden">
                {/* 网络慢时显示加载动画 */}
                {networkStatus === 'slow' ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                      网络不佳
                    </div>
                  </>
                ) : isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : !isPlaying && (
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Play size={16} className="text-white fill-white ml-0.5" />
                  </div>
                )}
              </div>
            </button>

            <div className="ml-4 opacity-0 group-hover/mini:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover/mini:translate-x-0 pointer-events-none shrink-0">
              <div className="bg-white/60 dark:bg-[rgba(37,40,54,0.92)] dark:backdrop-blur-xl border border-white/20 dark:border-white/10 px-4 py-2 rounded-2xl shadow-xl">
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{currentSong?.title || "No Track"}</p>
                <p className="text-[10px] text-slate-500 dark:text-white/40 truncate">{currentSong?.author || "Artist"}</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cd-expanded"
            layoutId="player-container"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white/70 dark:bg-[rgba(37,40,54,0.96)] dark:backdrop-blur-3xl border border-white/30 dark:border-white/10 rounded-2xl shadow-2xl transition-all duration-700 w-[320px]"
          >
            <div className="px-6 py-5 flex items-center justify-between border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-primary-start/10 rounded-lg">
                  <span className="text-[10px] font-black text-primary-start uppercase tracking-widest">Hi-Fi</span>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-white/80">Premium Audio</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onFullscreen()}
                  title="全屏沉浸播放"
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-primary-start dark:text-white/40 dark:hover:text-primary-start hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  <Maximize2 size={14} />
                </button>
                <button
                  onClick={() => toggleExpand()}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-white/40 dark:hover:text-white/80 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-6 pt-5 flex gap-8">
              <div className="w-[280px] shrink-0 space-y-8">
                <div className="relative flex justify-center mt-2 mb-4">
                  {isPlaying && audioData && (
                    <div className="absolute top-1/2 left-1/2 w-0 h-0 z-0 pointer-events-none flex items-center justify-center">
                      <div className="absolute w-52 h-52 rounded-full border border-primary-start/10 transition-transform duration-75" />
                      <div className="absolute w-44 h-44 rounded-full border border-primary-start/30 transition-transform duration-100" />
                      <div className="absolute w-40 h-40 rounded-full bg-primary-start/5 opacity-80 transition-transform duration-100" />
                    </div>
                  )}

                  <div className={`relative w-48 h-48 rounded-full bg-[#111] shadow-2xl overflow-hidden ring-[6px] ring-black/40 dark:ring-white/10 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''} z-10`}>
                    <div className="absolute inset-[15%] rounded-full overflow-hidden border-4 border-[#222]">
                      <img src={currentSong?.pic} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                    </div>
                  </div>

                  <motion.div
                    animate={{ rotate: stylusState === "playing" ? 8 : stylusState === "lifting" ? 2 : -5 }}
                    transition={{ type: "spring", stiffness: 45, damping: 15 }}
                    style={{ transformOrigin: "16px 16px" }}
                    className="absolute -top-4 right-2 w-8 h-48 z-20 pointer-events-none drop-shadow-xl"
                  >
                    <div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-200 border border-slate-300 shadow-md z-20" />
                    <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-slate-500 border border-slate-600 z-30 shadow-inner" />
                    <div className="absolute top-4 left-[14px] w-1 h-[140px] bg-gradient-to-r from-slate-300 via-white to-slate-400 rounded-full shadow-sm" />
                    <div className="absolute top-[141px] left-[10px] w-2 h-4 bg-slate-400 rounded-sm rotate-[18deg]" />
                    <div className="absolute top-[144px] -left-[3px] w-4 h-8 bg-gradient-to-b from-slate-600 to-slate-800 rounded-sm rotate-[18deg] shadow-lg border-t border-slate-500" />
                  </motion.div>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white truncate">{currentSong?.title || "未知曲目"}</h3>
                  <p className="text-xs font-bold text-primary-start uppercase tracking-widest">{currentSong?.author || "Unknown Artist"}</p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-white/40">
                  <span ref={currentTimeRef}>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="relative group cursor-pointer h-4 flex items-center mt-2">
                  <input 
                    ref={progressBarRef} 
                    type="range" 
                    min="0" 
                    max={duration || 100} 
                    step="0.1" 
                    defaultValue={currentTime || 0} 
                    onChange={(e) => handleSeek(Number(e.target.value))} 
                    className="absolute z-20 w-full opacity-0 cursor-pointer h-full" 
                    style={{ touchAction: 'none' }} 
                  />
                  <div className="w-full h-1.5 bg-slate-200/80 dark:bg-white/10 rounded-full relative overflow-visible">
                    <div 
                      ref={progressFillRef} 
                      className="absolute top-0 left-0 h-full bg-primary-start rounded-full min-w-[6px] transition-all duration-300 pointer-events-none" 
                      style={{ width: `${Math.min((currentTime / (duration || 100)) * 100, 100)}%` }}
                    >
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-primary-start group-hover:scale-110 transition-transform z-10" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between relative">
                <button 
                  onClick={() => setShowPlaylist(!showPlaylist)} 
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${showPlaylist ? 'bg-primary-start text-white shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}
                >
                  <ListMusic size={18} />
                </button>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-6">
                  <button onClick={() => handlePrev()} className="text-slate-400 hover:text-primary-start transition-colors">
                    <SkipBack size={24} className="fill-current" />
                  </button>
                  <button onClick={() => togglePlay()} className="w-16 h-16 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xl hover:scale-105 transition-transform relative">
                    {/* 网络慢时显示转圈 */}
                    {networkStatus === 'slow' ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                          网络不佳
                        </div>
                      </>
                    ) : isPlaying ? (
                      <Pause size={28} className="fill-current" />
                    ) : (
                      <Play size={28} className="fill-current ml-1" />
                    )}
                  </button>
                  <button onClick={() => handleNext()} className="text-slate-400 hover:text-primary-start transition-colors">
                    <SkipForward size={24} className="fill-current" />
                  </button>
                </div>

                <div className="relative flex items-center justify-center shrink-0 group/vol hover:z-50 ml-auto">
                  <button onClick={() => setIsMuted(!isMuted)} className="w-10 h-10 rounded-full flex items-center justify-center bg-transparent group-hover/vol:bg-slate-200 dark:group-hover/vol:bg-white/10 transition-colors text-slate-500">
                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-10 h-32 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-full shadow-2xl opacity-0 translate-y-4 pointer-events-none group-hover/vol:opacity-100 group-hover/vol:translate-y-0 group-hover/vol:pointer-events-auto transition-all duration-300 flex flex-col items-center justify-center py-4 z-50">
                    <div className="flex-1 w-full flex items-center justify-center">
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={isMuted ? 0 : volume} 
                        onChange={(e) => { 
                          const v = Number(e.target.value); 
                          setVolume(v); 
                          if (v > 0) setIsMuted(false); 
                        }} 
                        className="w-[88px] h-1.5 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-start origin-center -rotate-90 hover:[&::-webkit-slider-thumb]:scale-125 shadow-inner" 
                        style={{ background: `linear-gradient(to right, #FF7A00 ${(isMuted ? 0 : volume) * 100}%, transparent ${(isMuted ? 0 : volume) * 100}%)` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {showPlaylist && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 180, opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-200 dark:border-white/5 -mx-6 px-4 py-4 overflow-y-auto hidden-scrollbar bg-transparent">
                    {songs.map((song: any, idx: number) => (
                      <button key={idx} onClick={() => setCurrentIndex(idx)} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${currentIndex === idx ? 'bg-primary-start/10 text-primary-start' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                        <PreloadLazyImage src={song.pic} alt={song.title} className="w-10 h-10 rounded-lg object-cover" crossOrigin="anonymous" />
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

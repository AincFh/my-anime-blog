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
      {/* 悬浮控制球 (Floating Action Button) - Apple HIG 标准热区 56x56 */}
      <motion.button
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-primary-start to-primary-end text-white shadow-[0_8px_30px_rgb(0,0,0,0.3)] shadow-primary-start/40 flex items-center justify-center p-0.5"
        onClick={() => setIsExpanded(true)}
        initial={false}
        animate={isExpanded ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="w-full h-full rounded-full bg-[#111] overflow-hidden relative">
          <motion.div
            animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 6, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
            className="w-full h-full"
          >
            {currentSong ? (
              <img src={currentSong.pic} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <ListMusic className="w-full h-full p-3 opacity-50 text-white" />
            )}
          </motion.div>
          {isLoading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            </div>
          )}
          {/* 中心圆孔 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white/20 rounded-full border border-black/50 shadow-inner backdrop-blur-sm" />
        </div>
      </motion.button>

      {/* 底部全屏抽屉面板 (Bottom Sheet) */}
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto">
            {/* 毛玻璃背景遮罩 */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
            />

            {/* 抽屉内容容器 */}
            <motion.div
              className="relative w-full h-[85vh] bg-gradient-to-b from-slate-800/90 to-black/95 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col pt-4 overflow-hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) setIsExpanded(false);
              }}
            >
              {/* 顶部把手 (Drag Grabber) */}
              <div className="w-12 h-1.5 bg-white/20 rounded-full self-center mb-6 shrink-0" />

              {/* 环境光溢出层 (基于封面的模糊色彩映射) */}
              <div
                className="absolute inset-0 opacity-30 blur-[100px] z-0 pointer-events-none transition-all duration-1000"
                style={{
                  backgroundImage: currentSong ? `url(${currentSong.pic})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />

              {/* 核心滚动/排版区 */}
              <div className="flex-1 flex flex-col px-8 pb-[env(safe-area-inset-bottom)] z-10 overflow-y-auto">

                {/* 1. 顶部栏 */}
                <div className="flex justify-between items-center shrink-0 mb-8">
                  <span className="text-white/60 text-xs font-semibold tracking-widest uppercase truncate max-w-[60%]">
                    Now Playing
                  </span>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 active:scale-90 transition-transform"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>

                {/* 2. 超大化封面 */}
                <div className="w-full aspect-square rounded-3xl shadow-2xl overflow-hidden shrink-0 relative bg-white/5 border border-white/10">
                  {currentSong ? (
                    <motion.img
                      key={currentSong.pic}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      src={currentSong.pic}
                      alt=""
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/30">
                      <ListMusic size={64} strokeWidth={1} />
                      <span className="text-sm font-medium">无播放源</span>
                    </div>
                  )}
                </div>

                {/* 3. 歌曲信息 (大字重排版) */}
                <div className="mt-8 mb-6 shrink-0 text-center">
                  <h2 className="text-2xl font-black text-white/90 truncate mb-1">
                    {currentSong?.title || "未知曲目"}
                  </h2>
                  <h3 className="text-lg font-medium text-primary-start/80 truncate">
                    {currentSong?.author || "Unknown Artist"}
                  </h3>
                </div>

                {/* 4. 伸缩填充区流体控制 (确保进度条和按钮在矮屏幕下不会挤出屏幕) */}
                <div className="flex-1 min-h-[1rem]" />

                {/* 5. 进度条 (加宽拇指热区) */}
                <div className="mb-6 shrink-0 w-full px-2">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
                    style={{
                      background: `linear-gradient(to right, #4158D0 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.1) ${(currentTime / (duration || 1)) * 100}%)`
                    }}
                  />
                  <div className="flex justify-between text-xs font-medium text-white/40 mt-3 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* 6. 核心操控组 (巨型热区) */}
                <div className="flex items-center justify-between mb-8 shrink-0 px-2">
                  <button onClick={() => setIsMuted(!isMuted)} className="p-3 active:scale-90 transition-transform">
                    {isMuted || volume === 0 ? <VolumeX size={24} className="text-white/40" /> : <Volume2 size={24} className="text-white/40" />}
                  </button>

                  <div className="flex items-center gap-6">
                    <button onClick={handlePrev} className="p-2 active:scale-90 transition-transform text-white/80">
                      <SkipBack size={36} className="fill-current" />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-[72px] h-[72px] rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-95 transition-transform"
                    >
                      {isPlaying ? <Pause size={32} className="fill-current" /> : <Play size={32} className="fill-current ml-1" />}
                    </button>
                    <button onClick={handleNext} className="p-2 active:scale-90 transition-transform text-white/80">
                      <SkipForward size={36} className="fill-current" />
                    </button>
                  </div>

                  <button className="p-3 active:scale-90 transition-transform">
                    {/* 在手机端保留一个与主控制组对称的空位或未来功能键 */}
                    <div className="w-[24px]" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

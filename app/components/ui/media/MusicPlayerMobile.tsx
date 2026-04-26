import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, X, ListMusic, Volume2, VolumeX, ChevronUp, Disc3 } from "lucide-react";
import { useMusicPlayer } from "~/hooks/useMusicPlayer";

export function MusicPlayerMobile({ playlistId = "13641046209" }: { playlistId?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

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
    songs,
    currentIndex,
    setCurrentIndex
  } = useMusicPlayer(playlistId);

  const formatTime = (time: number) => {
    if (time === Infinity || !isFinite(time)) return "LIVE";
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const backdropOpacity = Math.min(0.6, 0.3 + (isExpanded ? 0.3 : 0));
  const drawerHeight = 88;

  const handleClose = () => {
    setShowPlaylist(false);
    setIsExpanded(false);
  };

  return (
    <div className="md:hidden">
      {/* ===== FAB 悬浮球 (72px 热区，悬停浮现播放按钮) ===== */}
      <motion.button
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+6rem)] right-4 z-[100] select-none"
        style={{ width: 72, height: 72 }}
        onClick={() => setIsExpanded(true)}
        whileTap={{ scale: 0.92 }}
        aria-label="打开音乐播放器"
      >
        {isPlaying && (
          <motion.div
            className="absolute inset-[-6px] rounded-full bg-primary-start/20 blur-xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <div className="relative w-[72px] h-[72px]">
          <motion.div
            animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 6, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
            className="w-full h-full rounded-full bg-gradient-to-br from-[#1a1a1a] to-black shadow-[0_8px_32px_rgba(0,0,0,0.5)] shadow-primary-start/30 overflow-hidden ring-2 ring-white/10"
          >
            {currentSong ? (
              <img src={currentSong.pic} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Disc3 size={28} className="text-white/20" />
              </div>
            )}
          </motion.div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#111] border border-white/10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]" />
          {isLoading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
      </motion.button>

      {/* FAB 播放/暂停快捷按钮 */}
      <motion.button
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+6rem+80px)] right-4 z-[100] w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-white/30 dark:border-white/20 shadow-lg flex items-center justify-center"
        onClick={() => setIsPlaying(!isPlaying)}
        whileTap={{ scale: 0.85 }}
        aria-label={isPlaying ? "暂停" : "播放"}
        animate={isExpanded ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {isLoading ? (
          <div className="w-3.5 h-3.5 border-2 border-primary-start/30 border-t-primary-start rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause size={12} className="fill-primary-start text-primary-start" />
        ) : (
          <Play size={12} className="fill-primary-start text-primary-start ml-px" />
        )}
      </motion.button>

      {/* ===== 底部全屏抽屉面板 ===== */}
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-[200] flex flex-col justify-end">
            {/* 毛玻璃遮罩 */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: backdropOpacity }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={handleClose}
            />

            {/* 抽屉主体 */}
            <motion.div
              className="relative w-full bg-[#0d0d12] rounded-t-[2rem] shadow-[0_-24px_80px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden"
              style={{ height: drawerHeight + "vh", maxHeight: "92vh" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.08}
              onDragEnd={(_, info) => {
                if (info.velocity.y > 500 || info.offset.y > 120) {
                  handleClose();
                }
                setDragOffset(0);
              }}
              onDragUpdate={(_, info) => {
                if (info.point.y > 0) {
                  setDragOffset(Math.max(0, info.point.y - (typeof window !== "undefined" ? window.innerHeight * (drawerHeight / 100) : 0)));
                }
              }}
            >
              {/* 顶部区域 */}
              <div className="shrink-0 flex flex-col items-center pt-4 pb-2 px-6">
                {/* 拖拽指示条 */}
                <div className="w-10 h-1 bg-white/20 rounded-full mb-3 cursor-grab active:cursor-grabbing" />
                {/* 顶部栏 */}
                <div className="w-full flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/40">Now Playing</span>
                  <button
                    onClick={handleClose}
                    className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-white/50 active:bg-white/15 active:text-white/80 transition-all"
                    aria-label="关闭播放器"
                  >
                    <ChevronUp size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* 可滚动内容区 */}
              <div className="flex-1 overflow-y-auto px-6 pb-[env(safe-area-inset-bottom)] overscroll-contain">

                {/* 封面区 */}
                <div className="w-full aspect-square rounded-2xl overflow-hidden relative bg-white/5 border border-white/8 mb-6 shrink-0">
                  {currentSong ? (
                    <motion.img
                      key={currentSong.pic}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.45 }}
                      src={currentSong.pic}
                      alt=""
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/25">
                      <Disc3 size={56} strokeWidth={1} />
                      <span className="text-sm font-medium">无播放源</span>
                    </div>
                  )}
                  {currentSong && (
                    <div
                      className="absolute inset-0 opacity-25 blur-[80px] pointer-events-none transition-all duration-1000"
                      style={{
                        backgroundImage: "url(" + currentSong.pic + ")",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  )}
                </div>

                {/* 歌曲信息 */}
                <div className="mb-6 shrink-0 text-center">
                  <h2 className="text-2xl font-black text-white/90 tracking-tight leading-tight truncate">
                    {currentSong?.title || "未知曲目"}
                  </h2>
                  <h3 className="text-[15px] font-medium text-white/40 mt-1 truncate">
                    {currentSong?.author || "Unknown Artist"}
                  </h3>
                </div>

                {/* 进度条 */}
                <div className="mb-5 shrink-0">
                  <div className="relative h-12 flex items-center">
                    <div className="absolute inset-x-0 h-12 -my-3 flex items-center">
                      <div className="relative w-full h-1 rounded-full overflow-visible">
                        <div className="absolute inset-0 bg-white/10 rounded-full" />
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-start to-primary-end rounded-full min-w-[4px] transition-all duration-150"
                          style={{ width: progress + "%" }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg shadow-black/40 border-2 border-white/20"
                          style={{ left: "calc(" + progress + "% - 8px)" }}
                        />
                        <input
                          type="range"
                          min="0"
                          max={duration || 100}
                          value={currentTime}
                          onChange={(e) => handleSeek(Number(e.target.value))}
                          className="absolute inset-0 w-full h-14 opacity-0 cursor-pointer z-10"
                          aria-label="进度"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[12px] font-medium text-white/35 mt-1 px-0.5 font-mono tabular-nums">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* 核心控制组 */}
                <div className="flex items-center justify-between mb-8 shrink-0">
                  {/* 音量 */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white/40 active:bg-white/10 active:text-white/70 transition-all"
                    aria-label={isMuted ? "取消静音" : "静音"}
                  >
                    {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                  </button>

                  <div className="flex items-center gap-5">
                    {/* 上一首 */}
                    <button
                      onClick={handlePrev}
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white/70 active:bg-white/10 active:text-white transition-all active:scale-90"
                      aria-label="上一首"
                    >
                      <SkipBack size={28} className="fill-current" strokeWidth={2.5} />
                    </button>

                    {/* 播放/暂停 */}
                    <motion.button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-[68px] h-[68px] rounded-full bg-white text-[#0d0d12] flex items-center justify-center shadow-[0_8px_32px_rgba(255,255,255,0.25)] active:scale-95 transition-transform"
                      whileTap={{ scale: 0.9 }}
                      aria-label={isPlaying ? "暂停" : "播放"}
                    >
                      {isLoading ? (
                        <div className="w-7 h-7 border-[3px] border-black/20 border-t-black rounded-full animate-spin" />
                      ) : isPlaying ? (
                        <Pause size={26} className="fill-current" strokeWidth={2.5} />
                      ) : (
                        <Play size={26} className="fill-current ml-0.5" strokeWidth={2.5} />
                      )}
                    </motion.button>

                    {/* 下一首 */}
                    <button
                      onClick={handleNext}
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white/70 active:bg-white/10 active:text-white transition-all active:scale-90"
                      aria-label="下一首"
                    >
                      <SkipForward size={28} className="fill-current" strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* 播放列表 */}
                  <button
                    onClick={() => setShowPlaylist(!showPlaylist)}
                    className={"w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90" +
                      (showPlaylist
                        ? " bg-primary-start/25 text-primary-start"
                        : " text-white/40 active:bg-white/10 active:text-white/70")}
                    aria-label="播放列表"
                  >
                    <ListMusic size={22} />
                  </button>
                </div>

                {/* 音量滑块 */}
                <div className="mb-6 shrink-0">
                  <div className="flex items-center gap-3">
                    <Volume2 size={14} className="text-white/30 shrink-0" />
                    <div className="relative h-8 flex items-center flex-1">
                      <div className="absolute inset-x-0 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-white/30 rounded-full transition-all"
                          style={{ width: ((isMuted ? 0 : volume) * 100) + "%" }}
                        />
                      </div>
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
                        className="absolute inset-0 w-full h-10 opacity-0 cursor-pointer z-10"
                        aria-label="音量"
                      />
                    </div>
                    <Volume2 size={14} className="text-white/30 shrink-0" />
                  </div>
                </div>

                {/* 曲目计数 */}
                <div className="text-center text-[12px] text-white/20 font-medium mb-2 shrink-0">
                  {currentIndex + 1} / {songs.length} 首
                </div>
              </div>

              {/* 播放列表面板 */}
              <AnimatePresence>
                {showPlaylist && (
                  <motion.div
                    className="absolute inset-x-0 bottom-0 bg-[#0a0a0f] border-t border-white/8 rounded-t-2xl z-10"
                    style={{ maxHeight: "60vh" }}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 24, stiffness: 200 }}
                  >
                    <div className="px-6 pt-4 pb-3 border-b border-white/8 flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-bold text-base">播放队列</h3>
                        <p className="text-[11px] text-white/35 mt-0.5">{songs.length} 首曲目</p>
                      </div>
                      <button
                        onClick={() => setShowPlaylist(false)}
                        className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 active:bg-white/15 transition-all"
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <div className="overflow-y-auto max-h-[calc(60vh-80px)] px-2 py-2 space-y-1">
                      {songs.map((song: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentIndex(idx);
                            if (!isPlaying) setIsPlaying(true);
                          }}
                          className={"w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left active:scale-[0.98]" +
                            (currentIndex === idx
                              ? " bg-primary-start/15 text-primary-start"
                              : " text-white/60 hover:text-white hover:bg-white/5")}
                        >
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-white/5 shrink-0">
                            <img src={song.pic} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                            {currentIndex === idx && isPlaying && (
                              <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                                <div className="flex items-end gap-px">
                                  <div className="w-0.5 bg-white rounded-t animate-pulse" style={{ height: "30%", animationDuration: "0.6s" }} />
                                  <div className="w-0.5 bg-white rounded-t animate-pulse" style={{ height: "70%", animationDuration: "0.8s" }} />
                                  <div className="w-0.5 bg-white rounded-t animate-pulse" style={{ height: "45%", animationDuration: "0.5s" }} />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={"text-sm font-bold truncate" + (currentIndex === idx ? "" : " text-white/80")}>
                              {song.title}
                            </p>
                            <p className="text-[11px] text-white/35 truncate mt-0.5">{song.author}</p>
                          </div>
                          {currentIndex === idx && (
                            <div className="w-2 h-2 rounded-full bg-primary-start shrink-0 animate-pulse" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

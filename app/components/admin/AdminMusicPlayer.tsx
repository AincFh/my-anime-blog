import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { useMusicPlayer } from "~/hooks/useMusicPlayer";
import { MUSIC_CONFIG } from "~/config";

/**
 * AdminMusicPlayer - 后台管理专用音乐预览组件
 * 核心哲学：剥离实时渲染与复杂动效，专注“配置验证”。
 * 复用 useMusicPlayer 核心 Hook 达成逻辑的一致性。
 */
export function AdminMusicPlayer({ playlistId = MUSIC_CONFIG.defaultPlaylistId }: { playlistId?: string }) {
  const {
    songs,
    currentIndex,
    isPlaying,
    isLoading,
    currentSong,
    togglePlay,
    setCurrentIndex
  } = useMusicPlayer(playlistId);

  return (
    <div className="w-full bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Config Preview
        </h3>
        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Aincrad Backend OS</span>
      </div>

      <div className="bg-black/20 rounded-xl p-3 border border-white/5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-white/10">
          {currentSong?.pic && <img src={currentSong.pic} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">{isLoading ? "Loading Registry..." : (currentSong?.title || "No data")}</p>
          <p className="text-[10px] text-white/40 truncate">{currentSong?.author || "N/A"}</p>
        </div>

        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
      </div>

      <div className="mt-4 max-h-40 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
        {songs.map((song, idx) => (
          <button
            key={idx}
            onClick={() => { setCurrentIndex(idx); if (!isPlaying) togglePlay(); }}
            className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all ${currentIndex === idx ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/40'}`}
          >
            <span className="text-[10px] font-mono opacity-30">{String(idx + 1).padStart(2, '0')}</span>
            <p className="text-[11px] font-bold truncate flex-1">{song.title}</p>
            {currentIndex === idx && isPlaying && (
              <div className="flex gap-0.5 items-end h-3">
                {[1, 2, 3].map(i => <motion.div key={i} animate={{ height: [4, 12, 6] }} transition={{ repeat: Infinity, duration: 0.5 + i * 0.1 }} className="w-0.5 bg-emerald-500" />)}
              </div>
            )}
          </button>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}} />
    </div>
  );
}

import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";

export function AdminMusicPlayer({ playlistId = "13641046209" }: { playlistId?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [songs, setSongs] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchMusic = async () => {
      try {
        if (!playlistId) return;
        const res = await fetch(`https://api.i-meto.com/meting/api?server=netease&type=playlist&id=${playlistId}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && isMounted) {
          setSongs(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMusic();
    return () => { isMounted = false; };
  }, [playlistId]);

  const togglePlay = () => {
    if (songs.length === 0) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(songs[currentTrack].url);
      audioRef.current.loop = false;
      audioRef.current.onended = nextTrack;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    if (songs.length === 0) return;
    const next = (currentTrack + 1) % songs.length;
    setCurrentTrack(next);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = new Audio(songs[next].url);
      audioRef.current.loop = false;
      audioRef.current.onended = nextTrack;
      if (isPlaying) {
        audioRef.current.play().catch(() => { });
      }
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="bg-[#1e293b]/40 backdrop-blur-xl rounded-xl p-4 shadow-sm border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
          🎵 控制台电台
        </h3>
        <div className="flex items-center gap-1">
          <motion.button
            onClick={togglePlay}
            disabled={songs.length === 0}
            className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-500 transition-colors text-xs disabled:opacity-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isPlaying ? "⏸️" : "▶️"}
          </motion.button>
          <motion.button
            onClick={nextTrack}
            disabled={songs.length === 0}
            className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-500 transition-colors text-xs disabled:opacity-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ⏭️
          </motion.button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white/90 truncate">
            {songs.length === 0 ? "获取云端歌单中..." : (isPlaying ? "播放中..." : "已暂停")}
          </p>
          <p className="text-xs text-white/50 truncate flex items-center gap-1">
            {songs.length > 0 ? `${songs[currentTrack].title} - ${songs[currentTrack].author}` : "📡 Connecting..."}
          </p>
        </div>
        {isPlaying && (
          <motion.div
            className="flex gap-0.5"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <div className="w-0.5 h-3 bg-violet-400 rounded-full"></div>
            <div className="w-0.5 h-4 bg-violet-400 rounded-full"></div>
            <div className="w-0.5 h-3 bg-violet-400 rounded-full"></div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

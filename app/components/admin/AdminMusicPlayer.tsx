import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";

/**
 * 后台BGM控制器
 * 功能：Lo-Fi音乐播放器，助你专注写作
 */
export function AdminMusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Lo-Fi音乐列表（使用免费资源或占位符）
  const tracks = [
    { name: "Lo-Fi Study Beats", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { name: "Chill Vibes", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { name: "Focus Mode", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  ];

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(tracks[currentTrack].url);
      audioRef.current.loop = true;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    const next = (currentTrack + 1) % tracks.length;
    setCurrentTrack(next);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = new Audio(tracks[next].url);
      audioRef.current.loop = true;
      if (isPlaying) {
        audioRef.current.play();
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
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 shadow-sm border border-purple-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          🎵 Lo-Fi Player
        </h3>
        <div className="flex items-center gap-1">
          <motion.button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center hover:bg-purple-600 transition-colors text-xs"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isPlaying ? "⏸️" : "▶️"}
          </motion.button>
          <motion.button
            onClick={nextTrack}
            className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center hover:bg-purple-600 transition-colors text-xs"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ⏭️
          </motion.button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700 truncate">
            {isPlaying ? "Playing..." : "Paused"}
          </p>
          <p className="text-xs text-gray-500 truncate">{tracks[currentTrack].name}</p>
        </div>
        {isPlaying && (
          <motion.div
            className="flex gap-0.5"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <div className="w-0.5 h-3 bg-purple-500 rounded-full"></div>
            <div className="w-0.5 h-4 bg-purple-500 rounded-full"></div>
            <div className="w-0.5 h-3 bg-purple-500 rounded-full"></div>
          </motion.div>
        )}
      </div>
    </div>
  );
}


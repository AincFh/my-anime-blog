import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { isMobileDevice } from "~/utils/performance";

/**
 * 移动端音乐播放器 - 胶囊化
 * 功能：手机上缩成旋转音符图标，点击展开控制面板
 */
export function MusicPlayerMobile() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 只在移动端显示
  if (!isMobileDevice()) {
    return null;
  }

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
      audioRef.current.loop = true;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      {/* 胶囊化图标 - 固定在右下角 */}
      <motion.button
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg md:hidden"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          rotate: isPlaying ? 360 : 0,
        }}
        transition={{
          rotate: {
            duration: 3,
            repeat: isPlaying ? Infinity : 0,
            ease: "linear",
          },
        }}
      >
        <span className="text-2xl">🎵</span>
      </motion.button>

      {/* 展开的控制面板 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed bottom-20 right-4 z-40 w-72 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl md:hidden"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">音乐播放器</h3>
              <motion.button
                onClick={() => setIsExpanded(false)}
                className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
              >
                {isPlaying ? "⏸️" : "▶️"}
              </motion.button>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {isPlaying ? "Playing..." : "Paused"}
                </p>
                <p className="text-xs text-gray-500">Lo-Fi Study Beats</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


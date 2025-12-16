import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 全局音乐播放器
 * 功能：
 * 1. 支持R2音频文件
 * 2. 页面切换不中断播放（SPA优势）
 * 3. 可视化频谱
 * 4. 黑胶唱片旋转动画
 */
interface Track {
  title: string;
  artist: string;
  url: string; // R2音频URL
}

// 示例播放列表（实际应该从R2获取）
const playlist: Track[] = [
  {
    title: "Cruel Angel's Thesis",
    artist: "Yoko Takahashi",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // 示例，替换为R2链接
  },
  {
    title: "Lemon",
    artist: "Kenshi Yonezu",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
];

export function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [isRotating, setIsRotating] = useState(false);

  // 初始化音频（只创建一次，保持全局状态）
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      audioRef.current.loop = true; // 循环播放
    }

    return () => {
      // 不销毁audio，保持播放状态
    };
  }, []);

  // 加载当前曲目
  useEffect(() => {
    if (audioRef.current && playlist[currentTrack]) {
      audioRef.current.src = playlist[currentTrack].url;
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentTrack]);

  // 播放/暂停
  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsRotating(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setIsRotating(true);
      } catch (error) {
        console.error("播放失败:", error);
      }
    }
  };

  // 更新进度
  useEffect(() => {
    if (!audioRef.current) return;

    const updateProgress = () => {
      if (audioRef.current) {
        const current = audioRef.current.currentTime;
        const duration = audioRef.current.duration;
        if (duration) {
          setProgress((current / duration) * 100);
        }
      }
      animationRef.current = requestAnimationFrame(updateProgress);
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  // 音量控制
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 可视化频谱数据（模拟，实际需要Web Audio API）
  const getVisualizerData = () => {
    return Array.from({ length: 20 }, (_, i) => {
      if (!isPlaying) return 20;
      return 20 + Math.sin((Date.now() / 100 + i) * 0.5) * 30 + Math.random() * 20;
    });
  };

  const track = playlist[currentTrack];

  // 移动端使用胶囊化播放器
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    return null; // 移动端由MusicPlayerMobile处理
  }

  return (
    <div className="fixed bottom-8 left-8 z-50 hidden md:block">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="glass-panel p-4 rounded-xl mb-4 w-72"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400">Now Playing</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 歌曲信息 */}
            <div className="mb-3">
              <div className="text-sm font-bold text-white mb-1 line-clamp-1">
                {track.title}
              </div>
              <div className="text-xs text-primary-start">{track.artist}</div>
            </div>

            {/* 可视化频谱 */}
            <div className="flex gap-1 h-12 items-end mb-3 bg-black/20 rounded-lg p-2">
              {getVisualizerData().map((height, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-primary-start to-primary-end rounded-full"
                  animate={{
                    height: isPlaying ? `${height}%` : "20%",
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: isPlaying ? Infinity : 0,
                    repeatType: "reverse",
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>

            {/* 进度条 */}
            <div className="mb-3">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-start to-primary-end"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setCurrentTrack((prev) => (prev - 1 + playlist.length) % playlist.length)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                ⏮
              </button>
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-start to-primary-end flex items-center justify-center text-white hover:scale-110 transition-transform"
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button
                onClick={() => setCurrentTrack((prev) => (prev + 1) % playlist.length)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                ⏭
              </button>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="text-xs text-slate-400">🔊</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-1"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 黑胶唱片按钮 */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          animate={isRotating ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 4, repeat: isRotating ? Infinity : 0, ease: "linear" }}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 relative border-2 border-slate-700"
        >
          <div className="absolute inset-0 m-auto w-3 h-3 bg-primary-start rounded-full" />
          {/* 唱片纹理 */}
          <div className="absolute inset-0 rounded-full border border-slate-600/50" />
        </motion.div>
      </motion.button>
    </div>
  );
}

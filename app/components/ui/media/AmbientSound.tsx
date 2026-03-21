import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouteLoaderData } from "react-router";

/**
 * 环境音效
 * 功能：根据前台的背景天气播放环境音（雨天、夏日教室、深夜等）
 */
interface AmbientSoundProps {
  scene: "rainy" | "summer" | "night" | "default";
  volume?: number; // 0-1，默认0.15（15%）
}

const soundMap: Record<string, string> = {
  rainy: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // 实际应该使用雨声
  summer: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", // 实际应该使用蝉鸣
  night: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", // 实际应该使用篝火声
  default: "",
};

export function AmbientSound({ scene, volume = 0.15 }: AmbientSoundProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 接入根级挂载的用户环境偏好
  const rootData = useRouteLoaderData("root") as any;
  const isGlobalSoundEnabled = rootData?.userPrefs?.personalization?.sound_effects !== false;
  
  const [isEnabled, setIsEnabled] = useState(isGlobalSoundEnabled);

  useEffect(() => {
    if (!isEnabled || !soundMap[scene]) return;

    // 创建音频对象
    if (!audioRef.current) {
      audioRef.current = new Audio(soundMap[scene]);
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
      audioRef.current.play().catch((error) => {
        console.error("Failed to play ambient sound:", error);
      });
    } else {
      // 切换场景时更换音频
      audioRef.current.pause();
      audioRef.current = new Audio(soundMap[scene]);
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
      audioRef.current.play().catch((error) => {
        console.error("Failed to play ambient sound:", error);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [scene, volume, isEnabled]);

  // 根据背景图片判断场景（简化版）
  const detectScene = (): AmbientSoundProps["scene"] => {
    // 这里可以根据背景图片URL或时间来判断
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) return "night";
    // 实际应该根据背景图片内容判断
    return "default";
  };

  const currentScene = scene || detectScene();

  return (
    <motion.div
      className="fixed bottom-24 right-4 z-40 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <motion.button
        onClick={() => setIsEnabled(!isEnabled)}
        className="w-10 h-10 rounded-full flex items-center justify-center"
        animate={{
          rotate: isEnabled ? [0, 360] : 0,
        }}
        transition={{
          rotate: {
            duration: 2,
            repeat: isEnabled ? Infinity : 0,
            ease: "linear",
          },
        }}
        title={isEnabled ? "关闭环境音" : "开启环境音"}
      >
        {isEnabled ? (
          <span className="text-2xl">
            {currentScene === "rainy" ? "🌧️" : currentScene === "summer" ? "☀️" : currentScene === "night" ? "🌙" : "🎵"}
          </span>
        ) : (
          <span className="text-2xl">🔇</span>
        )}
      </motion.button>
    </motion.div>
  );
}


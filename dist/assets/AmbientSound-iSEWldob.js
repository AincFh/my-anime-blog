import { a as reactExports } from "./worker-entry-CHMicv-3.js";
import "node:events";
import "node:stream";
const soundMap = {
  rainy: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  // 实际应该使用雨声
  summer: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  // 实际应该使用蝉鸣
  night: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  // 实际应该使用篝火声
  default: ""
};
function AmbientSound({ scene, volume = 0.15 }) {
  const audioRef = reactExports.useRef(null);
  const [isEnabled, setIsEnabled] = reactExports.useState(true);
  reactExports.useEffect(() => {
    if (!isEnabled || !soundMap[scene]) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(soundMap[scene]);
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
      audioRef.current.play().catch((error) => {
        console.error("Failed to play ambient sound:", error);
      });
    } else {
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
  const detectScene = () => {
    const hour = (/* @__PURE__ */ new Date()).getHours();
    if (hour >= 22 || hour < 6) return "night";
    return "default";
  };
  scene || detectScene();
  return null;
}
export {
  AmbientSound
};

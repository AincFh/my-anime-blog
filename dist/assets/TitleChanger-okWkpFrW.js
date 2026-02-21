import { a as reactExports } from "./worker-entry-CHMicv-3.js";
import "node:events";
import "node:stream";
function TitleChanger() {
  reactExports.useEffect(() => {
    const originalTitle = document.title;
    const awayMessages = [
      "( ﾟдﾟ) 诶？人呢？",
      "Waiting for you...",
      "快回来～",
      "去哪里了呀？",
      "不要丢下我一个人...",
      "正在休眠中...",
      "Zzz...",
      "404 User Not Found",
      "连接中断...",
      "(´・ω・`)"
    ];
    const backMessages = [
      "Welcome Back!",
      "你回来啦！",
      "好久不见~",
      "欢迎回家",
      "Reconnected.",
      "系统恢复正常",
      "检测到观测者",
      "世界线收束完成",
      "终于等到你",
      "(*^▽^*)"
    ];
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const randomIndex = Math.floor(Math.random() * awayMessages.length);
        document.title = awayMessages[randomIndex];
      } else {
        const randomIndex = Math.floor(Math.random() * backMessages.length);
        document.title = backMessages[randomIndex];
        setTimeout(() => {
          document.title = originalTitle;
        }, 2e3);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.title = originalTitle;
    };
  }, []);
  return null;
}
export {
  TitleChanger
};

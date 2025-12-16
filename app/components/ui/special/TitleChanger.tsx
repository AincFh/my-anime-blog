import { useEffect } from "react";

/**
 * 标题栏离开/回来效果
 * 功能：切换标签页时标题变化，回来时显示欢迎语
 */
export function TitleChanger() {
  useEffect(() => {
    const originalTitle = document.title;

    // 离开时的文案
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
      "(´・ω・`)",
    ];

    // 回来时的文案
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
      "(*^▽^*)",
    ];

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 离开时：随机选择一个消息
        const randomIndex = Math.floor(Math.random() * awayMessages.length);
        document.title = awayMessages[randomIndex];
      } else {
        // 回来时：随机选择一个欢迎语，然后恢复
        const randomIndex = Math.floor(Math.random() * backMessages.length);
        document.title = backMessages[randomIndex];

        setTimeout(() => {
          document.title = originalTitle;
        }, 2000);
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

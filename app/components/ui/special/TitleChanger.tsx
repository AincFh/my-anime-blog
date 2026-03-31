import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

/**
 * 标题栏离开/回来效果 & 路由感应
 * 功能：
 * 1. 切换标签页时标题变化
 * 2. 回来时显示欢迎语
 * 3. 切换路由时根据不同页面显示不同小词话
 */
export function TitleChanger() {
  const location = useLocation();
  const originalTitleRef = useRef(document.title);
  
  // 离开时的文案 (Away) - 更加多样化，减少重复感
  const awayMessages = [
    "( ﾟдﾟ) 诶？人呢？",
    "Waiting for you...",
    "快回来～ 有好东西看！",
    "去哪里了呀？(・へ・)",
    "不要丢下我一个人...",
    "正在休眠中... Zzz",
    "(´・ω・`) 别走嘛，再陪我会",
    "连接中断... 信号丢失...",
    "404 User Not Found",
    "此处空空如也 (´w｀*)",
    "是在摸鱼吗？被抓到了！",
    "网页由于太寂寞而进入了待机",
    "别回头，我在标签栏看着你",
    "等待观测者重新降临...",
    "Loading Life... 99%",
  ];

  // 回来时的文案 (Back) - 充满活力的欢迎
  const backMessages = [
    "Welcome Back! (oﾟvﾟ)ノ",
    "你回来啦！好想你！",
    "检测到观测者，系统重启",
    "终于等到你，还好我没放弃",
    "(*^▽^*) 嘿嘿，抓到你啦",
    "世界线收束完成，欢迎回归",
    "欢迎回家，主人～",
    "Reconnected. 心跳同步中",
    "就知道你舍不得我 ( *︾▽︾)",
    "这就是重逢的喜悦吗？",
    "观测点已锚定，开始跳跃",
    "这里永远是你的避风港",
  ];

  // 路由对应的词语 (Route Hints) - 更具情感和场景感
  const routeHints: Record<string, string[]> = {
    "/": ["✨ 欢迎光临星影小站", "🏠 欢迎回家，观测者", "🌟 探索无尽的二次元"],
    "/articles": ["📚 正在翻阅馆藏...", "📖 知识库加载中", "🖊️ 文明轨迹的记录"],
    "/bangumi": ["📺 追番的时间到了！", "🍱 准备好零食了吗？", "🎞️ 帧间的感动"],
    "/shop": ["💎 欢迎光临星尘集市", "🛒 剁手时间到！", "🧧 看看有什么新品"],
    "/gallery": ["🎨 艺术长廊漫步中", "🖼️ 定格的绝美瞬间", "🌈 色彩在跳动"],
    "/login": ["🔐 身份有效性核准", "🔑 开启异世界大门"],
    "/register": ["📝 成为新的观测者", "🆕 新旅程的起点"],
    "/user/dashboard": ["🚀 指挥中心已上线", "📊 司令部实时播报", "📍 当前坐标：核心区"],
    "/user/inventory": ["🎒 正在整理口袋...", "⚔️ 检查现役装备"],
    "/user/settings": ["⚙️ 调整系统底层参数", "🔧 正在微调世界规律"],
  };

  useEffect(() => {
    // 监听 Visibility Change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const msg = awayMessages[Math.floor(Math.random() * awayMessages.length)];
        document.title = msg;
      } else {
        const msg = backMessages[Math.floor(Math.random() * backMessages.length)];
        document.title = msg;
        
        setTimeout(() => {
          // 恢复为当前路由的标题
          const hints = routeHints[location.pathname] || [originalTitleRef.current];
          document.title = hints[Math.floor(Math.random() * hints.length)];
        }, 1500);
      }
    };


    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [location.pathname]);

  // 监听路由变化更新标题
  useEffect(() => {
    const hints = routeHints[location.pathname];
    if (hints && hints.length > 0) {
      // 从数组中随机选择一个标题
      const hint = hints[Math.floor(Math.random() * hints.length)];
      document.title = hint;
      originalTitleRef.current = hint;
    } else {
      // 默认延时获取最新生成的 document.title (由 Meta 组件生成)
      setTimeout(() => {
        originalTitleRef.current = document.title;
      }, 500);
    }
  }, [location.pathname]);

  return null;
}

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 网易云音乐播放器 - 全平台适配版 (Glassmorphism Style)
 * 特性：
 * 1. 自动适配亮色/暗色模式
 * 2. 移动端优化：平时为悬浮球，点击后底部弹窗
 * 3. 桌面端优化：左下角悬浮胶囊
 */
export function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  // 防止重复加载脚本的标记
  const scriptLoadedRef = useRef(false);

  // 网易云歌单ID
  const playlistId = "13641046209";

  useEffect(() => {
    // 避免服务端渲染错误
    if (typeof window === "undefined") return;
    if (scriptLoadedRef.current) return;

    scriptLoadedRef.current = true;

    // 1. 注入 CSS (优化后的响应式样式)
    const customCss = `
      /* --- 全局重置 --- */
      .aplayer {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        margin: 0 !important;
      }
      
      /* --- 播放列表 (Glassmorphism) --- */
      .aplayer .aplayer-list {
        background: transparent !important;
        border: none !important;
        margin-top: 10px !important;
        max-height: 240px !important;
        overflow-y: auto !important;
      }
      /* 列表项 */
      .aplayer .aplayer-list ol li {
        border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
        height: 40px !important;
        line-height: 40px !important;
        padding: 0 12px !important;
        border-radius: 6px !important;
        margin-bottom: 2px !important;
        transition: background 0.2s !important;
      }
      .aplayer .aplayer-list ol li:hover {
        background: rgba(0, 0, 0, 0.05) !important;
      }
      /* 暗色模式适配 */
      .dark .aplayer .aplayer-list ol li:hover {
        background: rgba(255, 255, 255, 0.1) !important;
      }
      /* 当前播放项 */
      .aplayer .aplayer-list ol li.aplayer-list-light {
        background: rgba(236, 72, 153, 0.15) !important; /* Pink-500 opacity */
      }
      .aplayer .aplayer-list ol li.aplayer-list-light .aplayer-list-title {
        color: #ec4899 !important;
        font-weight: bold !important;
      }

      /* --- 播放器主体 --- */
      .aplayer .aplayer-body {
        display: flex !important;
        align-items: center !important;
        padding: 10px 0 !important;
        position: relative !important;
      }
      
      /* 封面图 */
      .aplayer .aplayer-pic {
        width: 64px !important;
        height: 64px !important;
        border-radius: 12px !important;
        margin-right: 12px !important;
        box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important;
        transition: transform 0.3s !important;
      }
      .aplayer .aplayer-pic:hover {
        transform: scale(1.05) !important;
      }
      /* 隐藏原本的播放按钮层 */
      .aplayer .aplayer-pic .aplayer-button {
        display: none !important;
      }

      /* 信息区 */
      .aplayer .aplayer-info {
        flex: 1 !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        height: auto !important;
      }
      
      /* 歌词区 */
      .aplayer .aplayer-lrc {
        margin: 4px 0 8px 0 !important;
        height: 32px !important; /* 限制高度 */
        mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent) !important;
      }
      .aplayer .aplayer-lrc p {
        font-size: 13px !important;
        color: inherit !important;
        opacity: 0.7 !important;
        text-shadow: none !important;
      }
      .aplayer .aplayer-lrc p.aplayer-lrc-current {
        font-size: 15px !important;
        color: #ec4899 !important;
        opacity: 1 !important;
        font-weight: bold !important;
      }

      /* 进度条 */
      .aplayer .aplayer-bar-wrap {
        margin: 0 0 8px 0 !important;
        height: 4px !important;
        border-radius: 4px !important;
        background: rgba(128, 128, 128, 0.2) !important;
      }
      .aplayer .aplayer-bar-wrap .aplayer-bar .aplayer-played {
        background: #ec4899 !important;
        height: 4px !important;
      }
      .aplayer .aplayer-bar-wrap .aplayer-bar .aplayer-played .aplayer-thumb {
        background: #ec4899 !important;
        transform: scale(0.8) !important;
      }

      /* 控制按钮 */
      .aplayer .aplayer-time {
        color: inherit !important;
        display: flex !important;
        align-items: center !important;
        padding-bottom: 0 !important;
      }
      .aplayer .aplayer-time button {
        margin: 0 8px !important;
      }
      .aplayer-icon path {
        fill: currentColor !important;
      }

      /* --- 移动端特定修正 --- */
      @media (max-width: 768px) {
        .aplayer .aplayer-list {
          max-height: 40vh !important; /* 手机端列表更高 */
        }
        .aplayer .aplayer-pic {
          width: 56px !important;
          height: 56px !important;
        }
      }
    `;

    // 2. 插入 Style 标签
    const styleTag = document.createElement("style");
    styleTag.innerHTML = customCss;
    document.head.appendChild(styleTag);

    // 3. 动态加载外部脚本 (Promise 链式加载)
    const loadScript = (src: string, id: string) => {
      return new Promise((resolve, reject) => {
        if (document.getElementById(id)) {
          resolve(true);
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.id = id;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    // 这一步确保 CSS 也能加载 (APlayer 依赖它的 CSS)
    const loadCss = (href: string, id: string) => {
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.href = href;
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    };

    loadCss("https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css", "aplayer-css");

    loadScript("https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.js", "aplayer-js")
      .then(() => loadScript("https://cdn.jsdelivr.net/npm/meting@2.0.1/dist/Meting.min.js", "meting-js"))
      .then(() => setIsLoaded(true))
      .catch((e) => console.error("Music Player Load Failed:", e));

    return () => {
      if (document.head.contains(styleTag)) document.head.removeChild(styleTag);
    };
  }, []);

  // 动画配置
  const variants = {
    open: { opacity: 1, y: 0, scale: 1, display: "block" },
    closed: { opacity: 0, y: 20, scale: 0.95, transitionEnd: { display: "none" } },
  };

  return (
    <>
      {/* 遮罩层 (仅移动端打开时显示) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <div className="fixed z-50 flex flex-col items-end md:items-start 
                      bottom-4 right-4  /* 移动端：右下角 */
                      md:bottom-8 md:left-8 /* 桌面端：左下角 */
      ">

        {/* 播放器卡片容器 */}
        <AnimatePresence>
          <motion.div
            initial="closed"
            animate={isOpen ? "open" : "closed"}
            variants={variants}
            className="
              mb-4 overflow-hidden shadow-2xl backdrop-blur-xl border
              bg-white/80 border-white/40 text-slate-800
              dark:bg-slate-900/80 dark:border-white/10 dark:text-slate-100
              
              /* 尺寸控制 */
              w-[90vw] max-w-[380px] rounded-2xl
              
              /* 移动端特殊定位: 居中或者底部弹起 */
              fixed bottom-20 right-4 
              md:static md:bottom-auto md:right-auto
            "
          >
            {/* 顶部标题栏 */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/10 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
                <span className="text-xs font-bold tracking-widest uppercase opacity-80">Now Playing</span>
              </div>
              {/* 收起按钮 */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
            </div>

            {/* MetingJS 容器 */}
            <div className="px-2 pb-2">
              {isLoaded ? (
                <div dangerouslySetInnerHTML={{
                  __html: `
                    <meting-js
                      server="netease"
                      type="playlist"
                      id="${playlistId}"
                      theme="#ec4899"
                      autoplay="false" 
                      order="list"
                      loop="all"
                      preload="auto"
                      list-folded="true"
                      lrc-type="1"
                      fixed="false"
                      mini="false">
                    </meting-js>
                  `
                }} />
              ) : (
                <div className="h-32 flex items-center justify-center text-xs opacity-50">
                  Loading Player...
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* 悬浮开关按钮 (黑胶唱片风格) */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="
            relative group w-12 h-12 md:w-14 md:h-14 
            rounded-full shadow-lg shadow-pink-500/20
            border-2 border-white/50 dark:border-white/10
            overflow-hidden
            bg-slate-900
          "
        >
          {/* 旋转动画图 (可以用你的 logo 或者网易云 icon) */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-900 to-slate-800"
          >
            {/* 中心点 */}
            <div className="w-1/3 h-1/3 rounded-full bg-pink-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
            </div>
            {/* 纹理装饰 */}
            <div className="absolute inset-0 rounded-full border border-white/10 scale-75"></div>
          </motion.div>

          {/* 状态指示点 (打开时显示) */}
          {isOpen && (
            <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-slate-900"></div>
          )}
        </motion.button>
      </div>
    </>
  );
}

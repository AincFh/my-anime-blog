import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isMobileDevice } from "~/utils/performance";

// 使用第三方 Live2D 看板娘库：live2d-widget.js
export function Live2D() {
    const [isVisible, setIsVisible] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [dialog, setDialog] = useState<string>("");
    const lastActivityRef = useRef<number>(Date.now());
    const scrollBottomTriggeredRef = useRef<boolean>(false);
    const [isMobile, setIsMobile] = useState(false);

    // 检测移动端
    useEffect(() => {
        setIsMobile(isMobileDevice());
    }, []);

    useEffect(() => {
        // 移动端不加载 Live2D 以提升性能
        if (!isVisible || !containerRef.current || isMobile) return;

        // 延迟加载，避免影响页面初始渲染
        const timer = setTimeout(() => {
            // 动态加载 live2d-widget.js 库
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/live2d-widget@3.0.5/lib/L2Dwidget.min.js';
            script.async = true;
            script.onload = () => {
                // 配置并初始化 Live2D 看板娘
                // @ts-ignore - live2d-widget.js 没有类型定义
                window.L2Dwidget.init({
                    model: {
                        // 选择一个可爱的模型
                        jsonPath: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-shizuku@1.0.5/assets/shizuku.model.json',
                    },
                    display: {
                        position: 'right',
                        width: 120, // 减小尺寸
                        height: 240, // 减小尺寸
                        hOffset: 0,
                        vOffset: -20,
                    },
                    mobile: {
                        show: false, // 移动端禁用 Live2D 提升性能
                        scale: 0.6,
                    },
                    react: {
                        opacityDefault: 0.7, // 降低默认透明度
                        opacityOnHover: 0.8, // 降低悬停透明度
                    },
                    dialog: {
                        enable: true,
                        scripts: {
                            welcome: [
                                '欢迎来到我的博客！',
                                '今天也要元气满满哦~',
                            ],
                            click: [
                                '哎呀，你戳我干嘛？',
                                '好痒~',
                                'Master，有什么事吗？',
                            ],
                        },
                    },
                });
                setIsLoaded(true);
            };

            document.body.appendChild(script);

            return () => {
                clearTimeout(timer);
                // 清理 live2d-widget.js
                // @ts-ignore
                if (window.L2Dwidget) {
                    // @ts-ignore
                    window.L2Dwidget.destroy();
                }
                document.body.removeChild(script);
            };
        }, 3000); // 延迟3秒加载，避免影响页面初始渲染

        return () => clearTimeout(timer);
    }, [isVisible]);

    // 智能对话系统
    useEffect(() => {
        if (!isLoaded || typeof window === 'undefined') return;

        // 1. 位置检测：滚动到底部
        const handleScroll = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.scrollY;
            const scrollBottom = scrollTop + windowHeight >= documentHeight - 50;

            if (scrollBottom && !scrollBottomTriggeredRef.current) {
                scrollBottomTriggeredRef.current = true;
                const messages = [
                    "看来你很喜欢这一篇呢~",
                    "读完了吗？要不要看看其他文章？",
                    "Master，你读得好认真呢！",
                ];
                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                setDialog(randomMessage);
                setTimeout(() => setDialog(""), 3000);
            } else if (!scrollBottom) {
                scrollBottomTriggeredRef.current = false;
            }
        };

        // 2. 时间检测：深夜提醒
        const checkTime = () => {
            const hour = new Date().getHours();
            if (hour >= 2 && hour < 6) {
                const messages = [
                    "Master，还不睡会导致秃头哦。",
                    "已经这么晚了，要注意身体呢~",
                    "熬夜对身体不好，快去休息吧！",
                ];
                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                setDialog(randomMessage);
                setTimeout(() => setDialog(""), 4000);
            }
        };

        // 3. 用户不活动检测（30秒无鼠标移动）
        const handleActivity = () => {
            lastActivityRef.current = Date.now();
        };

        const checkInactivity = () => {
            const timeSinceLastActivity = Date.now() - lastActivityRef.current;
            if (timeSinceLastActivity > 30000 && !dialog) {
                const messages = [
                    "Master，你还在吗？",
                    "敲敲屏幕~ 有人吗？",
                    "是不是在看其他东西？",
                ];
                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                setDialog(randomMessage);
                setTimeout(() => setDialog(""), 3000);
            }
        };

        // 初始化时间检测（页面加载后5秒）
        setTimeout(checkTime, 5000);

        // 监听滚动
        window.addEventListener('scroll', handleScroll, { passive: true });

        // 监听用户活动
        window.addEventListener('mousemove', handleActivity, { passive: true });
        window.addEventListener('click', handleActivity, { passive: true });
        window.addEventListener('keydown', handleActivity, { passive: true });

        // 定期检查不活动状态
        const inactivityInterval = setInterval(checkInactivity, 5000);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            clearInterval(inactivityInterval);
        };
    }, [isLoaded, dialog]);

    // 移动端完全不渲染
    if (isMobile) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="relative group"
                    >
                        {/* 看板娘容器 */}
                        <div
                            ref={containerRef}
                            className="w-32 h-48"
                        >
                            {!isLoaded && (
                                <div className="w-full h-full flex items-center justify-center opacity-50">
                                    <div className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>

                        {/* 关闭按钮 */}
                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-2 right-2 w-6 h-6 bg-black/20 hover:bg-black/40
                         backdrop-blur-sm rounded-full flex items-center justify-center
                         text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            ✕
                        </button>

                        {/* 智能对话气泡 */}
                        <AnimatePresence>
                            {dialog && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.8 }}
                                    className="absolute bottom-full right-0 mb-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 max-w-xs"
                                    style={{ zIndex: 1000 }}
                                >
                                    <p className="text-sm text-slate-800 font-medium">{dialog}</p>
                                    {/* 气泡小三角 */}
                                    <div className="absolute bottom-0 right-4 translate-y-1/2 rotate-45 w-3 h-3 bg-white/90 border-r border-b border-white/50" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 显示按钮已移除 */}
        </div>
    );
}

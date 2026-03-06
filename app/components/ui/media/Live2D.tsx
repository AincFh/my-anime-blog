import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isMobileDevice } from "~/utils/performance";
import { UI_CONSTANTS } from "~/config";

/**
 * Live2D - 看板娘组件
 * 核心哲学：性能优先，端能力区分。
 * 统合了智能对话系统（深夜提醒、不活动检测）与中心化配置。
 */
export function Live2D() {
    const [isVisible, setIsVisible] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [dialog, setDialog] = useState<string>("");

    const lastActivityRef = useRef<number>(Date.now());
    const scrollBottomTriggeredRef = useRef<boolean>(false);
    const scriptRef = useRef<HTMLScriptElement | null>(null);

    // 1. 初始化端检测
    useEffect(() => {
        setIsMobile(isMobileDevice());
    }, []);

    // 2. PC 端加载与初始化
    useEffect(() => {
        if (isMobile || !isVisible || typeof document === 'undefined') return;

        const timer = setTimeout(() => {
            const script = document.createElement('script');
            script.src = UI_CONSTANTS.live2d.scriptSrc;
            script.async = true;
            scriptRef.current = script;

            script.onload = () => {
                const config = {
                    model: { jsonPath: UI_CONSTANTS.live2d.modelPath },
                    display: {
                        position: 'right',
                        width: UI_CONSTANTS.live2d.width,
                        height: UI_CONSTANTS.live2d.height,
                        hOffset: 0,
                        vOffset: -20,
                    },
                    mobile: { show: false },
                    react: {
                        opacityDefault: UI_CONSTANTS.live2d.opacity.default,
                        opacityOnHover: UI_CONSTANTS.live2d.opacity.hover,
                    },
                    dialog: {
                        enable: true,
                        scripts: {
                            welcome: ['欢迎来到我的博客！', '今天也要元气满满哦~'],
                            click: ['哎呀，你戳我干嘛？', 'Master，有什么事吗？', '好痒~'],
                        },
                    },
                };

                // @ts-ignore
                if (window.L2Dwidget) {
                    // @ts-ignore
                    window.L2Dwidget.init(config);
                    setIsLoaded(true);
                }
            };

            document.body.appendChild(script);
        }, 2000);

        return () => {
            clearTimeout(timer);
            const widget = document.getElementById('live2d-widget');
            if (widget) widget.remove();
            if (scriptRef.current?.parentNode) {
                scriptRef.current.parentNode.removeChild(scriptRef.current);
            }
        };
    }, [isMobile, isVisible]);

    // 3. 智能交互系统
    useEffect(() => {
        if (isMobile || !isLoaded) return;

        const handleScroll = () => {
            const isBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;
            if (isBottom && !scrollBottomTriggeredRef.current) {
                scrollBottomTriggeredRef.current = true;
                const msgs = ["看来你很喜欢这一篇呢~", "读完了吗？要不要看看其他文章？", "Master，你读得好认真呢！"];
                setDialog(msgs[Math.floor(Math.random() * msgs.length)]);
                setTimeout(() => setDialog(""), 3000);
            } else if (!isBottom) {
                scrollBottomTriggeredRef.current = false;
            }
        };

        const checkTime = () => {
            const hour = new Date().getHours();
            if (hour >= 2 && hour < 6) {
                const msgs = ["Master，还不睡会导致秃头哦。", "已经这么晚了，要注意身体呢~", "熬夜对身体不好，快去休息吧！"];
                setDialog(msgs[Math.floor(Math.random() * msgs.length)]);
                setTimeout(() => setDialog(""), 4000);
            }
        };

        const handleActivity = () => { lastActivityRef.current = Date.now(); };
        const checkInactivity = () => {
            if (Date.now() - lastActivityRef.current > 30000 && !dialog) {
                const msgs = ["Master，你还在吗？", "敲敲屏幕~ 有人吗？", "是不是在看其他东西？"];
                setDialog(msgs[Math.floor(Math.random() * msgs.length)]);
                setTimeout(() => setDialog(""), 3000);
            }
        };

        setTimeout(checkTime, 5000);
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('mousemove', handleActivity, { passive: true });
        window.addEventListener('mousedown', handleActivity, { passive: true });

        const interval = setInterval(checkInactivity, 10000);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('mousedown', handleActivity);
            clearInterval(interval);
        };
    }, [isMobile, isLoaded, dialog]);

    if (isMobile) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 hidden lg:block pointer-events-none lg:pointer-events-auto">
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="relative group w-32 h-48 pointer-events-auto"
                    >
                        <div className="w-32 h-48">
                            {!isLoaded && (
                                <div className="w-full h-full flex items-center justify-center opacity-30">
                                    <div className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-2 right-2 w-6 h-6 bg-black/20 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            ✕
                        </button>

                        <AnimatePresence>
                            {dialog && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="absolute bottom-full right-0 mb-4 px-4 py-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 min-w-[120px]"
                                >
                                    <p className="text-xs text-slate-800 font-bold">{dialog}</p>
                                    <div className="absolute bottom-[-6px] right-4 w-3 h-3 bg-white/95 rotate-45 border-r border-b border-white/50" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

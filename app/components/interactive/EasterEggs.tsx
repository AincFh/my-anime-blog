/**
 * 彩蛋交互系统
 * 包含多种隐藏的趣味交互，增强用户探索感
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ==================== Konami Code 彩蛋 ====================
// 用户输入 ↑↑↓↓←→←→BA 后触发特效

const KONAMI_SEQUENCE = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
    "b", "a",
];

export function KonamiCodeEasterEgg() {
    const [inputIndex, setInputIndex] = useState(0);
    const [triggered, setTriggered] = useState(false);
    const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; emoji: string }>>([]);

    const EMOJIS = ["✨", "🌟", "⭐", "💫", "🎉", "🎊", "🎆", "🏆", "💎", "🔮", "🌸", "🍡", "🎌"];

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (triggered) return;
            if (e.key === KONAMI_SEQUENCE[inputIndex]) {
                const next = inputIndex + 1;
                if (next === KONAMI_SEQUENCE.length) {
                    setTriggered(true);
                    setInputIndex(0);
                    // 生成粒子
                    const newParticles = Array.from({ length: 40 }, (_, i) => ({
                        id: Date.now() + i,
                        x: Math.random() * window.innerWidth,
                        y: Math.random() * window.innerHeight,
                        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
                    }));
                    setParticles(newParticles);
                    // 5 秒后清除
                    setTimeout(() => {
                        setTriggered(false);
                        setParticles([]);
                    }, 5000);
                } else {
                    setInputIndex(next);
                }
            } else {
                setInputIndex(0);
            }
        }
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [inputIndex, triggered]);

    return (
        <AnimatePresence>
            {triggered && (
                <>
                    {/* 全屏粒子雨 */}
                    <div className="fixed inset-0 pointer-events-none z-[9999]">
                        {particles.map(p => (
                            <motion.div
                                key={p.id}
                                initial={{ x: p.x, y: -50, opacity: 1, scale: 0, rotate: 0 }}
                                animate={{
                                    y: window.innerHeight + 100,
                                    opacity: [1, 1, 0],
                                    scale: [0, 1.5, 1],
                                    rotate: [0, 360, 720],
                                }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 3 + Math.random() * 2, ease: "easeOut" }}
                                className="absolute text-2xl"
                                style={{ left: p.x }}
                            >
                                {p.emoji}
                            </motion.div>
                        ))}
                    </div>

                    {/* 中心提示 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]"
                    >
                        <div className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-3xl px-12 py-8 text-center">
                            <div className="text-6xl mb-4">🎮</div>
                            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-500 to-violet-500 mb-2">
                                KONAMI CODE!
                            </h2>
                            <p className="text-white/60 text-sm">↑↑↓↓←→←→BA — 你发现了隐藏的秘密！</p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ==================== Logo 连击彩蛋 ====================
// 点击网站 Logo/标题 10 次触发

export function LogoClickEasterEgg({ children }: { children: React.ReactNode }) {
    const [clickCount, setClickCount] = useState(0);
    const [showEgg, setShowEgg] = useState(false);
    const [lastClickTime, setLastClickTime] = useState(0);

    const MESSAGES = [
        "你在点什么呢...",
        "别点了别点了！",
        "再点就要坏掉了！",
        "好吧你赢了等一下——",
        "🎉 恭喜你发现了秘密！你是一个好奇心很强的人！",
    ];

    const handleClick = useCallback(() => {
        const now = Date.now();
        if (now - lastClickTime > 2000) {
            setClickCount(1);
        } else {
            setClickCount(prev => prev + 1);
        }
        setLastClickTime(now);

        if (clickCount >= 9) {
            setShowEgg(true);
            setClickCount(0);
            setTimeout(() => setShowEgg(false), 4000);
        }
    }, [clickCount, lastClickTime]);

    const getMessage = () => {
        if (clickCount < 3) return null;
        const idx = Math.min(Math.floor((clickCount - 3) / 2), MESSAGES.length - 1);
        return MESSAGES[idx];
    };

    const currentMsg = getMessage();

    return (
        <div className="relative inline-block">
            <div onClick={handleClick} className="cursor-pointer">
                {children}
            </div>

            {/* 点击提示气泡 */}
            <AnimatePresence>
                {currentMsg && !showEgg && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: -10, scale: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute left-1/2 -translate-x-1/2 -top-2 whitespace-nowrap bg-black/80 text-white text-xs py-1.5 px-3 rounded-full pointer-events-none z-50"
                    >
                        {currentMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 最终彩蛋 */}
            <AnimatePresence>
                {showEgg && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1, rotate: [0, -5, 5, 0] }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none"
                    >
                        <div className="bg-gradient-to-br from-violet-600/90 to-pink-600/90 backdrop-blur-xl rounded-3xl p-10 text-center border border-white/20 shadow-2xl">
                            <div className="text-7xl mb-4">🏆</div>
                            <h3 className="text-2xl font-black text-white mb-2">探索者成就解锁！</h3>
                            <p className="text-white/70 text-sm">「好奇心是进步的阶梯」— 你一共点击了 10 次！</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ==================== 页面停留时间彩蛋 ====================
// 在页面停留超过 10 分钟时出现

export function IdleTimeEasterEgg() {
    const [showMessage, setShowMessage] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowMessage(true);
            setTimeout(() => setShowMessage(false), 6000);
        }, 10 * 60 * 1000); // 10 分钟

        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {showMessage && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-8 right-8 z-[9999] max-w-xs"
                >
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-start gap-3">
                            <span className="text-3xl">☕</span>
                            <div>
                                <p className="text-white font-bold text-sm mb-1">你已经浏览了 10 分钟了</p>
                                <p className="text-white/50 text-xs">要不要起来走走，喝杯水？剩下的我会帮你保管好的 ✨</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

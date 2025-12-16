import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useGamification } from "~/contexts/GamificationContext";

const GACHA_COST = 100;

const GACHA_POOL = [
    { id: "sticker_1", name: "初音未来贴纸", type: "sticker" as const, image: "🎤", rarity: "rare" as const },
    { id: "sticker_2", name: "樱花贴纸", type: "sticker" as const, image: "🌸", rarity: "common" as const },
    { id: "sticker_3", name: "星空贴纸", type: "sticker" as const, image: "✨", rarity: "epic" as const },
    { id: "wallpaper_1", name: "赛博朋克壁纸", type: "wallpaper" as const, image: "🌃", rarity: "legendary" as const },
    { id: "badge_1", name: "勇者徽章", type: "badge" as const, image: "🛡️", rarity: "epic" as const },
];

export function GachaMachine() {
    const { stats, spendCoins, addToInventory, unlockAchievement } = useGamification();
    const [isRolling, setIsRolling] = useState(false);
    const [result, setResult] = useState<typeof GACHA_POOL[0] | null>(null);

    const handleGacha = () => {
        if (stats.coins < GACHA_COST) {
            alert("金币不足！");
            return;
        }

        if (spendCoins(GACHA_COST)) {
            setIsRolling(true);

            // 模拟抽奖动画
            setTimeout(() => {
                const randomItem = GACHA_POOL[Math.floor(Math.random() * GACHA_POOL.length)];
                setResult(randomItem);
                addToInventory({
                    ...randomItem,
                    obtainedAt: Date.now(),
                });
                unlockAchievement("gacha_master");
                setIsRolling(false);
            }, 2000);
        }
    };

    return (
        <div className="relative">
            {/* Gacha Machine UI */}
            <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 p-8 rounded-3xl shadow-2xl">
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">扭蛋机</h3>
                    <p className="text-white/80 text-sm">消耗 {GACHA_COST} 金币抽取奖励</p>
                </div>

                {/* Capsule Display */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-6 h-48 flex items-center justify-center relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {isRolling ? (
                            <motion.div
                                key="rolling"
                                initial={{ scale: 0, rotate: 0 }}
                                animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.5, repeat: 3 }}
                                className="text-6xl"
                            >
                                🎰
                            </motion.div>
                        ) : result ? (
                            <motion.div
                                key="result"
                                initial={{ scale: 0, y: -50 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0 }}
                                className="text-center"
                            >
                                <div className="text-7xl mb-2">{result.image}</div>
                                <div className="text-white font-bold">{result.name}</div>
                                <div className="text-sm text-yellow-300">{result.rarity.toUpperCase()}</div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="idle"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-6xl"
                            >
                                🎁
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Sparkles */}
                    {(isRolling || result) && (
                        <>
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: [0, 1, 0],
                                        scale: [0, 1, 0],
                                        x: Math.cos((i / 8) * Math.PI * 2) * 80,
                                        y: Math.sin((i / 8) * Math.PI * 2) * 80,
                                    }}
                                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                                />
                            ))}
                        </>
                    )}
                </div>

                {/* Pull Button */}
                <motion.button
                    onClick={handleGacha}
                    disabled={isRolling || stats.coins < GACHA_COST}
                    className="w-full bg-white text-purple-600 font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {isRolling ? "抽取中..." : `抽取 (${stats.coins} 💰)`}
                </motion.button>

                {result && (
                    <motion.button
                        onClick={() => setResult(null)}
                        className="w-full mt-2 bg-purple-600 text-white font-bold py-2 rounded-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        继续
                    </motion.button>
                )}
            </div>
        </div>
    );
}

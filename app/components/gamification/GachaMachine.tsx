import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Sparkles, Coins, Gift } from "lucide-react";
import { toast } from "~/components/ui/Toast";
import { useFetcher } from "react-router";

const GACHA_COST = 100;

export function GachaMachine() {
    const fetcher = useFetcher();
    const [isRolling, setIsRolling] = useState(false);
    const [result, setResult] = useState<{
        id: string;
        name: string;
        type: "sticker" | "wallpaper" | "badge";
        image: string;
        rarity: "common" | "rare" | "epic" | "legendary";
    } | null>(null);

    // 服务器返回的当前余额
    const balance = fetcher.data?.balance as number | undefined;
    const coins = balance ?? fetcher.data?.coins ?? 0;

    const handleGacha = () => {
        if (isRolling) return;

        if (coins < GACHA_COST) {
            toast.error("金币不足！");
            return;
        }

        setIsRolling(true);
        setResult(null);

        fetcher.submit({}, { method: "post", action: "/api/user/gacha" });
    };

    // 监听服务器响应，使用 useEffect 避免渲染期间调用 setState
    useEffect(() => {
        const responseData = fetcher.data;
        if (responseData && !isRolling) {
            if (responseData.success && responseData.item) {
                setResult(responseData.item);
                // 解锁成就
                // unlockAchievement("gacha_master");
            } else if (responseData.error) {
                toast.error(responseData.error);
            }
        }
    }, [fetcher.data, isRolling]);

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
                                className="text-white"
                            >
                                <Sparkles className="w-12 h-12" />
                            </motion.div>
                        ) : result ? (
                            <motion.div
                                key="result"
                                initial={{ scale: 0, y: -50 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                                    <Gift className="w-12 h-12 text-white" />
                                </div>
                                <div className="text-white font-bold">{result.name}</div>
                                <div className="text-sm text-yellow-300">{result.rarity.toUpperCase()}</div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="idle"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-white"
                            >
                                <Gift className="w-12 h-12" />
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
                    disabled={isRolling || fetcher.state === "submitting"}
                    className="w-full bg-white text-purple-600 font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {isRolling || fetcher.state === "submitting"
                        ? "抽取中..."
                        : <><Sparkles className="w-5 h-5" /> 抽取 ({coins} 金币)</>}
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

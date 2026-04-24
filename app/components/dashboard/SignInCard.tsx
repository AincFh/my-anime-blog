import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useFetcher } from "react-router";
import { Check, Calendar as CalendarIcon, ChevronDown, ChevronUp, AlertCircle, Sparkles } from "lucide-react";

interface SignInDay {
    date: string;        // YYYY-MM-DD
    formatted: string;   // "4月18日"
    signedIn: boolean;
    isMakeup: boolean;
    isToday: boolean;
    isFuture: boolean;
    rewardCoins: number;
}

interface MakeupInfo {
    canMakeup: boolean;
    missedDays: string[];
    missedDaysFormatted: string[];
    consecutiveMakeupCount: number;
    currentCost: number;
    maxDaysBack: number;
}

interface SignInCardProps {
    hasSignedIn: boolean;
    consecutiveDays: number;
    lastSignInDate?: string;
    makeupInfo?: MakeupInfo;
    currentMonth?: SignInDay[];
    userCoins?: number;
}

export function SignInCard({
    hasSignedIn,
    consecutiveDays,
    makeupInfo,
    currentMonth = [],
    userCoins = 0,
}: SignInCardProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedMakeupDate, setSelectedMakeupDate] = useState<string | null>(null);
    const [selectedMakeupFormatted, setSelectedMakeupFormatted] = useState<string>("");
    const [makeupLoading, setMakeupLoading] = useState(false);
    const [makeupResult, setMakeupResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

    const fetcher = useFetcher();

    const isSubmitting = fetcher.state === "submitting";
    const isDone = hasSignedIn || (fetcher.data as any)?.success;

    // 乐观 UI：签到成功后立即更新状态
    useEffect(() => {
        if ((fetcher.data as any)?.success) {
            // 触发成就系统
            try {
                const streak = (fetcher.data as any)?.streak || 1;
                const { onSignIn } = require("~/components/ui/system/AchievementSystem");
                onSignIn(streak);
            } catch { /* ignore */ }
        }
    }, [fetcher.data]);

    // 补签成功后关闭弹窗并刷新页面
    useEffect(() => {
        if ((makeupFetcher.data as any)?.success) {
            setSelectedMakeupDate(null);
        }
    }, [makeupFetcher.data]);

    const handleSignIn = () => {
        if (isDone || isSubmitting) return;
        fetcher.submit({}, { method: "post", action: "/api/daily-signin" });
    };

    const handleMakeupClick = (day: SignInDay) => {
        if (day.signedIn || day.isFuture || day.isToday) return;
        setMakeupResult(null);
        setSelectedMakeupDate(day.date);
        setSelectedMakeupFormatted(day.formatted);
    };

    // 计算补签费用的显示
    const makeupCost = makeupInfo?.currentCost || 50;
    const canAfford = userCoins >= makeupCost;

    // 补签费用表格（用于显示）
    // 公式：30 + (n-1) * 20，封顶100
    const costTable = useMemo(() => [
        { times: 1, cost: 30 },
        { times: 2, cost: 50 },
        { times: 3, cost: 70 },
        { times: 4, cost: 90 },
        { times: 5, cost: 100 },
    ], []);

    return (
        <>
            <motion.div
                className="glass-card rounded-2xl p-6 relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* 背景装饰 */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none" />

                <div className="flex justify-between items-start mb-4 relative">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-primary-500" />
                            每日签到
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            已连续签到 <span className="text-primary-500 font-bold">{consecutiveDays}</span> 天
                        </p>
                    </div>
                    {isDone ? (
                        <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            已签到
                        </div>
                    ) : (
                        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-sm font-bold">
                            今日未签
                        </div>
                    )}
                </div>

                {/* 主要签到按钮 */}
                <div className="flex justify-center my-6">
                    <motion.button
                        onClick={handleSignIn}
                        disabled={isDone || isSubmitting}
                        whileHover={{ scale: isDone ? 1 : 1.05 }}
                        whileTap={{ scale: isDone ? 1 : 0.95 }}
                        className={`
                            w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-lg transition-all
                            ${isDone
                                ? "bg-gradient-to-br from-green-400 to-emerald-500 cursor-default"
                                : "bg-gradient-to-br from-primary-400 to-primary-600 hover:shadow-primary-500/50 cursor-pointer"
                            }
                        `}
                    >
                        {isDone ? (
                            <>
                                <Check className="w-12 h-12 text-white mb-1" />
                                <span className="text-white font-bold text-sm">明日再来</span>
                            </>
                        ) : (
                            <>
                                {isSubmitting ? (
                                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <span className="text-4xl mb-1">✍️</span>
                                )}
                                <span className="text-white font-bold text-lg mt-1">
                                    {isSubmitting ? "签到中..." : "签到"}
                                </span>
                            </>
                        )}
                    </motion.button>
                </div>

                {/* 连续签到进度条 */}
                <div className="flex justify-center gap-1 mb-4">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-6 h-1.5 rounded-full transition-all duration-300 ${
                                i < (consecutiveDays % 7 || (consecutiveDays > 0 ? 7 : 0))
                                    ? "bg-primary-500"
                                    : "bg-slate-200 dark:bg-slate-700"
                            }`}
                        />
                    ))}
                </div>

                {/* 底部折叠开关 */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <button
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                        className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-primary-500 transition-colors"
                    >
                        {isCalendarOpen ? "收起日历" : "查看签到记录"}
                        {isCalendarOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <AnimatePresence>
                        {isCalendarOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4">
                                    {/* 补签提示 */}
                                    {makeupInfo?.canMakeup && (
                                        <div className="mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span>你有 {makeupInfo.missedDays.length} 天漏签，点击橙色格子可补签</span>
                                        </div>
                                    )}

                                    {/* 日历头部 */}
                                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 mb-1">
                                        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                                            <div key={d} className="py-1">{d}</div>
                                        ))}
                                    </div>

                                    {/* 日历格子 */}
                                    <div className="grid grid-cols-7 gap-1 text-center">
                                        {currentMonth.map((day) => {
                                            const isMissed = !day.signedIn && !day.isFuture;
                                            const isClickable = isMissed && !day.isToday;

                                            return (
                                                <motion.button
                                                    key={day.date}
                                                    onClick={() => handleMakeupClick(day)}
                                                    disabled={!isClickable}
                                                    whileHover={isClickable ? { scale: 1.1 } : {}}
                                                    whileTap={isClickable ? { scale: 0.95 } : {}}
                                                    className={`
                                                        aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative
                                                        transition-all duration-200
                                                        ${day.isToday ? "border-2 border-primary-500" : ""}
                                                        ${day.signedIn
                                                            ? day.isMakeup
                                                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                                                : "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                                                            : day.isFuture
                                                                ? "text-slate-300 dark:text-slate-600 cursor-default"
                                                                : isMissed
                                                                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-900/50"
                                                                    : "text-slate-500"
                                                        }
                                                    `}
                                                >
                                                    <span className="font-medium">{day.date.split('-')[2].replace(/^0/, '')}</span>
                                                    {day.signedIn && (
                                                        <Check className="w-2.5 h-2.5 absolute top-0.5 right-0.5 text-primary-500" />
                                                    )}
                                                    {isMissed && (
                                                        <div className="w-1 h-1 rounded-full bg-amber-400 absolute bottom-0.5" />
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    {/* 日历图例 */}
                                    <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded bg-primary-400" />
                                            <span>已签到</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded bg-blue-400" />
                                            <span>补签</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded bg-amber-400" />
                                            <span>可补签</span>
                                        </div>
                                    </div>

                                    {/* 补签费用说明 */}
                                    {makeupInfo?.canMakeup && (
                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 text-center">
                                                补签费用随次数递增（本月累计）
                                            </p>
                                            <div className="flex justify-center gap-1">
                                                {costTable.map((row) => (
                                                    <div
                                                        key={row.times}
                                                        className={`text-xs px-2 py-1 rounded ${
                                                            row.times === makeupInfo.consecutiveMakeupCount
                                                                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold"
                                                                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                                        }`}
                                                    >
                                                        {row.cost}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* 补签确认弹窗 */}
            <AnimatePresence>
                {selectedMakeupDate && (
                    <>
                        {/* 遮罩 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedMakeupDate(null)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        />

                        {/* 弹窗 */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="glass-card rounded-2xl p-6 w-full max-w-sm pointer-events-auto">
                                {/* 标题 */}
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">补签确认</h3>
                                </div>

                                {/* 信息卡片 */}
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                                        <span className="text-slate-500 dark:text-slate-400 text-sm">补签日期</span>
                                        <span className="font-bold text-slate-800 dark:text-white">{selectedMakeupFormatted}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                                        <span className="text-slate-500 dark:text-slate-400 text-sm">应得奖励</span>
                                        <span className="font-bold text-primary-500">+5 星尘</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                                        <span className="text-slate-500 dark:text-slate-400 text-sm">本月补签次数</span>
                                        <span className="font-bold text-slate-800 dark:text-white">
                                            第{makeupInfo?.consecutiveMakeupCount || 1}次
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                                        <span className="text-slate-500 dark:text-slate-400 text-sm">补签费用</span>
                                        <span className={`font-bold ${canAfford ? "text-red-500" : "text-red-400"}`}>
                                            -{makeupCost} 星尘
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-slate-500 dark:text-slate-400 text-sm">当前余额</span>
                                        <span className="font-bold text-slate-800 dark:text-white">{userCoins} 星尘</span>
                                    </div>
                                </div>

                                {/* 警告 */}
                                {!canAfford && (
                                    <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 mb-4">
                                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>余额不足，需要 {makeupCost} 星尘</span>
                                    </div>
                                )}

                                {/* 提示 */}
                                <p className="text-xs text-slate-400 mb-4">
                                    补签费用会随次数递增，                                        下一次补签将花费 {
                                        Math.min(30 + makeupInfo!.consecutiveMakeupCount * 20, 100)
                                    } 星尘
                                </p>

                                {/* 操作按钮 */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSelectedMakeupDate(null)}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleMakeupConfirm}
                                        disabled={!canAfford || makeupLoading}
                                        className={`
                                            flex-1 py-2.5 rounded-xl text-sm font-bold transition-all
                                            ${canAfford && !makeupLoading
                                                ? "bg-gradient-to-r from-amber-400 to-amber-600 text-white hover:shadow-amber-500/30 hover:shadow-lg"
                                                : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                                            }
                                        `}
                                    >
                                        {makeupLoading ? "补签中..." : "确认补签"}
                                    </button>
                                </div>

                                {/* 补签结果反馈 */}
                                <div className="mt-3 min-h-[36px]">
                                    <AnimatePresence>
                                        {makeupResult?.error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="text-xs text-red-500 text-center bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2"
                                            >
                                                {makeupResult.error}
                                            </motion.div>
                                        )}
                                        {makeupResult?.success && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="text-xs text-green-600 dark:text-green-400 text-center bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2"
                                            >
                                                {makeupResult.message || "补签成功！"}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

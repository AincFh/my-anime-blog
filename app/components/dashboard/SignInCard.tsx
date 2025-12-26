import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useFetcher } from "react-router";
import { Check, Calendar as CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";

interface SignInCardProps {
    hasSignedIn: boolean;
    consecutiveDays: number;
    lastSignInDate?: string;
}

export function SignInCard({ hasSignedIn, consecutiveDays, lastSignInDate }: SignInCardProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const fetcher = useFetcher();
    const isSubmitting = fetcher.state === "submitting";

    // 乐观 UI 更新
    const isDone = hasSignedIn || (fetcher.data as any)?.success;

    const handleSignIn = () => {
        if (isDone || isSubmitting) return;
        fetcher.submit({}, { method: "post", action: "/api/daily-signin" });
    };

    return (
        <motion.div
            className="glass-card rounded-2xl p-6 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex justify-between items-start mb-4">
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
                    <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full text-sm">
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
                            <div className="pt-4 grid grid-cols-7 gap-1 text-center text-sm">
                                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                                    <div key={d} className="text-slate-400 text-xs py-1">{d}</div>
                                ))}
                                {/* 简单的日历占位，实际应根据当前月份生成 */}
                                {Array.from({ length: 30 }).map((_, i) => {
                                    const day = i + 1;
                                    // 简单的模拟逻辑：假设前几天都签到了
                                    const isSigned = day <= consecutiveDays;
                                    const isToday = day === new Date().getDate();

                                    return (
                                        <div
                                            key={i}
                                            className={`
                                                aspect-square flex items-center justify-center rounded-lg text-xs
                                                ${isSigned ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600" : "text-slate-500"}
                                                ${isToday ? "border border-primary-500" : ""}
                                            `}
                                        >
                                            {day}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

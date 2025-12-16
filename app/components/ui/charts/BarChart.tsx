import { motion } from "framer-motion";

interface BarChartProps {
    data: { label: string; value: number; color?: string; icon?: React.ReactNode }[];
    orientation?: "horizontal" | "vertical";
    showValues?: boolean;
    maxValue?: number;
}

export function BarChart({
    data,
    orientation = "horizontal",
    showValues = true,
    maxValue: customMax
}: BarChartProps) {
    const maxValue = customMax || Math.max(...data.map(d => d.value));

    if (orientation === "vertical") {
        return (
            <div className="flex items-end justify-around gap-2 h-48 px-4">
                {data.map((item, index) => {
                    const height = (item.value / maxValue) * 100;
                    return (
                        <div key={item.label} className="flex flex-col items-center gap-2">
                            <motion.div
                                className="w-8 rounded-t-lg relative group"
                                style={{
                                    backgroundColor: item.color || "#3B82F6",
                                }}
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                {showValues && (
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.value}
                                    </span>
                                )}
                            </motion.div>
                            <span className="text-xs text-gray-400 text-center max-w-[60px] truncate">
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {data.map((item, index) => {
                const width = (item.value / maxValue) * 100;
                return (
                    <motion.div
                        key={item.label}
                        className="space-y-1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                {item.icon}
                                <span className="text-gray-300">{item.label}</span>
                            </div>
                            {showValues && (
                                <span className="text-gray-400">{item.value.toLocaleString()}</span>
                            )}
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: item.color || "#3B82F6" }}
                                initial={{ width: 0 }}
                                animate={{ width: `${width}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                            />
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

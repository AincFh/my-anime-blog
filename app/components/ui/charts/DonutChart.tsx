import { motion } from "framer-motion";
import { useMemo } from "react";

interface DonutChartProps {
    data: { label: string; value: number; color: string }[];
    size?: number;
    thickness?: number;
    showLabels?: boolean;
}

export function DonutChart({
    data,
    size = 200,
    thickness = 40,
    showLabels = true
}: DonutChartProps) {
    const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

    const segments = useMemo(() => {
        let currentAngle = -90; // Start from top
        return data.map((item) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const segment = {
                ...item,
                percentage,
                startAngle: currentAngle,
                endAngle: currentAngle + angle,
            };
            currentAngle += angle;
            return segment;
        });
    }, [data, total]);

    const radius = (size - thickness) / 2;
    const center = size / 2;

    const polarToCartesian = (angle: number) => {
        const radian = (angle * Math.PI) / 180;
        return {
            x: center + radius * Math.cos(radian),
            y: center + radius * Math.sin(radian),
        };
    };

    const createArcPath = (startAngle: number, endAngle: number) => {
        const start = polarToCartesian(startAngle);
        const end = polarToCartesian(endAngle);
        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

        return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
    };

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {segments.map((segment, index) => (
                    <motion.path
                        key={segment.label}
                        d={createArcPath(segment.startAngle, segment.endAngle - 0.5)}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth={thickness}
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{
                            duration: 1,
                            delay: index * 0.1,
                            ease: "easeOut"
                        }}
                    />
                ))}
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{total.toLocaleString()}</span>
                <span className="text-xs text-gray-400">总访问</span>
            </div>

            {/* Legend */}
            {showLabels && (
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 translate-x-full space-y-2 pl-4">
                    {segments.map((segment) => (
                        <motion.div
                            key={segment.label}
                            className="flex items-center gap-2 text-sm"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: segment.color }}
                            />
                            <span className="text-gray-300">{segment.label}</span>
                            <span className="text-gray-500 ml-1">
                                {segment.percentage.toFixed(1)}%
                            </span>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

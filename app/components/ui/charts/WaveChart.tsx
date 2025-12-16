import { motion } from "framer-motion";
import { useMemo } from "react";

interface WaveChartProps {
    data: number[];
    color?: string;
    height?: number;
}

export function WaveChart({ data, color = "#3B82F6", height = 100 }: WaveChartProps) {
    const points = useMemo(() => {
        const width = 100;
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;

        return data.map((value, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = 100 - ((value - min) / range) * 100;
            return `${x},${y}`;
        }).join(" ");
    }, [data]);

    const pathD = `M0,100 ${points.split(" ").map((p, i) => {
        const [x, y] = p.split(",");
        return `L${x},${y}`;
    }).join(" ")} L100,100 Z`;

    // Smooth curve using cubic bezier (simplified)
    // For a real smooth wave, we would calculate control points.
    // Here we use a simple polygon for performance, but we can animate it.

    return (
        <div className="relative w-full overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10" style={{ height }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.0} />
                    </linearGradient>
                </defs>
                <motion.path
                    d={pathD}
                    fill={`url(#gradient-${color})`}
                    stroke={color}
                    strokeWidth="0.5"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />
            </svg>

            {/* Real-time Indicator */}
            <div className="absolute top-2 right-2 flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] text-gray-400">Live</span>
            </div>
        </div>
    );
}

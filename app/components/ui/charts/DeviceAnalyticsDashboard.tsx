import { motion } from "framer-motion";
import {
    Monitor,
    Smartphone,
    Tablet,
    Globe,
    Chrome,
    Apple,
    Cpu,
    MapPin
} from "lucide-react";
import { DonutChart } from "./DonutChart";
import { BarChart } from "./BarChart";

// 设备类型数据
const deviceTypeData = [
    { label: "桌面端", value: 4521, color: "#3B82F6" },
    { label: "移动端", value: 3892, color: "#10B981" },
    { label: "平板", value: 1234, color: "#8B5CF6" },
    { label: "其他", value: 156, color: "#F59E0B" },
];

// 浏览器数据
const browserData = [
    { label: "Chrome", value: 5234, color: "#4285F4", icon: <Chrome className="w-4 h-4 text-[#4285F4]" /> },
    { label: "Safari", value: 2156, color: "#000000", icon: <Apple className="w-4 h-4 text-gray-300" /> },
    { label: "Firefox", value: 1023, color: "#FF7139", icon: <Globe className="w-4 h-4 text-[#FF7139]" /> },
    { label: "Edge", value: 876, color: "#0078D7", icon: <Globe className="w-4 h-4 text-[#0078D7]" /> },
    { label: "Samsung", value: 342, color: "#1428A0", icon: <Smartphone className="w-4 h-4 text-[#1428A0]" /> },
    { label: "其他", value: 172, color: "#6B7280", icon: <Globe className="w-4 h-4 text-gray-400" /> },
];

// 操作系统数据
const osData = [
    { label: "Windows", value: 3845, color: "#00A4EF" },
    { label: "macOS", value: 2134, color: "#A3AAAE" },
    { label: "iOS", value: 1923, color: "#000000" },
    { label: "Android", value: 1567, color: "#3DDC84" },
    { label: "Linux", value: 234, color: "#FCC624" },
];

// 手机品牌数据
const phoneBrandData = [
    { label: "iPhone", value: 2456, color: "#A3AAAE", icon: <Apple className="w-4 h-4 text-gray-300" /> },
    { label: "Samsung", value: 1234, color: "#1428A0", icon: <Smartphone className="w-4 h-4 text-[#1428A0]" /> },
    { label: "Xiaomi", value: 876, color: "#FF6900", icon: <Smartphone className="w-4 h-4 text-[#FF6900]" /> },
    { label: "OPPO", value: 543, color: "#00A854", icon: <Smartphone className="w-4 h-4 text-[#00A854]" /> },
    { label: "vivo", value: 432, color: "#415FFF", icon: <Smartphone className="w-4 h-4 text-[#415FFF]" /> },
    { label: "Huawei", value: 321, color: "#CF0A2C", icon: <Smartphone className="w-4 h-4 text-[#CF0A2C]" /> },
];

// 具体设备型号数据
const deviceModelData = [
    { label: "iPhone 15 Pro Max", value: 456, color: "#A3AAAE" },
    { label: "iPhone 14 Pro", value: 398, color: "#A3AAAE" },
    { label: "Samsung S24 Ultra", value: 312, color: "#1428A0" },
    { label: "iPhone 13", value: 287, color: "#A3AAAE" },
    { label: "iPad Pro 12.9", value: 234, color: "#A3AAAE" },
    { label: "Xiaomi 14 Ultra", value: 198, color: "#FF6900" },
    { label: "Samsung S23", value: 176, color: "#1428A0" },
    { label: "iPad Air", value: 156, color: "#A3AAAE" },
];

// 屏幕分辨率数据
const screenResolutionData = [
    { label: "1920x1080", value: 2345, color: "#3B82F6" },
    { label: "2560x1440", value: 1234, color: "#8B5CF6" },
    { label: "1366x768", value: 987, color: "#10B981" },
    { label: "3840x2160", value: 543, color: "#F59E0B" },
    { label: "390x844", value: 876, color: "#EC4899" },
    { label: "414x896", value: 654, color: "#06B6D4" },
];

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: React.ReactNode;
    trend?: "up" | "down";
}

function StatCard({ title, value, change, icon, trend }: StatCardProps) {
    return (
        <motion.div
            className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-400 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    {change && (
                        <p className={`text-xs mt-1 ${trend === "up" ? "text-green-400" : "text-red-400"}`}>
                            {trend === "up" ? "↑" : "↓"} {change}
                        </p>
                    )}
                </div>
                <div className="p-3 rounded-xl bg-white/10">
                    {icon}
                </div>
            </div>

            {/* Decorative gradient */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-2xl" />
        </motion.div>
    );
}

interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}

function ChartCard({ title, subtitle, children, className = "" }: ChartCardProps) {
    return (
        <motion.div
            className={`rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
            </div>
            {children}
        </motion.div>
    );
}

export function DeviceAnalyticsDashboard() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
            {/* Header */}
            <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold text-white mb-2">设备与浏览器分析</h1>
                <p className="text-gray-400">实时追踪访问者的设备、浏览器和系统信息</p>
            </motion.div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="总访问量"
                    value="9,803"
                    change="12.5% vs 上月"
                    trend="up"
                    icon={<Globe className="w-6 h-6 text-blue-400" />}
                />
                <StatCard
                    title="移动端占比"
                    value="52.3%"
                    change="3.2%"
                    trend="up"
                    icon={<Smartphone className="w-6 h-6 text-green-400" />}
                />
                <StatCard
                    title="独立设备"
                    value="6,234"
                    change="8.7%"
                    trend="up"
                    icon={<Cpu className="w-6 h-6 text-purple-400" />}
                />
                <StatCard
                    title="地区覆盖"
                    value="42"
                    change="5 个新地区"
                    trend="up"
                    icon={<MapPin className="w-6 h-6 text-orange-400" />}
                />
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {/* Device Type Distribution */}
                <ChartCard
                    title="设备类型分布"
                    subtitle="按访问设备类型统计"
                    className="xl:col-span-1"
                >
                    <div className="flex justify-center py-4">
                        <DonutChart data={deviceTypeData} size={180} thickness={35} showLabels={false} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {deviceTypeData.map((item) => (
                            <div key={item.label} className="flex items-center gap-2">
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-sm text-gray-300">{item.label}</span>
                                <span className="text-xs text-gray-500 ml-auto">
                                    {((item.value / deviceTypeData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                {/* Browser Distribution */}
                <ChartCard
                    title="浏览器分布"
                    subtitle="按浏览器类型统计访问量"
                    className="xl:col-span-1"
                >
                    <BarChart data={browserData} />
                </ChartCard>

                {/* OS Distribution */}
                <ChartCard
                    title="操作系统分布"
                    subtitle="按操作系统统计"
                    className="xl:col-span-1"
                >
                    <div className="flex justify-center py-4">
                        <DonutChart data={osData} size={180} thickness={35} showLabels={false} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {osData.map((item) => (
                            <div key={item.label} className="flex items-center gap-2">
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-sm text-gray-300">{item.label}</span>
                                <span className="text-xs text-gray-500 ml-auto">
                                    {((item.value / osData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </ChartCard>
            </div>

            {/* Secondary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Phone Brands */}
                <ChartCard
                    title="手机品牌分布"
                    subtitle="移动设备品牌统计"
                >
                    <BarChart data={phoneBrandData} />
                </ChartCard>

                {/* Device Models */}
                <ChartCard
                    title="热门设备型号"
                    subtitle="访问量最高的具体设备"
                >
                    <BarChart data={deviceModelData} />
                </ChartCard>
            </div>

            {/* Screen Resolution & Additional Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Screen Resolutions */}
                <ChartCard
                    title="屏幕分辨率"
                    subtitle="访问者屏幕尺寸分布"
                    className="lg:col-span-2"
                >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {screenResolutionData.map((item, index) => (
                            <motion.div
                                key={item.label}
                                className="p-4 rounded-xl bg-white/5 border border-white/10"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <div
                                    className="w-8 h-5 rounded mb-2 flex items-center justify-center"
                                    style={{ backgroundColor: item.color + "30", borderColor: item.color }}
                                >
                                    <Monitor className="w-3 h-3" style={{ color: item.color }} />
                                </div>
                                <p className="text-sm font-medium text-white">{item.label}</p>
                                <p className="text-xs text-gray-400">{item.value.toLocaleString()} 次访问</p>
                            </motion.div>
                        ))}
                    </div>
                </ChartCard>

                {/* Device Categories Quick Stats */}
                <ChartCard
                    title="设备类别"
                    subtitle="按屏幕尺寸分类"
                >
                    <div className="space-y-4">
                        {[
                            { label: "大屏幕 (>1200px)", value: 45, icon: <Monitor className="w-5 h-5" />, color: "#3B82F6" },
                            { label: "中等屏幕 (768-1200px)", value: 25, icon: <Tablet className="w-5 h-5" />, color: "#8B5CF6" },
                            { label: "小屏幕 (<768px)", value: 30, icon: <Smartphone className="w-5 h-5" />, color: "#10B981" },
                        ].map((item, index) => (
                            <motion.div
                                key={item.label}
                                className="flex items-center gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.15 }}
                            >
                                <div
                                    className="p-2 rounded-lg"
                                    style={{ backgroundColor: item.color + "20" }}
                                >
                                    <span style={{ color: item.color }}>{item.icon}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-300">{item.label}</p>
                                    <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: item.color }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.value}%` }}
                                            transition={{ duration: 0.8, delay: 0.3 + index * 0.15 }}
                                        />
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-white">{item.value}%</span>
                            </motion.div>
                        ))}
                    </div>
                </ChartCard>
            </div>
        </div>
    );
}

export default DeviceAnalyticsDashboard;

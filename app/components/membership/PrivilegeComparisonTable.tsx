import { motion } from "framer-motion";
import { Check, X, Infinity, Zap, MessageCircle, Palette, Download, Crown, Sparkles, Clock } from "lucide-react";

interface Privilege {
    name: string;
    icon: React.ReactNode;
    free: string | number | boolean;
    vip: string | number | boolean;
    svip: string | number | boolean;
}

const privileges: Privilege[] = [
    { name: "每日 AI 对话次数", icon: <MessageCircle size={16} />, free: 3, vip: 50, svip: "无限" },
    { name: "积分获取倍率", icon: <Zap size={16} />, free: "1x", vip: "1.5x", svip: "2x" },
    { name: "去除广告", icon: <X size={16} />, free: false, vip: true, svip: true },
    { name: "下载资源", icon: <Download size={16} />, free: false, vip: true, svip: true },
    { name: "自定义主题", icon: <Palette size={16} />, free: false, vip: true, svip: true },
    { name: "专属表情包", icon: <Sparkles size={16} />, free: false, vip: true, svip: true },
    { name: "专属动效", icon: <Sparkles size={16} />, free: false, vip: false, svip: true },
    { name: "抢先体验", icon: <Clock size={16} />, free: false, vip: false, svip: true },
    { name: "优先技术支持", icon: <Crown size={16} />, free: false, vip: false, svip: true },
];

function renderValue(value: string | number | boolean) {
    if (value === true) {
        return <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center"><Check size={14} className="text-green-400" /></div>;
    }
    if (value === false) {
        return <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center"><X size={14} className="text-white/20" /></div>;
    }
    if (value === "无限") {
        return <div className="flex items-center gap-1 text-yellow-400 font-bold"><Infinity size={16} /> 无限</div>;
    }
    return <span className="font-bold text-white">{value}</span>;
}

export function PrivilegeComparisonTable() {
    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="text-left py-4 px-4 text-white/60 font-medium">权益</th>
                        <th className="text-center py-4 px-4">
                            <div className="text-white/60 font-medium">普通用户</div>
                            <div className="text-xs text-white/30">免费</div>
                        </th>
                        <th className="text-center py-4 px-4 bg-gradient-to-b from-blue-500/10 to-transparent rounded-t-xl">
                            <div className="text-blue-400 font-bold">VIP</div>
                            <div className="text-xs text-blue-400/60">¥19.9/月</div>
                        </th>
                        <th className="text-center py-4 px-4 bg-gradient-to-b from-yellow-500/10 to-transparent rounded-t-xl relative">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">推荐</div>
                            <div className="text-yellow-400 font-bold flex items-center justify-center gap-1"><Crown size={14} /> SVIP</div>
                            <div className="text-xs text-yellow-400/60">¥39.9/月</div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {privileges.map((privilege, index) => (
                        <motion.tr
                            key={privilege.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                            <td className="py-4 px-4 text-white/80 flex items-center gap-3">
                                <span className="text-white/40">{privilege.icon}</span>
                                {privilege.name}
                            </td>
                            <td className="py-4 px-4 text-center">{renderValue(privilege.free)}</td>
                            <td className="py-4 px-4 text-center bg-blue-500/5">{renderValue(privilege.vip)}</td>
                            <td className="py-4 px-4 text-center bg-yellow-500/5">{renderValue(privilege.svip)}</td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

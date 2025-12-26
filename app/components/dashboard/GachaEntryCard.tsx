import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface GachaEntryCardProps {
    onOpen: () => void;
}

export function GachaEntryCard({ onOpen }: GachaEntryCardProps) {
    return (
        <motion.div
            className="group relative rounded-2xl p-6 overflow-hidden cursor-pointer h-full min-h-[200px] flex flex-col justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={onOpen}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* 动态背景 */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=400')] bg-cover bg-center opacity-30 mix-blend-overlay group-hover:scale-110 transition-transform duration-700" />

            {/* 浮动粒子效果 (CSS 动画) */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white/20 rounded-full blur-sm animate-float"
                        style={{
                            width: Math.random() * 20 + 10 + 'px',
                            height: Math.random() * 20 + 10 + 'px',
                            left: Math.random() * 100 + '%',
                            top: Math.random() * 100 + '%',
                            animationDuration: Math.random() * 5 + 5 + 's',
                            animationDelay: Math.random() * 2 + 's'
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10">
                <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm mb-4">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">幸运扭蛋</h3>
                <p className="text-purple-100 text-sm">赢取限定 SSR 角色与装扮</p>
            </div>

            <div className="relative z-10 mt-4">
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white border border-white/10 group-hover:bg-white/30 transition-colors">
                    <span>💎</span>
                    <span>100 星尘 / 次</span>
                </span>
            </div>
        </motion.div>
    );
}

import { motion } from "framer-motion";

export function SystemOverlay() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* 扫描线 */}
            <div className="scanline"></div>

            {/* 角落装饰 */}
            <div className="absolute top-8 left-8 w-64 h-64 border-l border-t border-white/10 rounded-tl-3xl"></div>
            <div className="absolute top-8 right-8 w-64 h-64 border-r border-t border-white/10 rounded-tr-3xl"></div>
            <div className="absolute bottom-8 left-8 w-64 h-64 border-l border-b border-white/10 rounded-bl-3xl"></div>
            <div className="absolute bottom-8 right-8 w-64 h-64 border-r border-b border-white/10 rounded-br-3xl"></div>

            {/* 系统状态标记 */}
            <div className="absolute top-10 right-12 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                <span className="text-xs font-mono text-white/50 tracking-[0.2em] font-bold">SYSTEM ONLINE</span>
            </div>

            <div className="absolute bottom-10 left-12">
                <span className="text-xs font-mono text-white/30 tracking-[0.2em]">MAGI SYSTEM // VER.3.0</span>
            </div>

            {/* 装饰性线条 */}
            <svg className="absolute top-0 left-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                {/* 左上装饰线 */}
                <path d="M 0 150 L 50 150 L 60 160 L 200 160" fill="none" stroke="white" strokeWidth="1" />
                <rect x="0" y="155" width="40" height="2" fill="white" />

                {/* 右下装饰线 */}
                <path d="M 100% 80% L calc(100% - 50px) 80% L calc(100% - 60px) calc(80% - 10px) L calc(100% - 200px) calc(80% - 10px)" fill="none" stroke="white" strokeWidth="1" />
            </svg>
        </div>
    );
}

import { motion } from "framer-motion";
import { Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface LogEntry {
    id: number;
    timestamp: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
}

export function ActivityLog() {
    const [logs, setLogs] = useState<LogEntry[]>([
        { id: 1, timestamp: "10:24:01", message: "核心子系统初始化完成...", type: "info" },
        { id: 2, timestamp: "10:24:02", message: "用户终端档案加载完毕。", type: "success" },
        { id: 3, timestamp: "10:24:05", message: "正在建立高强度加密隧道...", type: "info" },
        { id: 4, timestamp: "10:24:08", message: "安全连接已确立。", type: "success" },
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Simulate incoming logs
    useEffect(() => {
        const messages = [
            "正在扫描安全层更新点...",
            "自动校验并同步本地资产数据...",
            "校验本日活跃点奖励发放状态...",
            "分配系统内存并重组游离进程...",
            "反馈心跳节点应答包：24ms",
            "全量缓存加密流验证通过。",
            "捕获到未知的新维度通讯电波。",
        ];

        const interval = setInterval(() => {
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];
            const newLog: LogEntry = {
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                message: randomMsg,
                type: Math.random() > 0.8 ? "success" : "info"
            };
            setLogs(prev => [...prev.slice(-20), newLog]); // Keep last 20 logs
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 h-full flex flex-col font-mono text-xs">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5 text-white/40 uppercase tracking-wider font-bold">
                <Terminal size={14} />
                全局系统活动监听日志
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                {logs.map((log) => (
                    <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-3"
                    >
                        <span className="text-white/30 select-none">[{log.timestamp}]</span>
                        <span className={`
                            ${log.type === "success" ? "text-green-400" : ""}
                            ${log.type === "warning" ? "text-yellow-400" : ""}
                            ${log.type === "error" ? "text-red-400" : ""}
                            ${log.type === "info" ? "text-white/70" : ""}
                        `}>
                            {log.type === "success" && "✓ "}
                            {log.message}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

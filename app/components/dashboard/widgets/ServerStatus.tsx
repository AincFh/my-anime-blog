import { motion } from "framer-motion";
import { Activity, Server, Users, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

export function ServerStatus() {
    const [load, setLoad] = useState(42);
    const [users, setUsers] = useState(128);
    const [ping, setPing] = useState(24);

    // Simulate live data updates
    useEffect(() => {
        const interval = setInterval(() => {
            setLoad(prev => Math.min(100, Math.max(0, prev + (Math.random() * 10 - 5))));
            setUsers(prev => Math.max(100, prev + Math.floor(Math.random() * 5 - 2)));
            setPing(prev => Math.max(10, Math.min(100, prev + Math.floor(Math.random() * 10 - 5))));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full flex flex-col justify-between relative overflow-hidden">
            {/* Background Grid Animation */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[url('/grid.png')] bg-repeat opacity-50 animate-pulse" />
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Server className="text-blue-500" size={20} />
                    SYSTEM STATUS
                </h3>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-mono text-green-400">ONLINE</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 relative z-10">
                {/* CPU Load */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-white/60">
                        <span>CPU LOAD</span>
                        <span>{load.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full ${load > 80 ? "bg-red-500" : "bg-blue-500"}`}
                            animate={{ width: `${load}%` }}
                            transition={{ type: "spring", stiffness: 50 }}
                        />
                    </div>
                </div>

                {/* Active Users */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                            <Users size={16} />
                        </div>
                        <div>
                            <div className="text-xs text-white/40 font-bold">ACTIVE USERS</div>
                            <div className="text-lg font-mono font-bold text-white">{users}</div>
                        </div>
                    </div>
                    <Activity className="text-white/20" size={24} />
                </div>

                {/* Network Ping */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                            <Wifi size={16} />
                        </div>
                        <div>
                            <div className="text-xs text-white/40 font-bold">LATENCY</div>
                            <div className="text-lg font-mono font-bold text-white">{ping}ms</div>
                        </div>
                    </div>
                    <div className="flex gap-0.5 items-end h-6">
                        {[1, 2, 3, 4].map(i => (
                            <motion.div
                                key={i}
                                className="w-1 bg-green-500/50"
                                animate={{ height: Math.random() * 100 + "%" }}
                                transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: i * 0.1 }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

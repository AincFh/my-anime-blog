import { motion } from "framer-motion";

/**
 * 流量分析雷达
 * 功能：访问趋势图、热点文章榜、访客来源
 */
export function TrafficRadar() {
  // 模拟7天访问数据
  const trafficData = [
    { day: "周一", pv: 120, uv: 80 },
    { day: "周二", pv: 150, uv: 100 },
    { day: "周三", pv: 180, uv: 120 },
    { day: "周四", pv: 200, uv: 140 },
    { day: "周五", pv: 250, uv: 180 },
    { day: "周六", pv: 300, uv: 200 },
    { day: "周日", pv: 280, uv: 190 },
  ];

  const maxPV = Math.max(...trafficData.map((d) => d.pv));
  const maxUV = Math.max(...trafficData.map((d) => d.uv));

  // 热点文章榜
  const topArticles = [
    { title: "React教程：从入门到放弃", views: 500, rank: 1 },
    { title: "芙莉莲剧评：千年之旅", views: 300, rank: 2 },
    { title: "我的追番清单2024", views: 250, rank: 3 },
    { title: "Cloudflare Pages部署指南", views: 200, rank: 4 },
    { title: "二次元网站设计心得", views: 150, rank: 5 },
  ];

  // 访客来源
  const referrers = [
    { source: "直接访问", count: 45, color: "#3B82F6" },
    { source: "Google", count: 30, color: "#10B981" },
    { source: "Bilibili", count: 15, color: "#F59E0B" },
    { source: "其他", count: 10, color: "#EF4444" },
  ];

  const totalReferrers = referrers.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 space-y-8">
        {/* 访问趋势图 */}
        <div className="bg-[#1e293b]/30 p-6 flex-1 rounded-3xl border border-white/5 shadow-inner">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-white/80 tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_#8b5cf6]"></span>
              Traffic Trends
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-xs text-white/60 font-mono">
                <div className="w-3 h-1 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full shadow-[0_0_8px_#8b5cf6]"></div>
                PV
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60 font-mono">
                <div className="w-3 h-1 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
                UV
              </div>
            </div>
          </div>
          <div className="relative h-56 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150" preserveAspectRatio="none">
              {/* 极简辅助线 (仅保留底部和中间) */}
              {[1, 2].map((i) => (
                <line
                  key={i}
                  x1="0"
                  y1={i * 75}
                  x2="400"
                  y2={i * 75}
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              ))}

              {/* PV曲线 */}
              <motion.path
                d={trafficData
                  .map((d, i) => {
                    const x = (i / (trafficData.length - 1)) * 380 + 20;
                    const y = 150 - (d.pv / maxPV) * 120 - 15;
                    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="url(#gradientPV)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                style={{ filter: "drop-shadow(0 0 4px rgba(139, 92, 246, 0.5))" }}
              />

              {/* UV曲线 */}
              <motion.path
                d={trafficData
                  .map((d, i) => {
                    const x = (i / (trafficData.length - 1)) * 380 + 20;
                    const y = 150 - (d.uv / maxUV) * 120 - 15;
                    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="url(#gradientUV)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="5,5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
              />

              {/* 渐变定义 */}
              <defs>
                <linearGradient id="gradientPV" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="1" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="gradientUV" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* 数据点 */}
              {trafficData.map((d, i) => {
                const x = (i / (trafficData.length - 1)) * 380 + 20;
                const pvY = 150 - (d.pv / maxPV) * 120 - 15;
                const uvY = 150 - (d.uv / maxUV) * 120 - 15;
                return (
                  <g key={i}>
                    <circle cx={x} cy={pvY} r="4" fill="#3B82F6" className="drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]" />
                    <circle cx={x} cy={uvY} r="4" fill="#10B981" className="drop-shadow-[0_0_4px_rgba(16,185,129,0.8)]" />
                    <text
                      x={x}
                      y="145"
                      textAnchor="middle"
                      className="text-xs fill-white/40 font-mono"
                    >
                      {d.day}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="flex items-center gap-4 mt-2 text-xs text-white/50 font-mono">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_5px_#3b82f6]"></div>
                <span>PV</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-dashed shadow-[0_0_5px_#22c55e]"></div>
                <span>UV</span>
              </div>
            </div>
          </div>
        </div>

        {/* 辅助数据展示区 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 热点文章榜 */}
          <div className="bg-[#1e293b]/30 p-6 rounded-3xl border border-white/5 shadow-inner">
            <h3 className="text-sm font-bold text-white/80 mb-6 tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
              Top Articles
            </h3>
            <div className="space-y-3">
              {topArticles.map((article, index) => (
                <motion.div
                  key={article.rank}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${article.rank === 1
                    ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                    : "bg-white/10 text-white/70"
                    }`}>
                    {article.rank === 1 ? "👑" : article.rank}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/90">{article.title}</p>
                    <p className="text-xs text-white/40 font-mono">{article.views} 次阅读</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* 访客来源 */}
        <div className="bg-[#1e293b]/30 p-6 rounded-3xl border border-white/5 shadow-inner flex flex-col items-center justify-center relative overflow-hidden">

          <h3 className="text-sm font-bold text-white/80 mb-2 w-full text-left tracking-widest uppercase flex items-center gap-2 z-10">
            <span className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899]"></span>
            Sources
          </h3>
          <div className="flex-1 flex items-center justify-center w-full relative z-10 scale-110">
            <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-2xl">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="20"
              />
              {referrers.map((ref, index) => {
                const startAngle = referrers
                  .slice(0, index)
                  .reduce((sum, r) => sum + (r.count / totalReferrers) * 360, 0);
                const angle = (ref.count / totalReferrers) * 360;
                const endAngle = startAngle + angle;

                const startAngleRad = ((startAngle - 90) * Math.PI) / 180;
                const endAngleRad = ((endAngle - 90) * Math.PI) / 180;

                const x1 = 100 + 80 * Math.cos(startAngleRad);
                const y1 = 100 + 80 * Math.sin(startAngleRad);
                const x2 = 100 + 80 * Math.cos(endAngleRad);
                const y2 = 100 + 80 * Math.sin(endAngleRad);

                const largeArc = angle > 180 ? 1 : 0;

                return (
                  <motion.path
                    key={ref.source}
                    d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={ref.color}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: index * 0.2 }}
                    stroke="#0f1629"
                    strokeWidth="3"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-24 h-24 bg-[#0f1629] rounded-full border-[6px] border-[#1e293b]/50 shadow-inner flex flex-col items-center justify-center">
                <span className="text-2xl font-black font-orbitron text-white">{totalReferrers}</span>
                <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Total</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 w-full gap-3 mt-4 z-10 bg-black/20 p-4 rounded-2xl border border-white/5">
            {referrers.map((ref) => (
              <div key={ref.source} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <div
                    className="w-1.5 h-3 rounded-sm shadow-[0_0_5px_currentColor]"
                    style={{ backgroundColor: ref.color, color: ref.color }}
                  ></div>
                  <span className="text-white/80 truncate pr-1">{ref.source}</span>
                </div>
                <span className="text-white/40 font-mono text-xl font-bold ml-3">{ref.count}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

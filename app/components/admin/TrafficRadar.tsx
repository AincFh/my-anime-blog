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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        📊 流量分析雷达
      </h2>

      <div className="space-y-6">
        {/* 访问趋势图 */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-4">最近7天访问趋势</h3>
          <div className="relative h-48">
            <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
              {/* 网格线 */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="0"
                  y1={30 + i * 30}
                  x2="400"
                  y2={30 + i * 30}
                  stroke="#E5E7EB"
                  strokeWidth="1"
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
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="gradientUV" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* 数据点 */}
              {trafficData.map((d, i) => {
                const x = (i / (trafficData.length - 1)) * 380 + 20;
                const pvY = 150 - (d.pv / maxPV) * 120 - 15;
                const uvY = 150 - (d.uv / maxUV) * 120 - 15;
                return (
                  <g key={i}>
                    <circle cx={x} cy={pvY} r="4" fill="#3B82F6" />
                    <circle cx={x} cy={uvY} r="4" fill="#10B981" />
                    <text
                      x={x}
                      y="145"
                      textAnchor="middle"
                      className="text-xs fill-gray-500"
                    >
                      {d.day}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>PV</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-dashed"></div>
                <span>UV</span>
              </div>
            </div>
          </div>
        </div>

        {/* 热点文章榜 */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-4">热点文章榜</h3>
          <div className="space-y-2">
            {topArticles.map((article, index) => (
              <motion.div
                key={article.rank}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-sm">
                  {article.rank === 1 ? "👑" : article.rank}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{article.title}</p>
                  <p className="text-xs text-gray-500">{article.views} 次阅读</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 访客来源 */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-4">访客来源</h3>
          <div className="flex items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#E5E7EB"
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
                  />
                );
              })}
            </svg>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {referrers.map((ref) => (
              <div key={ref.source} className="flex items-center gap-2 text-sm">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: ref.color }}
                ></div>
                <span className="text-gray-600">{ref.source}</span>
                <span className="text-gray-400 ml-auto">{ref.count}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


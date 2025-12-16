import { motion } from "framer-motion";

/**
 * 雷达图番剧评测系统
 * 六个维度：【剧情】、【作画】、【声优】、【音乐】、【人设】、【厨力】
 */
interface RadarData {
  plot: number;      // 剧情 (0-10)
  animation: number; // 作画 (0-10)
  voice: number;    // 声优 (0-10)
  music: number;     // 音乐 (0-10)
  character: number; // 人设 (0-10)
  passion: number;   // 厨力 (0-10)
}

interface RadarChartProps {
  data: RadarData;
  title?: string;
  size?: number;
}

const dimensions = [
  { name: "剧情", key: "plot" as keyof RadarData },
  { name: "作画", key: "animation" as keyof RadarData },
  { name: "声优", key: "voice" as keyof RadarData },
  { name: "音乐", key: "music" as keyof RadarData },
  { name: "人设", key: "character" as keyof RadarData },
  { name: "厨力", key: "passion" as keyof RadarData },
];

export function RadarChart({ data, title, size = 200 }: RadarChartProps) {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4;
  const angleStep = (Math.PI * 2) / dimensions.length;

  // 计算每个维度的坐标点
  const getPoint = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2; // 从顶部开始
    const distance = (value / 10) * radius;
    return {
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
    };
  };

  // 生成雷达图路径
  const generatePath = (values: RadarData) => {
    const points = dimensions.map((dim, index) => {
      const value = values[dim.key];
      return getPoint(index, value);
    });

    return points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ") + " Z";
  };

  // 生成网格线路径
  const generateGridPath = (level: number) => {
    const points = dimensions.map((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const distance = (level / 5) * radius;
      return {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
      };
    });

    return points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ") + " Z";
  };

  const dataPath = generatePath(data);

  return (
    <div className="flex flex-col items-center">
      {title && (
        <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
      )}
      <svg width={size} height={size} className="overflow-visible">
        {/* 背景网格 */}
        {[1, 2, 3, 4, 5].map((level) => (
          <g key={level}>
            <path
              d={generateGridPath(level)}
              fill="none"
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="1"
            />
          </g>
        ))}

        {/* 维度轴线 */}
        {dimensions.map((dim, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const endX = centerX + Math.cos(angle) * radius;
          const endY = centerY + Math.sin(angle) * radius;
          return (
            <line
              key={dim.key}
              x1={centerX}
              y1={centerY}
              x2={endX}
              y2={endY}
              stroke="rgba(148, 163, 184, 0.3)"
              strokeWidth="1"
            />
          );
        })}

        {/* 数据区域 */}
        <motion.path
          d={dataPath}
          fill="rgba(255, 159, 67, 0.3)"
          stroke="rgba(255, 159, 67, 0.8)"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />

        {/* 数据点 */}
        {dimensions.map((dim, index) => {
          const point = getPoint(index, data[dim.key]);
          return (
            <g key={dim.key}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="rgba(255, 159, 67, 1)"
                className="drop-shadow-lg"
              />
              {/* 数值标签 */}
              <text
                x={point.x}
                y={point.y - 8}
                textAnchor="middle"
                className="text-xs font-bold fill-primary-start"
              >
                {data[dim.key]}
              </text>
            </g>
          );
        })}

        {/* 维度标签 */}
        {dimensions.map((dim, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const labelX = centerX + Math.cos(angle) * (radius + 20);
          const labelY = centerY + Math.sin(angle) * (radius + 20);
          return (
            <text
              key={dim.key}
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-medium fill-slate-700"
            >
              {dim.name}
            </text>
          );
        })}
      </svg>

      {/* 数值详情 */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        {dimensions.map((dim) => (
          <div key={dim.key} className="text-center">
            <div className="font-bold text-primary-start">{data[dim.key]}/10</div>
            <div className="text-slate-500">{dim.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


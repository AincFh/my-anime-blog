import { motion } from "framer-motion";
import { useState, useEffect } from "react";

/**
 * 星际门友链系统 (The Star Gate / Blogroll)
 * 功能：卡片式、状态检测、空间扭曲特效
 */
interface FriendLink {
  id: string;
  name: string;
  url: string;
  description: string;
  avatar?: string;
  banner?: string;
  status: "online" | "offline" | "new";
  lastUpdate?: string;
}

interface BlogrollProps {
  links: FriendLink[];
}

export function Blogroll({ links }: BlogrollProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleClick = (link: FriendLink) => {
    // Toast提示
    const toast = document.createElement("div");
    toast.className = "fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-xl border border-white/20";
    toast.textContent = `正在跃迁至 ${link.name}...`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
      window.open(link.url, "_blank");
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-gray-500";
      case "new":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {links.map((link) => (
        <motion.div
          key={link.id}
          className="relative group cursor-pointer"
          onMouseEnter={() => setHoveredId(link.id)}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => handleClick(link)}
          whileHover={{ scale: 1.05, zIndex: 10 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* 卡片 */}
          <div className="relative h-48 rounded-xl overflow-hidden border-2 border-white/20 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm">
            {/* Banner背景 */}
            {link.banner ? (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-50"
                style={{ backgroundImage: `url('${link.banner}')` }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30" />
            )}

            {/* 空间扭曲特效 */}
            {hoveredId === link.id && (
              <motion.div
                className="absolute inset-0"
                animate={{
                  filter: [
                    "hue-rotate(0deg)",
                    "hue-rotate(90deg)",
                    "hue-rotate(0deg)",
                  ],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                }}
              />
            )}

            {/* 内容 */}
            <div className="relative z-10 h-full flex flex-col justify-between p-4">
              {/* 状态指示器 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(link.status)} animate-pulse`} />
                  <span className="text-white/80 text-xs">
                    {link.status === "online" ? "信号良好" : link.status === "offline" ? "信号丢失" : "New Signal"}
                  </span>
                </div>
                {link.status === "new" && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded">
                    New
                  </span>
                )}
              </div>

              {/* 站点信息 */}
              <div>
                <h3 className="text-white font-bold text-lg mb-2">{link.name}</h3>
                <p className="text-white/60 text-sm line-clamp-2">{link.description}</p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}


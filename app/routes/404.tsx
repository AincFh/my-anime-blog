import { motion } from "framer-motion";
import { Link } from "react-router";
import { useEffect, useState } from "react";

/**
 * 404页面 - 世界线变动 (重制版)
 * 设计：极简主义 + 故障艺术风格 (Glitch Art)
 * 优化：移除高性能消耗的 SVG 滤镜，优化按钮排版
 */
export default function NotFound() {
  const [time, setTime] = useState("1.048596");

  useEffect(() => {
    // 随机变动世界线变动率
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setTime((1 + Math.random() * 0.1).toFixed(6));
      } else {
        setTime("1.048596");
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0a] text-white font-sans selection:bg-red-500 selection:text-white">
      {/* 静态噪点背景（图片代替SVG滤镜，性能更好） */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* 动态背景光效 - 降低模糊度以提高性能 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-red-600/10 rounded-full blur-[80px]"
          animate={{ x: [0, 30, 0], y: [0, 20, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[80px]"
          animate={{ x: [0, -30, 0], y: [0, -20, 0], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-6 max-w-4xl flex flex-col md:flex-row items-center justify-between gap-12 md:gap-20">

        {/* 左侧：巨大的 404 故障文字 */}
        <div className="relative">
          <motion.h1
            className="text-[10rem] md:text-[14rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 select-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            404
          </motion.h1>

          {/* 故障重影效果 - 简化动画 */}
          <motion.div
            className="absolute inset-0 text-[10rem] md:text-[14rem] font-black leading-none tracking-tighter text-red-500 mix-blend-screen opacity-50 select-none pointer-events-none"
            animate={{ x: [-2, 2, -1, 0], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 0.2, repeat: Infinity, repeatType: "mirror" }}
          >
            404
          </motion.div>
          <motion.div
            className="absolute inset-0 text-[10rem] md:text-[14rem] font-black leading-none tracking-tighter text-blue-500 mix-blend-screen opacity-50 select-none pointer-events-none"
            animate={{ x: [2, -2, 1, 0], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 0.3, repeat: Infinity, repeatType: "mirror" }}
          >
            404
          </motion.div>

          {/* 装饰线条 */}
          <div className="absolute top-1/2 left-[-20%] right-[-20%] h-[1px] bg-white/10" />
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-red-500/30 transform rotate-12" />
        </div>

        {/* 右侧：信息与操作 */}
        <div className="flex-1 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="inline-block px-3 py-1 mb-6 border border-red-500/30 bg-red-500/10 rounded text-red-400 font-mono text-sm tracking-widest">
              ERROR: DIVERGENCE &gt; 1%
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              世界线变动探测
            </h2>

            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              当前观测点 <span className="text-white font-mono border-b border-gray-600 pb-0.5">{time}</span> 不存在。
              <br />
              您访问的页面可能已被机关消除。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/" className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-75 transition duration-200"></div>
                <button className="relative px-8 py-3 bg-black text-white font-bold text-lg rounded-lg border border-white/10 hover:bg-gray-900 transition-colors flex items-center gap-2">
                  <span>返回当前世界线</span>
                  <span className="text-xl">→</span>
                </button>
              </Link>

              <button
                onClick={() => window.history.back()}
                className="px-8 py-3 border border-white/20 text-gray-300 hover:text-white hover:bg-white/5 font-medium text-lg rounded-lg transition-colors"
              >
                撤销操作
              </button>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-center text-xs text-gray-600 font-mono">
              <span>EL PSY KONGROO</span>
              <span>STATUS: DISCONNECTED</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

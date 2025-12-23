import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { GlitchText } from "~/components/animations/GlitchText";

/**
 * 前台 404 页面
 * A.T. FIELD 主题风格 - 增强适配版 (无边框 + 霓虹特效 + 自动跳转)
 */
export default function NotFound() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(15); // 15秒倒计时

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="container mx-auto px-4 py-16 min-h-[70vh] flex items-center justify-center relative overflow-hidden">

      {/* 背景装饰 - 六边形力场图案 (A.T. Field 特征) */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-opacity='1' fill='%23FF9F43' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* 巨大的背景文字装饰 - 极低透明度，避免干扰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none flex items-center justify-center">
        <div className="text-[20vw] font-display font-bold text-slate-900/[0.03] dark:text-white/[0.03] rotate-[-10deg] blur-sm">
          EMERGENCY
        </div>
      </div>

      {/* 主内容容器 */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24">

        {/* 左侧：装饰性数据流 - 增强版 */}
        <motion.div
          className="hidden lg:flex flex-col items-end gap-6 text-right font-mono text-xs text-at-orange/80 select-none"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex flex-col gap-1 border-r-2 border-at-orange/30 pr-4 py-2">
            <span className="text-at-orange font-bold">/// SYSTEM_ALERT</span>
            <span>ERR_CODE: 0x404</span>
            <span>SYNC_RATE: 0.00%</span>
            <span>TARGET: NOT_FOUND</span>
          </div>
          <div className="w-32 h-px bg-gradient-to-l from-at-orange to-transparent opacity-50" />
          <div className="text-4xl animate-pulse text-at-orange">⚠️</div>
        </motion.div>

        {/* 中间：核心视觉区 - 移除背景框，直接展示 */}
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">

          {/* 角色图片 */}
          <motion.div
            className="relative w-64 md:w-80 shrink-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* 装饰边框 */}
            <div className="absolute -inset-4 border-2 border-at-orange rounded-3xl opacity-20" />
            <div className="absolute -inset-4 border-2 border-at-orange rounded-3xl opacity-40 translate-x-2 translate-y-2" />

            <motion.img
              src="/404-character.png"
              alt="迷路的角色"
              className="relative z-10 w-full h-auto rounded-2xl shadow-2xl shadow-orange-500/10"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* 右侧：文字信息 */}
          <motion.div
            className="text-center md:text-left max-w-md"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="mb-4 flex items-center justify-center md:justify-start gap-3">
              {/* Warning 标签 - 绝对实心，无透明度 */}
              <span className="px-3 py-1 rounded-md text-xs font-black bg-[#FF6B6B] text-white uppercase tracking-widest border-2 border-[#D63031]">
                Warning
              </span>
              <div className="h-0.5 flex-1 bg-[#FF6B6B]" />
            </div>

            <div className="mb-6 relative">
              {/* 霓虹灯闪烁特效容器 */}
              <motion.div
                className="relative z-10"
                animate={{
                  filter: [
                    "drop-shadow(0 0 2px rgba(255, 159, 67, 0.3))",
                    "drop-shadow(0 0 8px rgba(255, 159, 67, 0.6))",
                    "drop-shadow(0 0 2px rgba(255, 159, 67, 0.3))",
                    "drop-shadow(0 0 15px rgba(255, 159, 67, 0.8))",
                    "drop-shadow(0 0 2px rgba(255, 159, 67, 0.3))"
                  ]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  repeatType: "loop",
                  times: [0, 0.1, 0.2, 0.5, 1],
                  ease: "easeInOut"
                }}
              >
                <GlitchText
                  text="404"
                  className="text-8xl md:text-9xl font-display font-black leading-none tracking-tight text-slate-900 dark:text-white"
                />
              </motion.div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-center md:justify-start gap-3 drop-shadow-md">
              <span className="text-at-orange text-3xl">///</span>
              <span>绝对领域展开失败</span>
            </h2>

            <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed font-medium text-lg drop-shadow-sm">
              检测到空间震荡，当前坐标不存在。<br />
              将在 <span className="text-at-orange font-mono font-bold text-xl mx-1">{countdown}</span> 秒后撤离至安全区域。
            </p>

            {/* 自动跳转进度条 */}
            <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full mb-8 overflow-hidden">
              <motion.div
                className="h-full bg-at-orange"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 15, ease: "linear" }}
              />
            </div>

            {/* 实心按钮 - 无透明度，高饱和度 */}
            <Link
              to="/"
              className="group relative inline-flex items-center gap-3 px-10 py-4 bg-[#FF9F43] hover:bg-[#ff8f26] text-white font-display font-black text-lg rounded-xl shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-1 transition-all overflow-hidden border-b-4 border-[#e08020] active:border-b-0 active:translate-y-1"
            >
              <span className="relative z-10 flex items-center gap-2">
                <span>EMERGENCY EXIT</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </Link>
          </motion.div>
        </div>

        {/* 右侧：装饰性状态栏 - 增强版 */}
        <motion.div
          className="hidden lg:flex flex-col items-start gap-6 text-left font-mono text-xs text-at-purple/80 select-none"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="text-4xl animate-pulse text-at-purple">❓</div>
          <div className="w-32 h-px bg-gradient-to-r from-at-purple to-transparent opacity-50" />
          <div className="flex flex-col gap-1 border-l-2 border-at-purple/30 pl-4 py-2">
            <span className="text-at-purple font-bold">/// DIAGNOSTIC</span>
            <span>STATUS: LOST</span>
            <span>MEM: LEAKING</span>
            <span>AUTO_RTN: TRUE</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

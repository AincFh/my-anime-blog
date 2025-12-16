import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
// import CountUp from "react-countup"; // TODO: 安装 react-countup

/**
 * 全息身份卡 (Holographic ID Card)
 * 功能：3D视差、流光效果、数字滚动
 */
interface HolographicIDCardProps {
  user: {
    avatar?: string;
    uid: string;
    joinDate: string;
    level: number;
    name: string;
  };
}

export function HolographicIDCard({ user }: HolographicIDCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSheen, setShowSheen] = useState(false);

  // 3D视差效果
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / (rect.width / 2));
    y.set((e.clientY - centerY) / (rect.height / 2));
    setShowSheen(true);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setShowSheen(false);
  };

  useEffect(() => {
    // 数字滚动动画
    setTimeout(() => setIsLoaded(true), 500);
  }, []);

  return (
    <motion.div
      className="relative w-full max-w-md mx-auto"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1000,
      }}
    >
      <motion.div
        className="relative bg-gradient-to-br from-sky-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-2xl overflow-hidden"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: 1.02 }}
      >
        {/* 流光效果 */}
        <motion.div
          className="absolute inset-0 opacity-0 pointer-events-none"
          animate={{
            opacity: showSheen ? [0, 0.5, 0] : 0,
            x: showSheen ? ["-100%", "100%"] : "-100%",
          }}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
            transform: "skewX(-20deg)",
          }}
        />

        {/* 内容 */}
        <div className="relative z-10">
          {/* 头像 */}
          <div className="flex items-center gap-4 mb-6">
            <motion.div
              className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-purple-400 flex items-center justify-center text-white text-2xl font-bold border-4 border-white/50 shadow-lg"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                user.name[0]
              )}
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
              <p className="text-white/60 text-sm">UID: {user.uid}</p>
            </div>
          </div>

          {/* 等级 */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-white/80 text-sm">等级</span>
            <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
              <span className="text-white font-bold text-lg">{user.level}</span>
            </div>
          </div>

          {/* 入驻时间 */}
          <div className="text-white/60 text-sm">
            入驻时间：{user.joinDate}
          </div>
        </div>

        {/* 装饰性光点 */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <div className="absolute bottom-4 left-4 w-1 h-1 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
      </motion.div>
    </motion.div>
  );
}


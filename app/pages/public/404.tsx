import { motion } from "framer-motion";
import { Link } from "react-router";
import { useEffect, useState } from "react";

/**
 * 404页面 - 世界线变动
 * 功能：辉光管时钟效果，检测连续刷新5次解锁成就
 */
export default function NotFound() {
  const [refreshCount, setRefreshCount] = useState(0);
  const [time, setTime] = useState("4.0.4.0.0.0");

  useEffect(() => {
    // 从localStorage读取刷新次数
    const count = parseInt(localStorage.getItem("404_refresh_count") || "0");
    setRefreshCount(count + 1);
    localStorage.setItem("404_refresh_count", String(count + 1));

    // 如果连续刷新5次，解锁成就
    if (count + 1 >= 5) {
      if ((window as any).unlockAchievement) {
        (window as any).unlockAchievement("schrodinger_cat");
      }
      // 重置计数
      setTimeout(() => {
        localStorage.setItem("404_refresh_count", "0");
      }, 1000);
    }

    // 辉光管时钟效果：数字跳动
    const interval = setInterval(() => {
      const randomTime = Array.from({ length: 6 }, () =>
        Math.floor(Math.random() * 10)
      ).join(".");
      setTime(randomTime);
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setTime("4.0.4.0.0.0");
    }, 2000);

    return () => clearInterval(interval);
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* 背景：卡车冲过来的瞬间（异世界转生梗） */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-orange-200 via-red-300 to-pink-400" />
        {/* 卡车剪影 */}
        <motion.div
          className="absolute bottom-0 right-0 text-9xl opacity-20"
          animate={{
            x: [0, -50, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          🚛
        </motion.div>
      </motion.div>

      {/* 内容 */}
      <motion.div
        className="relative z-10 text-center max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {/* 辉光管时钟 */}
        <motion.div
          className="mb-8 font-mono text-6xl md:text-8xl font-bold text-white/90"
          style={{
            textShadow: "0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 255, 255, 0.3)",
          }}
        >
          {time.split(".").map((digit, i) => (
            <motion.span
              key={i}
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            >
              {digit}
              {i < time.split(".").length - 1 && "."}
            </motion.span>
          ))}
        </motion.div>

        {/* 主标题 */}
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
          检测到世界线变动率超过 1%
        </h2>

        {/* 副标题 */}
        <p className="text-xl md:text-2xl text-white/90 mb-8 drop-shadow-md">
          该观测点不存在于当前时间轴
        </p>

        {/* 长门有希在空荡的房间里（可选） */}
        <motion.div
          className="text-8xl mb-8"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          👤
        </motion.div>

        {/* 描述文字 */}
        <p className="text-lg text-white/80 mb-12 leading-relaxed">
          你似乎来到了一个不存在的页面。
          <br />
          可能是世界线发生了变动，或者你输入了错误的坐标。
        </p>

        {/* 按钮：发动 Reading Steiner 回到首页 */}
        <Link to="/">
          <motion.button
            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                "0 10px 30px rgba(236, 72, 153, 0.3)",
                "0 15px 40px rgba(236, 72, 153, 0.5)",
                "0 10px 30px rgba(236, 72, 153, 0.3)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            onClick={() => {
              // 屏幕扭曲效果
              document.body.style.filter = "hue-rotate(180deg)";
              setTimeout(() => {
                document.body.style.filter = "";
              }, 500);
            }}
          >
            <span className="flex items-center gap-2">
              <span>🔮</span>
              <span>发动 Reading Steiner 回到首页</span>
            </span>
          </motion.button>
        </Link>

        {/* 彩蛋文字 */}
        <motion.p
          className="text-sm text-white/60 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          * 世界线变动率：1.048596%
        </motion.p>
      </motion.div>
    </div>
  );
}


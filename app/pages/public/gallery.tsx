import { motion } from "framer-motion";
import { GlassCard } from "~/components/layout/GlassCard";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import type { Route } from "./+types/gallery";

// 示例图片数据 - 实际应用中应该从数据库或API获取
const sampleImages = [
  {
    id: 1,
    url: "https://picsum.photos/seed/anime234/1200/800",
    title: "夏日的回忆",
    category: "illustration",
    date: "2023-11-20"
  },
  {
    id: 2,
    url: "https://picsum.photos/seed/anime145/1200/800",
    title: "东京的夜晚",
    category: "photography",
    date: "2023-11-18"
  },
  {
    id: 3,
    url: "https://picsum.photos/seed/anime567/1200/800",
    title: "宁静的海边",
    category: "illustration",
    date: "2023-11-15"
  },
  {
    id: 4,
    url: "https://picsum.photos/seed/anime890/1200/800",
    title: "樱花车站",
    category: "illustration",
    date: "2023-11-10"
  },
  {
    id: 5,
    url: "https://picsum.photos/seed/anime345/1200/800",
    title: "雨后的城市",
    category: "photography",
    date: "2023-11-05"
  },
  {
    id: 6,
    url: "https://picsum.photos/seed/anime678/1200/800",
    title: "星空露营",
    category: "illustration",
    date: "2023-11-01"
  }
];

export async function loader({ context }: Route.LoaderArgs) {
  // 实际应用中，这里应该从数据库或R2存储获取图片
  // const { anime_db } = context.cloudflare.env;
  // const images = await fetchImagesFromDB();

  return {
    images: sampleImages,
  };
}

export default function Gallery({ loaderData }: Route.ComponentProps) {
  const { images } = loaderData || { images: [] };

  // 生成随机旋转角度（-3到3度）
  const getRandomRotation = (index: number) => {
    const baseRotation = (index % 7) - 3; // -3, -2, -1, 0, 1, 2, 3
    return baseRotation;
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto pt-safe pb-24 md:pt-32 md:pb-32 px-4 sm:px-6 lg:px-8">
      {/* 标题 - 极简压实 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12 md:mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-sans font-black tracking-tight text-slate-900 dark:text-white mb-3">
          相册
        </h1>
        <p className="text-xl md:text-2xl font-medium text-slate-400 dark:text-slate-500 tracking-tight">
          生活切片与沿途风景
        </p>
      </motion.div>

      {/* iOS 极简相册网格布局 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {images.map((image: any, index: number) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="group relative aspect-[4/5] rounded-[24px] md:rounded-[32px] overflow-hidden bg-slate-100 dark:bg-slate-800/50 shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-200/50 dark:border-white/5 cursor-pointer"
          >
            {/* 图像层 */}
            <OptimizedImage
              src={image.url}
              alt={image.note || image.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            
            {/* 深邃悬停蒙版 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* 隐藏的悬浮文本信息 */}
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <p className="text-white font-bold text-lg md:text-xl leading-tight mb-1.5 drop-shadow-md">
                {image.note || image.title || "未命名记忆"}
              </p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white text-[10px] uppercase tracking-wider font-semibold border border-white/20">
                  {image.category || "瞬间"}
                </span>
                <span className="text-white/70 text-xs font-medium font-mono drop-shadow-sm">
                  {image.date}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {images.length === 0 && (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col items-center justify-center py-32 text-center"
        >
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[32px] flex items-center justify-center mb-6 rotate-3">
                <span className="text-4xl opacity-50">📸</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-700 dark:text-white mb-2">相册空空如也</h3>
            <p className="text-slate-500 max-w-sm mb-8">准备好用镜头定格下一个瞬息了吗？</p>
        </motion.div>
      )}
    </div>
  );
}


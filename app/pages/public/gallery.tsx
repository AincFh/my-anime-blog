import { motion } from "framer-motion";
import { GlassCard } from "~/components/layout/GlassCard";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import type { Route } from "./+types/gallery";

// 示例图片数据 - 实际应用中应该从数据库或API获取
const sampleImages = [
  {
    id: 1,
    url: "https://api.yimian.xyz/img?id=234",
    title: "夏日的回忆",
    category: "illustration",
    date: "2023-11-20"
  },
  {
    id: 2,
    url: "https://api.yimian.xyz/img?id=145",
    title: "东京的夜晚",
    category: "photography",
    date: "2023-11-18"
  },
  {
    id: 3,
    url: "https://api.yimian.xyz/img?id=567",
    title: "宁静的海边",
    category: "illustration",
    date: "2023-11-15"
  },
  {
    id: 4,
    url: "https://api.yimian.xyz/img?id=890",
    title: "樱花车站",
    category: "illustration",
    date: "2023-11-10"
  },
  {
    id: 5,
    url: "https://api.yimian.xyz/img?id=345",
    title: "雨后的城市",
    category: "photography",
    date: "2023-11-05"
  },
  {
    id: 6,
    url: "https://api.yimian.xyz/img?id=678",
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
    <div className="container mx-auto px-4 py-20">
      {/* 标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
          追番图库
        </h1>
        <p className="text-slate-600 text-lg">像散落在桌子上的照片</p>
      </motion.div>

      {/* 拍立得模式布局 */}
      <div className="flex flex-wrap justify-center gap-8">
        {images.map((image: any, index: number) => {
          const rotation = getRandomRotation(index);

          return (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.8, rotate: rotation }}
              animate={{ opacity: 1, scale: 1, rotate: rotation }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{
                scale: 1.05,
                rotate: rotation + (rotation > 0 ? 2 : -2),
                zIndex: 10,
              }}
              className="relative"
              style={{ rotate: `${rotation}deg` }}
            >
              {/* 拍立得卡片 */}
              <div className="bg-white rounded-lg shadow-2xl p-4 w-64">
                {/* 图片区域 */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm mb-4">
                  <OptimizedImage
                    src={image.url}
                    alt={image.note}
                    className="object-cover w-full h-full absolute inset-0"
                  />
                </div>

                {/* 底部留白 - 手写体注释 */}
                <div className="px-2 pb-2">
                  <p
                    className="text-sm text-slate-700 font-handwriting"
                    style={{
                      fontFamily: "'Comfortaa', 'Noto Sans SC', cursive",
                      transform: `rotate(${rotation * 0.3}deg)`,
                    }}
                  >
                    {image.note}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{image.date}</p>
                </div>
              </div>

              {/* 阴影效果 */}
              <div
                className="absolute inset-0 bg-black/10 rounded-lg blur-xl -z-10"
                style={{ transform: `rotate(${rotation * 0.5}deg) translateY(10px)` }}
              />
            </motion.div>
          );
        })}
      </div>

      {images.length === 0 && (
        <div className="text-center text-slate-500 py-20">
          <p className="text-xl">还没有图片，去上传一些吧！</p>
        </div>
      )}
    </div>
  );
}


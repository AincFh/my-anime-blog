import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "~/components/layout/GlassCard";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import type { Route } from "./+types/gallery";
import { useState } from "react";
import { X } from "lucide-react";

export async function loader({ context }: Route.LoaderArgs) {
  const { anime_db } = (context as any).cloudflare.env;
  try {
    const images = await anime_db
        .prepare(`SELECT * FROM gallery ORDER BY created_at DESC`)
        .all();
    return {
        images: images.results || []
    };
  } catch (error) {
    console.error("Failed to fetch gallery:", error);
    return { images: [] };
  }
}

export default function Gallery({ loaderData }: Route.ComponentProps) {
  const { images } = loaderData || { images: [] };
  const [selectedImage, setSelectedImage] = useState<any>(null);

  // 生成随机旋转角度（-3到3度）
  const getRandomRotation = (index: number) => {
    const baseRotation = (index % 7) - 3; // -3, -2, -1, 0, 1, 2, 3
    return baseRotation;
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pt-[70px] md:pt-[80px] pb-24 md:pb-36 px-6 sm:px-8 lg:px-12">
      {/* Apple 极简标题流 */}
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
            onClick={() => setSelectedImage(image)}
            className="group relative aspect-[4/5] rounded-[24px] md:rounded-[32px] overflow-hidden bg-slate-100 dark:bg-slate-800/50 shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-200/50 dark:border-white/5 cursor-pointer"
          >
            {/* 图像层 */}
            <OptimizedImage
              src={image.url}
              alt={image.note || image.title}
              className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
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

      {/* Lightbox 全屏画廊沉浸式浏览模态框 */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-3xl"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              onClick={() => setSelectedImage(null)} 
              className="absolute top-6 md:top-10 right-6 md:right-10 text-white/50 hover:text-white p-3 md:p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all z-10 cursor-pointer"
            >
              <X size={24} />
            </button>
            <motion.img 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
                src={selectedImage.url} 
                alt={selectedImage.title || "Image"} 
                className="w-full h-full max-h-[85vh] md:max-h-[90vh] object-contain drop-shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
            />
            {/* 图像底部信息台 */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="absolute bottom-8 md:bottom-12 left-0 right-0 text-center pointer-events-none px-4"
            >
                <h3 className="text-2xl md:text-3xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] mb-2">
                    {selectedImage.title || selectedImage.note || "未命名记忆"}
                </h3>
                <div className="flex items-center justify-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white md:text-sm text-[11px] uppercase tracking-widest font-bold border border-white/20 shadow-lg">
                        {selectedImage.category || "瞬间"}
                    </span>
                    <span className="text-white/80 font-medium font-mono drop-shadow-md text-sm">
                        {selectedImage.date}
                    </span>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


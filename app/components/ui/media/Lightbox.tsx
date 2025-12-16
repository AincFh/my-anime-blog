import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

/**
 * 图片灯箱模式 (Lightbox)
 * 功能：点击图片放大，背景高斯模糊，显示Pixiv元数据
 */
interface LightboxProps {
  src: string;
  alt: string;
  pixivId?: string;
  artist?: string;
  onClose: () => void;
}

export function Lightbox({ src, alt, pixivId, artist, onClose }: LightboxProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* 高斯模糊背景 */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('${src}')`,
          filter: "blur(20px) brightness(0.5)",
        }}
      />
      <div className="absolute inset-0 bg-black/50" />

      {/* 图片容器 */}
      <motion.div
        className="relative z-10 max-w-7xl max-h-[90vh]"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />

        {/* Pixiv元数据 */}
        {(pixivId || artist) && (
          <motion.div
            className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {pixivId && <div>PID: {pixivId}</div>}
            {artist && <div>画师: {artist}</div>}
          </motion.div>
        )}

        {/* 关闭按钮 */}
        <motion.button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-black/70 backdrop-blur-sm rounded-full text-white flex items-center justify-center hover:bg-black/90 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ✕
        </motion.button>
      </motion.div>
    </motion.div>
  );
}


import { useState, useEffect } from "react";
import { Lightbox } from "./Lightbox";

/**
 * 图片灯箱包装器
 * 功能：自动为文章中的图片添加点击灯箱功能
 */
export function ImageLightbox() {
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    alt: string;
    pixivId?: string;
    artist?: string;
  } | null>(null);

  useEffect(() => {
    // 保存每个图片元素的事件处理函数引用，用于清理
    const handlers: Map<HTMLImageElement, () => void> = new Map();

    // 为所有文章图片添加点击事件
    const images = document.querySelectorAll(".markdown-content img, .prose img");
    
    images.forEach((img) => {
      const imageElement = img as HTMLImageElement;
      
      // 检查是否已有事件监听器
      if (imageElement.dataset.lightbox === "true") return;
      imageElement.dataset.lightbox = "true";

      imageElement.style.cursor = "zoom-in";
      
      const handler = () => {
        // 尝试从data属性获取Pixiv信息
        const pixivId = imageElement.dataset.pixivId;
        const artist = imageElement.dataset.artist;
        
        setSelectedImage({
          src: imageElement.src,
          alt: imageElement.alt,
          pixivId,
          artist,
        });
      };

      handlers.set(imageElement, handler);
      imageElement.addEventListener("click", handler);
    });

    return () => {
      images.forEach((img) => {
        const imageElement = img as HTMLImageElement;
        imageElement.dataset.lightbox = "false";
        // 正确移除事件监听器，防止内存泄漏
        const handler = handlers.get(imageElement);
        if (handler) {
          imageElement.removeEventListener("click", handler);
          handlers.delete(imageElement);
        }
      });
    };
  }, []);

  return (
    <>
      {selectedImage && (
        <Lightbox
          src={selectedImage.src}
          alt={selectedImage.alt}
          pixivId={selectedImage.pixivId}
          artist={selectedImage.artist}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
}


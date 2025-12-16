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
    // 为所有文章图片添加点击事件
    const images = document.querySelectorAll(".markdown-content img, .prose img");
    
    images.forEach((img) => {
      const imageElement = img as HTMLImageElement;
      
      // 检查是否已有事件监听器
      if (imageElement.dataset.lightbox === "true") return;
      imageElement.dataset.lightbox = "true";

      imageElement.style.cursor = "zoom-in";
      
      imageElement.addEventListener("click", () => {
        // 尝试从data属性获取Pixiv信息
        const pixivId = imageElement.dataset.pixivId;
        const artist = imageElement.dataset.artist;
        
        setSelectedImage({
          src: imageElement.src,
          alt: imageElement.alt,
          pixivId,
          artist,
        });
      });
    });

    return () => {
      images.forEach((img) => {
        const imageElement = img as HTMLImageElement;
        imageElement.dataset.lightbox = "false";
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


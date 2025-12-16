import { motion } from "framer-motion";
import { useState, useRef } from "react";
import type { Route } from "./+types/admin.gallery";
import { redirect } from "react-router";
import { getSessionId } from "~/utils/auth";
import { SmartCrop } from "~/components/admin/SmartCrop";

export async function loader({ request }: Route.LoaderArgs) {
  // 检查是否已登录
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/admin/login");
  }
  
  // TODO: 从R2获取图片列表
  const images = [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1542596594-649edbc13630?q=80&w=400",
      name: "file_01.jpg",
      size: 245,
      uploadedAt: "2024-01-15",
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=400",
      name: "screenshot.png",
      size: 312,
      uploadedAt: "2024-01-14",
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=400",
      name: "waifu_03.webp",
      size: 180,
      uploadedAt: "2024-01-13",
    },
  ];
  
  const totalSize = 1200; // MB
  const maxSize = 10000; // MB
  
  return { images, totalSize, maxSize };
}

export default function AdminGallery({ loaderData }: Route.ComponentProps) {
  const { images, totalSize, maxSize } = loaderData;
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    // TODO: 上传文件到R2
    console.log("上传文件:", files);
    alert(`准备上传 ${files.length} 个文件`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // TODO: 上传文件到R2
      console.log("上传文件:", Array.from(files));
      alert(`准备上传 ${files.length} 个文件`);
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">影像仓库</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">存储用量</p>
              <p className="text-lg font-bold text-gray-800 font-mono">
                {totalSize}MB / {maxSize}MB
              </p>
            </div>
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📤 上传图片
            </motion.button>
            <motion.button
              className="px-6 py-3 bg-red-500 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🧹 一键清理孤儿文件
            </motion.button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* 智能裁切工具 */}
        <div className="mb-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <SmartCrop
            onCrop={(file, cropData) => {
              console.log("智能裁切完成:", cropData);
              // TODO: 上传到R2并应用裁切
            }}
          />
        </div>

        {/* 拖拽上传区 */}
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mb-6 p-12 border-2 border-dashed rounded-2xl text-center transition-colors ${
            isDragging
              ? "border-pink-500 bg-pink-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400"
          }`}
          animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
        >
          <p className="text-lg text-gray-600 mb-2">
            {isDragging ? "放下文件开始上传" : "把你的老婆们拖到这里上传"}
          </p>
          <p className="text-sm text-gray-500">支持 WebP / JPG / PNG</p>
        </motion.div>

        {/* 图片瀑布流 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              className="relative cursor-pointer"
              initial={{ opacity: 0, y: 20, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -8, rotate: 2 }}
              onClick={() => setSelectedImage(image.id)}
            >
              {/* 拍立得照片效果 */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="aspect-square bg-gray-100 rounded overflow-hidden mb-3">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* 底部文件名（手写风格） */}
                <div className="text-xs text-gray-600 font-mono border-t border-gray-200 pt-2">
                  {image.name}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-gray-400 font-mono">
                    {image.size} KB
                  </div>
                  <div className="flex gap-1">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(image.url);
                        alert("链接已复制！");
                      }}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      复制链接
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("确定要删除这张图片吗？")) {
                          // TODO: 删除图片
                          alert("已删除");
                        }
                      }}
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      🗑️ 删除
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 图片详情弹窗 */}
        {selectedImage && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-2xl w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              {images.find((img) => img.id === selectedImage) && (
                <>
                  <img
                    src={images.find((img) => img.id === selectedImage)!.url}
                    alt="Preview"
                    className="w-full rounded-lg mb-4"
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800">
                        {images.find((img) => img.id === selectedImage)!.name}
                      </h3>
                      <p className="text-sm text-gray-500 font-mono">
                        {images.find((img) => img.id === selectedImage)!.size} KB
                      </p>
                    </div>
                    <motion.button
                      className="px-4 py-2 bg-pink-500 text-white rounded-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const url = images.find((img) => img.id === selectedImage)!.url;
                        navigator.clipboard.writeText(url);
                        alert("链接已复制！");
                      }}
                    >
                      📋 复制链接
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

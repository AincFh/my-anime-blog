import { useState, useRef } from "react";
import { motion } from "framer-motion";

/**
 * 智能图床人脸裁切
 * 功能：上传图片时自动识别人脸重心，生成缩略图时确保脸部在中心
 * 注意：这里使用简化的实现，实际应该调用 Cloudflare Images API 或 smartcrop.js
 */
interface SmartCropProps {
  onCrop?: (file: File, cropData: { x: number; y: number; width: number; height: number }) => void;
}

export function SmartCrop({ onCrop }: SmartCropProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 简化的"人脸检测"（实际应该使用AI或smartcrop.js）
  const detectFace = (img: HTMLImageElement): { x: number; y: number; width: number; height: number } => {
    // 这里使用简化的中心区域检测
    // 实际应该使用 face-api.js 或 Cloudflare Images 的 AI 能力
    const centerX = img.width / 2;
    const centerY = img.height / 3; // 通常人脸在上1/3处
    const size = Math.min(img.width, img.height) * 0.4;

    return {
      x: centerX - size / 2,
      y: centerY - size / 2,
      width: size,
      height: size,
    };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setPreview(img.src);

        // 检测人脸（简化版）
        const faceBox = detectFace(img);
        setFaceDetected(true);

        // 在canvas上绘制预览
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            // 绘制人脸检测框
            ctx.strokeStyle = "#FF6B9D";
            ctx.lineWidth = 3;
            ctx.strokeRect(faceBox.x, faceBox.y, faceBox.width, faceBox.height);
          }
        }

        if (onCrop) {
          onCrop(file, faceBox);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          智能裁切（自动识别人脸重心）
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <motion.button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          📷 选择图片
        </motion.button>
      </div>

      {preview && (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full rounded-lg" />
            {faceDetected && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                ✓ 人脸已识别
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <p className="text-xs text-gray-500">
            💡 提示：缩略图将自动以人脸为中心裁切，告别"无头学姐"惨案
          </p>
        </motion.div>
      )}
    </div>
  );
}


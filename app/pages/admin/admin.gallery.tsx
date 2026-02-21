import { motion } from "framer-motion";
import { useState, useRef, useMemo } from "react";
import type { Route } from "./+types/admin.gallery";
import { redirect, useSubmit, useNavigation, Form } from "react-router";
import { getSessionId } from "~/utils/auth";
import { SmartCrop } from "~/components/admin/SmartCrop";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import { uploadToR2, deleteFromR2, getR2PublicUrl } from "~/services/r2.server";
import { Search, Filter, Trash2, CheckCircle2, Circle, Copy, Eye, Plus, CloudUpload } from "lucide-react";

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = (context as any).cloudflare.env;
  const bucket = env.IMAGES_BUCKET;

  // 检查是否已登录
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/admin/login");
  }

  // 从R2获取图片列表
  let images: any[] = [];
  let totalSize = 0;
  const maxSize = 10000; // MB (Mock limit)

  if (bucket) {
    try {
      const list = await bucket.list({ limit: 100 });
      images = list.objects.map((obj: any, index: number) => ({
        id: index + 1, // temporary ID
        url: getR2PublicUrl(obj.key, undefined, env),
        name: obj.key,
        size: Math.round(obj.size / 1024), // KB
        uploadedAt: obj.uploaded.toISOString().split('T')[0],
        key: obj.key
      }));

      // Calculate total usage
      totalSize = Math.round(list.objects.reduce((acc: number, obj: any) => acc + obj.size, 0) / 1024 / 1024);
    } catch (e) {
      console.error("Failed to list R2 objects", e);
    }
  }

  return { images, totalSize, maxSize };
}

export async function action({ request, context }: Route.ActionArgs) {
  const env = (context as any).cloudflare.env;
  const bucket = env.IMAGES_BUCKET;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "upload") {
    const files = formData.getAll("files") as File[];
    let successCount = 0;

    for (const file of files) {
      if (file.size > 0) {
        // 直接上传，不进行任何压缩，尊重用户原始画质需求
        const result = await uploadToR2(bucket, file);
        if (result.success) successCount++;
      }
    }
    return { success: true, message: `成功上传 ${successCount} 个文件` };
  }

  if (intent === "delete") {
    const key = formData.get("key") as string;
    if (key) {
      await deleteFromR2(bucket, key);
      return { success: true, message: "文件已删除" };
    }
  }

  if (intent === "batchDelete") {
    const keys = formData.getAll("keys") as string[];
    for (const key of keys) {
      await deleteFromR2(bucket, key);
    }
    return { success: true, message: `成功删除 ${keys.length} 个文件` };
  }

  return null;
}

export default function AdminGallery({ loaderData }: Route.ComponentProps) {
  const { images, totalSize, maxSize } = loaderData;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const filteredImages = useMemo(() => {
    return images.filter((img: any) => {
      const matchesSearch = img.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || img.name.startsWith(categoryFilter + "/");
      return matchesSearch && matchesCategory;
    });
  }, [images, searchQuery, categoryFilter]);

  const toggleSelect = (key: string) => {
    setSelectedKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleSelectAll = () => {
    if (selectedKeys.length === filteredImages.length) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(filteredImages.map((img: any) => img.key));
    }
  };

  const handleBatchDelete = () => {
    if (confirm(`确定要永久删除这 ${selectedKeys.length} 张图片吗？`)) {
      const formData = new FormData();
      formData.append("intent", "batchDelete");
      selectedKeys.forEach(key => formData.append("keys", key));
      submit(formData, { method: "post" });
      setSelectedKeys([]);
    }
  };

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
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const formData = new FormData();
      formData.append("intent", "upload");
      Array.from(files).forEach(file => formData.append("files", file));
      submit(formData, { method: "post", encType: "multipart/form-data" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append("intent", "upload");
      Array.from(files).forEach(file => formData.append("files", file));
      submit(formData, { method: "post", encType: "multipart/form-data" });
    }
  };

  const handleDelete = (key: string) => {
    if (confirm("确定要删除这张图片吗？")) {
      const formData = new FormData();
      formData.append("intent", "delete");
      formData.append("key", key);
      submit(formData, { method: "post" });
      setSelectedImage(null);
    }
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white font-orbitron tracking-tight mb-2">影像仓库</h1>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shadow-[0_0_8px_#8b5cf6]" />
                <p className="text-xs font-mono text-white/50">
                  {totalSize}MB / {maxSize}MB USED
                </p>
              </div>
              <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">R2 Storage Active</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className={`flex-1 lg:flex-none px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_25px_rgba(139,92,246,0.5)] transition-all active:scale-95 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            >
              <Plus size={18} />
              {isSubmitting ? "上传中..." : "上传新的老婆"}
            </motion.button>
            <motion.button
              className="px-6 py-3 bg-white/5 border border-white/10 text-white/70 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
            >
              <Trash2 size={16} className="text-red-400" />
              清理孤儿
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

        {/* 顶部搜索与分类 */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors" size={18} />
            <input
              type="text"
              placeholder="搜索文件名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/10 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group min-w-[140px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none focus:outline-none focus:border-violet-500/40 transition-all text-sm cursor-pointer font-bold"
              >
                <option value="all" className="bg-[#0f1629]">全部类型</option>
                <option value="articles" className="bg-[#0f1629]">文章插画</option>
                <option value="anime" className="bg-[#0f1629]">番剧截图</option>
                <option value="avatars" className="bg-[#0f1629]">头像/壁纸</option>
              </select>
            </div>
            {selectedKeys.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleBatchDelete}
                className="px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl text-sm font-black flex items-center gap-2 hover:bg-red-500/30 transition-all shadow-lg"
              >
                <Trash2 size={16} />
                <span>删除 ({selectedKeys.length})</span>
              </motion.button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={toggleSelectAll}
            className="text-xs font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2"
          >
            {selectedKeys.length === filteredImages.length && filteredImages.length > 0 ? (
              <CheckCircle2 size={16} className="text-violet-400" />
            ) : (
              <Circle size={16} />
            )}
            全选当前影像
          </button>
          <span className="text-[10px] text-white/20 font-mono tracking-tighter">
            COUNT: {filteredImages.length} ITEMS FOUND
          </span>
        </div>

        {/* 智能裁切工具 */}
        <div className="mb-6 glass-card-deep tech-border rounded-2xl p-6">
          <SmartCrop
            onCrop={(file, cropData) => {
              console.log("智能裁切数据:", cropData);
              alert("裁切参数已生成 (仅预览)");
            }}
          />
        </div>

        {/* 拖拽上传区 */}
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mb-10 p-12 border-2 border-dashed rounded-3xl text-center transition-all ${isDragging
            ? "border-violet-500 bg-violet-500/10"
            : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          animate={isDragging ? { scale: 1.01 } : { scale: 1 }}
        >
          <div className="flex flex-col items-center gap-3">
            <CloudUpload size={48} className={isDragging ? "text-violet-400" : "text-white/20"} />
            <p className="text-lg text-white/70 font-bold">
              {isDragging ? "放下文件开始上传" : "把你的影像拖到这里上传"}
            </p>
            <p className="text-xs text-white/30 font-mono">SUPPORT WEBP / JPG / PNG (LOSSLESS UPLOAD)</p>
          </div>
        </motion.div>

        {filteredImages.length === 0 ? (
          <div className="p-24 text-center glass-card-deep tech-border rounded-3xl border-dashed border-white/10">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={36} className="text-white/20" />
            </div>
            <p className="text-xl text-white/40 font-bold mb-2">未找到匹配的影像</p>
            <p className="text-sm text-white/20 font-mono italic">TRY DIFFERENT SEARCH KEYWORDS OR FILTERS</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredImages.map((image: any, index: number) => (
              <motion.div
                key={image.key}
                className={`relative group cursor-pointer transition-transform will-change-transform ${selectedKeys.includes(image.key) ? "scale-[0.98]" : ""}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => toggleSelect(image.key)}
              >
                <div className={`bg-[#0a0e1a]/95 rounded-2xl p-3 border transition-colors duration-300 overflow-hidden ${selectedKeys.includes(image.key) ? "border-violet-500 bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]" : "border-white/5 hover:border-violet-500/30"}`}>
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-black">
                    <OptimizedImage
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 will-change-transform"
                      width={400}
                    />

                    {/* 复选框叠加 */}
                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedKeys.includes(image.key)
                      ? "bg-violet-500 border-violet-500 scale-100 shadow-[0_0_10px_#8b5cf6]"
                      : "bg-black/40 border-white/40 opacity-0 group-hover:opacity-100 scale-90"
                      }`}>
                      {selectedKeys.includes(image.key) && <CheckCircle2 size={14} className="text-white" />}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedImage(image.key); }}
                          className="p-2 bg-white/20 hover:bg-violet-500/90 rounded-xl text-white transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(image.url);
                            alert("已复制永久链接！");
                          }}
                          className="p-2 bg-white/10 hover:bg-violet-500/80 backdrop-blur-md rounded-xl text-white transition-all transform hover:scale-110"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(image.key);
                          }}
                          className="p-2 bg-red-500/20 hover:bg-red-500 backdrop-blur-md rounded-xl text-white transition-all transform hover:scale-110 border border-red-500/20"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-white/50 font-bold truncate mb-1 px-1" title={image.name}>
                    {image.name.split('/').pop()}
                  </p>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] text-white/30 font-black tracking-tighter">{image.size} KB</span>
                    <span className="text-[9px] text-white/30 font-mono italic">{image.uploadedAt}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* 图片详情弹窗 */}
        {selectedImage && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              className="glass-card-deep tech-border rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {images.find((img) => img.key === selectedImage) && (
                <div className="flex flex-col h-full">
                  <div className="w-full rounded-2xl overflow-hidden bg-black/40 flex-1 flex items-center justify-center min-h-[40vh] mb-6">
                    <OptimizedImage
                      src={images.find((img) => img.key === selectedImage)!.url}
                      alt="Preview"
                      className="w-full h-auto max-h-[70vh] object-contain"
                      width={1200}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-xl text-white truncate max-w-md font-orbitron">
                        {images.find((img) => img.key === selectedImage)!.name.split('/').pop()}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-white/40 font-mono italic">
                          {images.find((img) => img.key === selectedImage)!.size} KB / {images.find((img) => img.key === selectedImage)!.uploadedAt}
                        </p>
                        <span className="text-[10px] px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full border border-violet-500/20 font-black tracking-widest uppercase">Lossless</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <motion.button
                        className="flex-1 sm:flex-none px-6 py-3 bg-violet-600/20 border border-violet-500/30 text-white rounded-2xl font-bold text-sm hover:bg-violet-600 transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const url = images.find((img) => img.key === selectedImage)!.url;
                          navigator.clipboard.writeText(url);
                          alert("已复制永久链接！");
                        }}
                      >
                        <Copy size={16} />
                        复制链接
                      </motion.button>
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="px-6 py-3 bg-white/5 border border-white/10 text-white/50 rounded-2xl font-bold text-sm hover:text-white transition-all"
                      >
                        关闭预览
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

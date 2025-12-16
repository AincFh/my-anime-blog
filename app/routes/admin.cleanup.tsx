import { motion } from "framer-motion";
import { useState } from "react";
import type { Route } from "./+types/admin.cleanup";
import { redirect } from "react-router";
import { getSessionId } from "~/utils/auth";

export async function loader({ request }: Route.LoaderArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/admin/login");
  }
  
  // TODO: 扫描R2存储桶，找出孤儿文件
  const orphanFiles = [
    { name: "image-001.jpg", size: 245, uploadedAt: "2024-01-15", lastUsed: null },
    { name: "image-002.jpg", size: 312, uploadedAt: "2024-01-14", lastUsed: null },
    { name: "old-banner.png", size: 150, uploadedAt: "2023-12-01", lastUsed: null },
  ];
  
  const totalSize = orphanFiles.reduce((sum, file) => sum + file.size, 0);
  
  return { orphanFiles, totalSize };
}

export default function AssetCleaner({ loaderData }: Route.ComponentProps) {
  const { orphanFiles, totalSize } = loaderData;
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [isCleaning, setIsCleaning] = useState(false);

  const toggleFile = (id: number) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFiles(newSelected);
  };

  const handleCleanup = async () => {
    if (selectedFiles.size === 0) {
      alert("请选择要清理的文件");
      return;
    }

    if (!confirm(`确定要删除 ${selectedFiles.size} 个文件吗？此操作不可恢复！`)) {
      return;
    }

    setIsCleaning(true);
    // TODO: 调用API删除文件
    setTimeout(() => {
      setIsCleaning(false);
      alert("清理完成！");
      setSelectedFiles(new Set());
    }, 2000);
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">媒体资源清理</h1>
          <motion.button
            onClick={handleCleanup}
            disabled={selectedFiles.size === 0 || isCleaning}
            className="px-6 py-3 bg-red-500 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: selectedFiles.size > 0 ? 1.05 : 1 }}
            whileTap={{ scale: selectedFiles.size > 0 ? 0.95 : 1 }}
          >
            {isCleaning ? "清理中..." : `清理选中 (${selectedFiles.size})`}
          </motion.button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">🧹 孤儿文件扫描</h2>
            <div className="text-right">
              <p className="text-sm text-gray-600">可释放空间</p>
              <p className="text-2xl font-bold text-red-600">{totalSize} KB</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            这些文件上传了但未在任何文章中使用
          </p>

          <div className="space-y-3">
            {orphanFiles.map((file, index) => (
              <motion.div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedFiles.has(index)
                    ? "bg-red-50 border-red-300"
                    : "bg-gray-50 border-gray-200 hover:border-gray-300"
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => toggleFile(index)}
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(index)}
                  onChange={() => toggleFile(index)}
                  className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {file.size} KB · 上传于 {file.uploadedAt}
                  </p>
                </div>
                <span className="text-xs text-red-600 font-medium">未使用</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}


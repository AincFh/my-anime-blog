import { motion } from "framer-motion";
import { useState } from "react";
import { Trash2, AlertTriangle, ShieldCheck, Database, RefreshCcw, CheckCircle2, History, XCircle, Search } from "lucide-react";
import { confirmModal } from "~/components/ui/Modal";
import { redirect, Form, useActionData, useNavigation, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { getSessionId } from "~/utils/auth";
import { getArchiveStats, runAllArchives } from "~/services/maintenance/archive.server";
import { toast } from "~/components/ui/Toast";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/panel/login");
  }

  const { anime_db } = context.cloudflare.env;

  // 获取日志归档统计
  let archiveStats = { auditLogs: 0, loginHistory: 0, coinTransactions: 0 };
  try {
    archiveStats = await getArchiveStats(anime_db);
  } catch (error) {
    console.error("Failed to fetch archive stats:", error);
  }

  // TODO: 扫描R2存储桶，找出孤儿文件
  const orphanFiles = [
    { name: "image-001.jpg", size: 245, uploadedAt: "2024-01-15", lastUsed: null },
    { name: "image-002.jpg", size: 312, uploadedAt: "2024-01-14", lastUsed: null },
    { name: "old-banner.png", size: 150, uploadedAt: "2023-12-01", lastUsed: null },
  ];

  const totalSize = orphanFiles.reduce((sum, file) => sum + file.size, 0);

  return { orphanFiles, totalSize, archiveStats };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/panel/login");
  }

  const { anime_db } = context.cloudflare.env;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "archive_logs") {
    try {
      const results = await runAllArchives(anime_db);
      const totalArchived =
        Object.values(results).reduce((sum, res) => sum + res.archivedCount, 0);
      return { success: true, message: `成功归档 ${totalArchived} 条日志数据`, results };
    } catch (error) {
      return { success: false, message: "归档失败: " + String(error) };
    }
  }

  return { success: false, message: "未知操作" };
}

export default function AssetCleaner() {
  const loaderData = useLoaderData<typeof loader>();
  const { orphanFiles, totalSize, archiveStats } = loaderData;
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [isCleaning, setIsCleaning] = useState(false);
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isArchiving = navigation.state === "submitting" && navigation.formData?.get("intent") === "archive_logs";

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
    if (selectedFiles.size === 0) return;

    const res = await confirmModal({
      title: "危险操作",
      message: `确定要删除 ${selectedFiles.size} 个文件吗？此操作不可恢复！`
    });

    if (!res) {
      return;
    }

    setIsCleaning(true);
    // TODO: 调用API删除文件
    setTimeout(() => {
      setIsCleaning(false);
      toast.success("清理完成！");
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

        {actionData?.message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl ${actionData.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
          >
            {actionData.message}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 日志归档卡片 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">📦 日志归档</h2>
              <Form method="post">
                <input type="hidden" name="intent" value="archive_logs" />
                <button
                  type="submit"
                  disabled={isArchiving}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                >
                  {isArchiving ? "归档中..." : "立即归档"}
                </button>
              </Form>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              将旧日志迁移到归档表，保持主数据库轻量高效
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">审计日志 (&gt;90天)</span>
                <span className="font-mono font-bold text-blue-600">{archiveStats.auditLogs} 条</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">登录历史 (&gt;30天)</span>
                <span className="font-mono font-bold text-blue-600">{archiveStats.loginHistory} 条</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">积分记录 (&gt;180天)</span>
                <span className="font-mono font-bold text-blue-600">{archiveStats.coinTransactions} 条</span>
              </div>
            </div>
          </div>
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
            {orphanFiles.map((file: { name: string, size: number, uploadedAt: string }, index: number) => (
              <motion.div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedFiles.has(index)
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


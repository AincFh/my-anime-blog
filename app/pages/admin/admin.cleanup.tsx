import { motion } from "framer-motion";
import { useState } from "react";
import { Trash2, AlertTriangle, ShieldCheck, Database, RefreshCcw, CheckCircle2, History, XCircle, Search, Box, Sparkles, Loader2 } from "lucide-react";
import { confirmModal } from "~/components/ui/Modal";
import { redirect, Form, useActionData, useNavigation, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { getSessionId } from "~/utils/auth";
import { getArchiveStats, runAllArchives } from "~/services/maintenance/archive.server";
import { toast } from "~/components/ui/Toast";
import { getOrphanFiles, deleteR2Files, formatFileSize } from "~/services/r2-manager.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/panel/login");
  }

  const { anime_db, IMAGES_BUCKET } = context.cloudflare.env;

  // 获取日志归档统计
  let archiveStats = { auditLogs: 0, loginHistory: 0, coinTransactions: 0 };
  try {
    archiveStats = await getArchiveStats(anime_db);
  } catch (error) {
    console.error("Failed to fetch archive stats:", error);
  }

  // 扫描 R2 孤儿文件
  let orphanFiles: any[] = [];
  try {
    const orphans = await getOrphanFiles(IMAGES_BUCKET, anime_db);
    orphanFiles = orphans.map(file => ({
      key: file.key,
      name: file.key.split('/').pop() || file.key,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      uploadedAt: new Date(file.uploadedAt).toLocaleDateString("zh-CN"),
    }));
  } catch (error) {
    console.error("Failed to scan orphan files:", error);
  }

  const totalSize = orphanFiles.reduce((sum, file) => sum + file.size, 0);
  const totalSizeFormatted = formatFileSize(totalSize);

  return { orphanFiles, totalSize, totalSizeFormatted, archiveStats };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/panel/login");
  }

  const { anime_db, IMAGES_BUCKET } = context.cloudflare.env;
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

  if (intent === "delete_orphans") {
    const keysJson = formData.get("keys") as string;
    if (!keysJson) {
      return { success: false, message: "未选择要删除的文件" };
    }

    try {
      const keys = JSON.parse(keysJson) as string[];
      const result = await deleteR2Files(IMAGES_BUCKET, keys);
      
      if (result.success) {
        return { 
          success: true, 
          message: `成功删除 ${result.deletedCount} 个孤儿文件，释放空间 ${formatFileSize(keys.length * 100 * 1024)}` 
        };
      } else {
        return { 
          success: false, 
          message: `删除完成，但有 ${result.errors.length} 个文件删除失败` 
        };
      }
    } catch (error) {
      return { success: false, message: "删除失败: " + String(error) };
    }
  }

  return { success: false, message: "未知操作" };
}

export default function AssetCleaner() {
  const loaderData = useLoaderData<typeof loader>();
  const { orphanFiles, totalSize, totalSizeFormatted, archiveStats } = loaderData;
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isArchiving = navigation.state === "submitting" && navigation.formData?.get("intent") === "archive_logs";
  const isDeleting = navigation.state === "submitting" && navigation.formData?.get("intent") === "delete_orphans";

  const toggleFile = (key: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedFiles(newSelected);
  };

  const selectAll = () => {
    if (selectedFiles.size === orphanFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(orphanFiles.map(f => f.key)));
    }
  };

  const handleCleanup = async () => {
    if (selectedFiles.size === 0) return;

    const res = await confirmModal({
      title: "危险操作",
      message: `确定要永久删除 ${selectedFiles.size} 个文件吗？此操作不可恢复！`
    });

    if (!res) {
      return;
    }

    setIsCleaning(true);

    const form = new FormData();
    form.append("intent", "delete_orphans");
    form.append("keys", JSON.stringify(Array.from(selectedFiles)));

    try {
      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      
      // 刷新页面以更新列表
      window.location.reload();
    } catch (error) {
      toast.error("删除失败，请重试");
      setIsCleaning(false);
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
          <h1 className="text-3xl font-bold text-gray-800">媒体资源清理</h1>
          <div className="flex gap-3">
            <motion.button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCcw size={16} />
              刷新
            </motion.button>
            <motion.button
              onClick={handleCleanup}
              disabled={selectedFiles.size === 0 || isCleaning || isDeleting}
              className="px-6 py-3 bg-red-500 text-white rounded-xl font-medium shadow-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              whileHover={{ scale: selectedFiles.size > 0 ? 1.05 : 1 }}
              whileTap={{ scale: selectedFiles.size > 0 ? 0.95 : 1 }}
            >
              {isCleaning || isDeleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  删除中...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  删除选中 ({selectedFiles.size})
                </>
              )}
            </motion.button>
          </div>
        </div>

        {actionData?.message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl ${actionData.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
              }`}
          >
            {actionData.message}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 日志归档卡片 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Box size={20} /> 日志归档</h2>
              <Form method="post">
                <input type="hidden" name="intent" value="archive_logs" />
                <button
                  type="submit"
                  disabled={isArchiving}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium shadow-sm hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isArchiving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      归档中...
                    </>
                  ) : (
                    <>
                      <History size={14} />
                      立即归档
                    </>
                  )}
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

          {/* R2 存储统计卡片 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Sparkles size={20} /> R2 存储概览</h2>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              云端存储桶中的文件使用情况
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">孤儿文件数量</span>
                <span className="font-mono font-bold text-orange-600">{orphanFiles.length} 个</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="text-red-600 font-medium">可释放空间</span>
                <span className="font-mono font-bold text-red-600 text-lg">{totalSizeFormatted}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 孤儿文件列表 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Trash2 size={20} /> 孤儿文件</h2>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                未被任何内容引用
              </span>
            </div>
            {orphanFiles.length > 0 && (
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedFiles.size === orphanFiles.length ? "取消全选" : "全选"}
              </button>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-6">
            这些文件上传了但未在任何文章、番剧、图库或用户头像中使用，可以安全删除
          </p>

          {orphanFiles.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-green-400" />
              <p className="text-lg font-medium">太棒了！没有发现孤儿文件</p>
              <p className="text-sm mt-1">R2 存储空间得到充分利用</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {orphanFiles.map((file: any, index: number) => (
                <motion.div
                  key={file.key}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedFiles.has(file.key)
                      ? "bg-red-50 border-red-300"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => toggleFile(file.key)}
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.key)}
                    onChange={() => toggleFile(file.key)}
                    className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate" title={file.key}>{file.name}</p>
                    <p className="text-xs text-gray-500 truncate" title={file.key}>
                      {file.key}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-gray-700">{file.sizeFormatted}</p>
                    <p className="text-xs text-gray-500">上传于 {file.uploadedAt}</p>
                  </div>
                  <span className="text-xs text-orange-600 font-medium shrink-0">未使用</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

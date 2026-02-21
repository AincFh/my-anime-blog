import { motion } from "framer-motion";
import { useState } from "react";
import { Activity, Server, ShieldCheck, Database, FileText, Globe, Key, Clock, Settings, RefreshCcw, Bell } from "lucide-react";
import { confirmModal } from "~/components/ui/Modal";
import { toast } from "~/components/ui/Toast";

/**
 * 系统健康监控
 * 功能：缓存命中率、D1延迟、一键净化
 */
export function SystemHealth() {
  const [isPurging, setIsPurging] = useState(false);

  // 模拟数据
  const cacheHitRate = 85; // 缓存命中率
  const d1Latency = 12; // D1延迟（ms）
  const r2Storage = 120; // R2存储（MB）

  const handleClearCache = async () => {
    const res = await confirmModal({ title: "清理缓存", message: "确定要清除全站缓存吗？这可能会影响性能。" });
    if (!res) return;

    setIsPurging(true);
    // TODO: 调用实际的API清除缓存
    setTimeout(() => {
      setIsPurging(false);
      toast.success("系统缓存净化完毕！");
    }, 2000);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        ⚙️ 系统状态
      </h2>

      <div className="space-y-4">
        {/* 缓存命中率 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">缓存命中率</span>
            <span className="text-sm font-bold text-blue-600">{cacheHitRate}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${cacheHitRate}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            CDN帮你挡了 {cacheHitRate}% 的流量
          </p>
        </div>

        {/* D1延迟 */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-sm font-medium text-gray-700">D1 数据库延迟</p>
              <p className="text-xs text-gray-500">响应速度</p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={`text-lg font-bold ${d1Latency < 20 ? "text-green-600" : d1Latency < 50 ? "text-yellow-600" : "text-red-600"
                }`}
            >
              {d1Latency}ms
            </p>
            <p className="text-xs text-gray-500">
              {d1Latency < 20 ? "极快" : d1Latency < 50 ? "正常" : "较慢"}
            </p>
          </div>
        </div>

        {/* R2存储 */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎒</span>
            <div>
              <p className="text-sm font-medium text-gray-700">R2 存储占用</p>
              <p className="text-xs text-gray-500">媒体资源</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-purple-600">{r2Storage} MB</p>
            <p className="text-xs text-gray-500">/ 1000 MB</p>
          </div>
        </div>

        {/* 一键净化 */}
        <motion.button
          onClick={handleClearCache}
          disabled={isPurging}
          className="w-full px-4 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: isPurging ? 1 : 1.02 }}
          whileTap={{ scale: isPurging ? 1 : 0.98 }}
        >
          {isPurging ? "清除中..." : "🚀 一键清除缓存"}
        </motion.button>
      </div>
    </div>
  );
}


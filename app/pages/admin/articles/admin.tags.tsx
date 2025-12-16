import { motion } from "framer-motion";
import { useState } from "react";
import type { Route } from "./+types/admin.tags";
import { redirect } from "react-router";
import { getSessionId } from "~/utils/auth";

export async function loader({ request }: Route.LoaderArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/admin/login");
  }
  
  // TODO: 从数据库获取标签和分类
  const tags = [
    { id: 1, name: "React", count: 15, color: "#3B82F6" },
    { id: 2, name: "随笔", count: 20, color: "#10B981" },
    { id: 3, name: "原神", count: 8, color: "#F59E0B" },
    { id: 4, name: "动漫", count: 25, color: "#EF4444" },
    { id: 5, name: "技术", count: 12, color: "#8B5CF6" },
  ];
  
  const categories = [
    { id: 1, name: "随笔", order: 1 },
    { id: 2, name: "技术", order: 2 },
    { id: 3, name: "动漫", order: 3 },
  ];
  
  return { tags, categories };
}

export default function TagManager({ loaderData }: Route.ComponentProps) {
  const { tags, categories } = loaderData;
  const [selectedTag, setSelectedTag] = useState<number | null>(null);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-8">标签与分类管理</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 标签云 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">🏷️ 标签云</h2>
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <motion.button
                  key={tag.id}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white shadow-sm hover:shadow-md transition-shadow"
                  style={{ backgroundColor: tag.color }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTag(tag.id)}
                >
                  {tag.name} ({tag.count})
                </motion.button>
              ))}
            </div>
          </div>

          {/* 分类树 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">📚 分类树</h2>
            <div className="space-y-2">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-move"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📁</span>
                    <span className="font-medium text-gray-800">{category.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">拖拽排序</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


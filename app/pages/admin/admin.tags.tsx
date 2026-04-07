import { motion } from "framer-motion";
import { useState } from "react";
import type { Route } from "./+types/admin.tags";
import { redirect } from "react-router";
import { getSessionId } from "~/utils/auth";
import { Tag, BookOpen, Archive, Plus, Edit3, Trash2, Loader2, CheckCircle2 } from "lucide-react";

export async function loader({ request, context }: Route.LoaderArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/panel/login");
  }

  const { anime_db } = context.cloudflare.env;

  try {
    // 从数据库获取标签（聚合查询）
    const tagsResult = await anime_db
      .prepare(`
        SELECT 
          t.id,
          t.name,
          t.color,
          COUNT(a.id) as article_count
        FROM tags t
        LEFT JOIN articles a ON a.tags LIKE '%' || t.name || '%'
        GROUP BY t.id, t.name, t.color
        ORDER BY article_count DESC
      `)
      .all();

    // 从数据库获取分类
    const categoriesResult = await anime_db
      .prepare(`
        SELECT id, name, sort_order as sortOrder
        FROM categories
        ORDER BY sort_order ASC
      `)
      .all();

    return {
      tags: tagsResult.results || [],
      categories: categoriesResult.results || [],
    };
  } catch (error) {
    console.error("Failed to fetch tags/categories:", error);
    
    // 如果表不存在，返回空数组
    return { tags: [], categories: [] };
  }
}

export async function action({ request, context }: Route.ActionArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/panel/login");
  }

  const { anime_db } = context.cloudflare.env;
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "create_tag") {
      const name = formData.get("name") as string;
      const color = formData.get("color") as string || "#6366f1";

      if (!name || name.trim().length === 0) {
        return { success: false, message: "标签名称不能为空" };
      }

      await anime_db
        .prepare(`INSERT INTO tags (name, color) VALUES (?, ?)`)
        .bind(name.trim(), color)
        .run();

      return { success: true, message: `标签 "${name}" 创建成功` };
    }

    if (intent === "update_tag") {
      const id = formData.get("id") as string;
      const name = formData.get("name") as string;
      const color = formData.get("color") as string;

      if (!id || !name) {
        return { success: false, message: "缺少必要参数" };
      }

      await anime_db
        .prepare(`UPDATE tags SET name = ?, color = ? WHERE id = ?`)
        .bind(name.trim(), color, parseInt(id))
        .run();

      return { success: true, message: `标签 "${name}" 更新成功` };
    }

    if (intent === "delete_tag") {
      const id = formData.get("id") as string;

      if (!id) {
        return { success: false, message: "缺少标签 ID" };
      }

      await anime_db
        .prepare(`DELETE FROM tags WHERE id = ?`)
        .bind(parseInt(id))
        .run();

      return { success: true, message: "标签删除成功" };
    }

    if (intent === "create_category") {
      const name = formData.get("name") as string;
      const sortOrder = formData.get("sortOrder") as string;

      if (!name || name.trim().length === 0) {
        return { success: false, message: "分类名称不能为空" };
      }

      await anime_db
        .prepare(`INSERT INTO categories (name, sort_order) VALUES (?, ?)`)
        .bind(name.trim(), parseInt(sortOrder) || 0)
        .run();

      return { success: true, message: `分类 "${name}" 创建成功` };
    }

    if (intent === "update_category") {
      const id = formData.get("id") as string;
      const name = formData.get("name") as string;
      const sortOrder = formData.get("sortOrder") as string;

      if (!id || !name) {
        return { success: false, message: "缺少必要参数" };
      }

      await anime_db
        .prepare(`UPDATE categories SET name = ?, sort_order = ? WHERE id = ?`)
        .bind(name.trim(), parseInt(sortOrder) || 0, parseInt(id))
        .run();

      return { success: true, message: `分类 "${name}" 更新成功` };
    }

    if (intent === "delete_category") {
      const id = formData.get("id") as string;

      if (!id) {
        return { success: false, message: "缺少分类 ID" };
      }

      await anime_db
        .prepare(`DELETE FROM categories WHERE id = ?`)
        .bind(parseInt(id))
        .run();

      return { success: true, message: "分类删除成功" };
    }

    return { success: false, message: "未知操作" };
  } catch (error) {
    console.error("Tag/Category action error:", error);
    return { success: false, message: "操作失败: " + String(error) };
  }
}

export default function TagManager({ loaderData }: Route.ComponentProps) {
  const { tags, categories } = loaderData;
  const [selectedTag, setSelectedTag] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-white mb-8 font-orbitron">标签与分类管理</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 标签云 */}
          <div className="glass-card-deep tech-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Tag size={20} /> 标签云</h2>
              <button
                onClick={() => setIsCreating(!isCreating)}
                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
              >
                <Plus size={14} />
                新增
              </button>
            </div>

            {/* 创建标签表单 */}
            {isCreating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="标签名称"
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <form method="post" className="flex gap-2">
                    <input type="hidden" name="intent" value="create_tag" />
                    <input type="hidden" name="name" value={newTagName} />
                    <input type="hidden" name="color" value={newTagColor} />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                      onClick={() => {
                        setTimeout(() => {
                          setIsCreating(false);
                          setNewTagName("");
                          setNewTagColor("#6366f1");
                        }, 100);
                      }}
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg text-sm font-medium transition-colors"
                    >
                      取消
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            <div className="flex flex-wrap gap-3">
              {tags.map((tag: any) => (
                <motion.button
                  key={tag.id}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white shadow-sm hover:shadow-md transition-shadow flex items-center gap-2 group"
                  style={{ backgroundColor: tag.color }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag.name}
                  <span className="text-white/60">({tag.article_count || 0})</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                    <Edit3 size={12} />
                  </span>
                </motion.button>
              ))}
              {tags.length === 0 && (
                <p className="text-white/40 text-sm py-4">暂无标签，点击上方按钮创建</p>
              )}
            </div>
          </div>

          {/* 分类树 */}
          <div className="glass-card-deep tech-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><BookOpen size={20} /> 分类树</h2>
              <button
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
              >
                <Plus size={14} />
                新增
              </button>
            </div>

            {/* 创建分类表单 */}
            {isCreatingCategory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <form method="post" className="flex gap-3">
                  <input type="hidden" name="intent" value="create_category" />
                  <input
                    type="text"
                    name="name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="分类名称"
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
                    onClick={() => {
                      setTimeout(() => {
                        setIsCreatingCategory(false);
                        setNewCategoryName("");
                      }, 100);
                    }}
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(false)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg text-sm font-medium transition-colors"
                  >
                    取消
                  </button>
                </form>
              </motion.div>
            )}

            <div className="space-y-2">
              {categories.map((category: any) => (
                <motion.div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-move group"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <Archive size={18} className="text-purple-400" />
                    <span className="font-medium text-white">{category.name}</span>
                    <span className="text-xs text-white/40">排序: {category.sortOrder || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-blue-400 transition-colors">
                      <Edit3 size={14} />
                    </button>
                    <form method="post" className="inline">
                      <input type="hidden" name="intent" value="delete_category" />
                      <input type="hidden" name="id" value={category.id} />
                      <button
                        type="submit"
                        className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                        onClick={(e) => {
                          if (!confirm("确定要删除这个分类吗？")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </div>
                </motion.div>
              ))}
              {categories.length === 0 && (
                <p className="text-white/40 text-sm py-4">暂无分类，点击上方按钮创建</p>
              )}
            </div>
          </div>
        </div>

        {/* 标签详情编辑弹窗 */}
        {selectedTag && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/10"
            >
              <h3 className="text-xl font-bold text-white mb-4">编辑标签</h3>
              <form method="post" className="space-y-4">
                <input type="hidden" name="intent" value="update_tag" />
                <input type="hidden" name="id" value={selectedTag.id} />
                <div>
                  <label className="block text-sm text-white/60 mb-2">标签名称</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedTag.name}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">标签颜色</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      name="color"
                      defaultValue={selectedTag.color}
                      className="w-12 h-12 rounded-xl cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      defaultValue={selectedTag.color}
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                      readOnly
                    />
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <form method="post" className="inline">
                    <input type="hidden" name="intent" value="delete_tag" />
                    <input type="hidden" name="id" value={selectedTag.id} />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-medium transition-colors"
                      onClick={(e) => {
                        if (!confirm("确定要删除这个标签吗？")) {
                          e.preventDefault();
                        } else {
                          setSelectedTag(null);
                        }
                      }}
                    >
                      删除
                    </button>
                  </form>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTag(null)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/70 rounded-xl font-medium transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
                      onClick={() => setSelectedTag(null)}
                    >
                      保存
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

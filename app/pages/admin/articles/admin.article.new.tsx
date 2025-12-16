import { useState } from "react";
import { Form, useNavigate, redirect } from "react-router";
import type { Route } from "./+types/admin.article.new";
import { NotionEditor } from "~/components/ui/NotionEditor";
import { motion, AnimatePresence } from "framer-motion";
import { getSessionId } from "~/utils/auth";

export async function loader({ request }: Route.LoaderArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/admin/login");
  }
  return null;
}

export async function action({ request, context }: Route.ActionArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/admin/login");
  }
  const { anime_db } = context.cloudflare.env;

  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const content = formData.get("content") as string;
    const category = formData.get("category") as string;
    const cover_image = formData.get("cover_image") as string;
    const mood_color = formData.get("mood_color") as string;

    await anime_db
      .prepare(
        `INSERT INTO articles (slug, title, description, content, category, cover_image, mood_color)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(slug, title, description, content, category, cover_image || null, mood_color || null)
      .run();

    return { success: true, slug };
  } catch (error) {
    console.error("Failed to create article:", error);
    return { success: false, error: "创建文章失败" };
  }
}

export default function NewArticle() {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [zenMode, setZenMode] = useState(false);
  const [moodColor, setMoodColor] = useState("#FF9F43");

  // 自动生成 slug
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  // 心情颜色选项
  const moodColors = [
    "#FF9F43", // 橙色
    "#FF6B6B", // 红色
    "#4ECDC4", // 青色
    "#45B7D1", // 蓝色
    "#96CEB4", // 绿色
    "#FFEAA7", // 黄色
    "#DDA0DD", // 紫色
    "#F8B500", // 金色
  ];

  return (
    <AnimatePresence mode="wait">
      {zenMode ? (
        // 禅模式：全屏信纸
        <motion.div
          key="zen"
          className="fixed inset-0 bg-[#FFF8E7] z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="h-full flex flex-col items-center justify-center p-8 max-w-4xl mx-auto">
            <motion.div
              className="w-full h-full bg-white rounded-2xl shadow-lg p-12"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">禅模式</h2>
                <motion.button
                  onClick={() => setZenMode(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  退出禅模式
                </motion.button>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[calc(100%-100px)] border-none outline-none resize-none text-lg text-gray-800 font-serif leading-relaxed"
                placeholder="在这里自由地写下你的想法..."
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              />
            </motion.div>
          </div>
        </motion.div>
      ) : (
        // 正常模式
        <motion.div
          key="normal"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* 顶部工具栏 */}
          <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 flex-wrap">
              <input
                type="text"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="文章标题..."
                className="flex-1 min-w-[200px] px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />
              <input
                type="date"
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />
              {/* 心情颜色选择 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">心情:</span>
                <div className="flex gap-1">
                  {moodColors.map((color) => (
                    <motion.button
                      key={color}
                      type="button"
                      onClick={() => setMoodColor(color)}
                      className={`w-6 h-6 rounded-full border-2 ${
                        moodColor === color ? "border-gray-800 scale-110" : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
                <input type="hidden" name="mood_color" value={moodColor} />
              </div>
              <motion.button
                type="button"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                存草稿
              </motion.button>
              <motion.button
                type="submit"
                form="article-form"
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🚀 发布
              </motion.button>
            </div>
          </div>

          {/* 工具栏：二次元化 */}
          <div className="bg-white rounded-2xl p-3 mb-6 shadow-sm border border-gray-100 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 mr-2">工具栏:</span>
            {["B", "I", "Link", "Code"].map((tool) => (
              <motion.button
                key={tool}
                type="button"
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tool}
              </motion.button>
            ))}
            <motion.button
              type="button"
              className="px-3 py-1.5 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-lg text-sm font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🖼️ 插入Waifu图
            </motion.button>
            <motion.button
              type="button"
              className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🎵 插入BGM
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setZenMode(true)}
              className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-sm font-medium transition-colors ml-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🧘 禅模式
            </motion.button>
          </div>

          {/* 双栏编辑器 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Form method="post" id="article-form" className="space-y-6">
              <input type="hidden" name="slug" value={generateSlug(title)} />
              <input type="hidden" name="content" value={content} />

              {/* 摘要 */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  摘要
                </label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl
                         text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:border-pink-400
                         focus:ring-2 focus:ring-pink-100 transition-all"
                  placeholder="简短描述这篇文章..."
                />
              </div>

              {/* 分类和封面 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    分类 *
                  </label>
                  <select
                    name="category"
                    required
                    defaultValue="随笔"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl
                           text-gray-800 focus:outline-none focus:border-pink-400
                           focus:ring-2 focus:ring-pink-100 transition-all"
                  >
                    <option value="随笔">随笔</option>
                    <option value="技术">技术</option>
                    <option value="动漫">动漫</option>
                    <option value="游戏">游戏</option>
                    <option value="公告">公告</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    封面图 URL
                  </label>
                  <input
                    type="url"
                    name="cover_image"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl
                           text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-400
                           focus:ring-2 focus:ring-pink-100 transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Markdown 编辑器 - 双栏 */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  文章内容 * (Markdown)
                </label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* 左侧：Markdown 编辑区 */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                    <NotionEditor
                      value={content}
                      onChange={setContent}
                      placeholder="# 标题\n\n在这里用 Markdown 写下你的内容...\n\n支持拖拽上传图片，实时预览效果"
                    />
                  </div>
                  {/* 右侧：实时预览区 */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 overflow-y-auto max-h-[600px]">
                    <div className="prose prose-sm max-w-none">
                      {/* 这里应该使用marked渲染，暂时显示占位符 */}
                      <p className="text-gray-500 text-sm">实时预览区域</p>
                      <p className="text-gray-400 text-xs">（需要集成Markdown渲染）</p>
                    </div>
                  </div>
                </div>
              </div>
            </Form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

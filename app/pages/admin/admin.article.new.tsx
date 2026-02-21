import { useState } from "react";
import { Form, useNavigate, redirect } from "react-router";
import type { Route } from "./+types/admin.article.new";
import { NotionEditor } from "~/components/forms/NotionEditor";
import { motion, AnimatePresence } from "framer-motion";
import { getSessionId } from "~/utils/auth";
import { ArrowLeft, Save, Send, Maximize2, Minimize2, Bold, Italic, Link as LinkIcon, Code, Image as ImageIcon, Music, Type } from "lucide-react";
import { Link } from "react-router";

import { AIWritingAssistant } from "~/components/admin/AIWritingAssistant";

export async function loader({ request, context }: Route.LoaderArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/panel/login");
  }

  // 生成 CSRF Token
  const env = (context as any).cloudflare.env;
  const secret = env.CSRF_SECRET || env.PAYMENT_SECRET || "default-secret";
  const { generateCSRFToken } = await import("~/services/security/csrf.server");
  const csrfToken = await generateCSRFToken(sessionId, env.CACHE_KV, secret);

  // 检查是否为编辑模式
  const url = new URL(request.url);
  const editId = url.searchParams.get("edit");
  let article = null;

  if (editId) {
    const { anime_db } = env;
    article = await anime_db.prepare("SELECT * FROM articles WHERE id = ?").bind(editId).first();
  }

  return { csrfToken, article };
}

export async function action({ request, context }: Route.ActionArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/panel/login");
  }
  const { anime_db } = context.cloudflare.env;

  try {
    const formData = await request.formData();
    const csrfToken = formData.get("_csrf") as string;

    // 验证 CSRF
    const env = (context as any).cloudflare.env;
    const secret = env.CSRF_SECRET || env.PAYMENT_SECRET || "default-secret";
    const { validateCSRFToken } = await import("~/services/security/csrf.server");
    const csrfResult = await validateCSRFToken(csrfToken, sessionId, env.CACHE_KV, secret);

    if (!csrfResult.valid) {
      return { success: false, error: "安全校验失败: " + csrfResult.error };
    }

    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const content = formData.get("content") as string;
    const category = formData.get("category") as string;
    const cover_image = formData.get("cover_image") as string;
    const mood_color = formData.get("mood_color") as string;
    const editId = formData.get("id") as string;

    if (editId) {
      await anime_db
        .prepare(
          `UPDATE articles SET slug=?, title=?, description=?, content=?, category=?, cover_image=?, mood_color=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?`
        )
        .bind(slug, title, description, content, category, cover_image || null, mood_color || null, editId)
        .run();
    } else {
      await anime_db
        .prepare(
          `INSERT INTO articles (slug, title, description, content, category, cover_image, mood_color)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(slug, title, description, content, category, cover_image || null, mood_color || null)
        .run();
    }

    return redirect(`/admin/articles`);
  } catch (error) {
    console.error("Failed to create article:", error);
    return { success: false, error: "创建文章失败" };
  }
}

export default function NewArticle({ loaderData }: Route.ComponentProps) {
  const article = loaderData?.article;
  const csrfToken = loaderData?.csrfToken || "";

  const [content, setContent] = useState<string>(article?.content || "");
  const [title, setTitle] = useState<string>(article?.title || "");
  const [zenMode, setZenMode] = useState(false);
  const [moodColor, setMoodColor] = useState<string>(article?.mood_color || "#818cf8");

  // 自动生成 slug
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  // Modern subtle mood colors
  const moodColors = [
    "#818cf8", // Indigo
    "#f472b6", // Pink
    "#34d399", // Emerald
    "#38bdf8", // Sky
    "#fbbf24", // Amber
    "#f87171", // Red
    "#c084fc", // Purple
    "#94a3b8", // Slate
  ];

  return (
    <AnimatePresence mode="wait">
      {zenMode ? (
        // Zen Mode
        <motion.div
          key="zen"
          className="fixed inset-0 bg-[#0a0e1a] z-50 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <header className="flex justify-between items-center p-4 border-b border-white/10 bg-[#0f1629]">
            <span className="text-sm font-medium text-white/50">专注模式</span>
            <button
              onClick={() => setZenMode(false)}
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
            >
              <Minimize2 size={20} />
            </button>
          </header>
          <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-8">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-4xl font-bold text-white mb-8 placeholder-white/20"
              placeholder="文章标题..."
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full flex-1 bg-transparent border-none outline-none resize-none text-lg text-white/80 leading-relaxed font-serif placeholder-white/20"
              placeholder="开始写作..."
            />
          </div>
        </motion.div>
      ) : (
        // Normal Mode
        <motion.div
          key="normal"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="max-w-5xl mx-auto w-full pb-12"
        >
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Link to="/admin/articles">
                <button className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors shadow-sm bg-white/5 border border-white/10">
                  <ArrowLeft size={18} />
                </button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight font-orbitron">{article ? "编辑文章" : "新建文章"}</h1>
                <p className="text-white/50 text-sm mt-1">{article ? "更新世界线的偏转率。" : "起草并发布你的下一篇作品。"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto relative z-50">
              <AIWritingAssistant
                content={content}
                onInsert={(text) => setContent(prev => prev + "\n" + text)}
                onReplace={(text) => setContent(text)}
              />
              <button
                type="button"
                className="px-4 py-2 bg-white/10 border border-white/20 hover:bg-white/15 rounded-full text-sm font-medium text-white/70 transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                <span className="hidden sm:inline">存草稿</span>
              </button>
              <button
                type="submit"
                form="article-form"
                className="px-6 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-full text-sm font-medium shadow-sm shadow-violet-500/30 transition-colors flex items-center gap-2 active:scale-95"
              >
                <Send size={16} />
                <span>发布</span>
              </button>
            </div>
          </div>

          <Form method="post" id="article-form" className="space-y-6">
            <input type="hidden" name="slug" value={generateSlug(title)} />
            <input type="hidden" name="content" value={content} />
            <input type="hidden" name="mood_color" value={moodColor} />
            <input type="hidden" name="_csrf" value={csrfToken} />
            {article && <input type="hidden" name="id" value={article.id} />}

            {/* Title Card */}
            <div className="glass-card-deep tech-border rounded-2xl p-6 md:p-8 relative overflow-hidden group">
              <div
                className="absolute top-0 left-0 w-2 h-full transition-colors duration-300"
                style={{ backgroundColor: moodColor }}
              />
              <div className="pl-4">
                <input
                  type="text"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入一个吸引人的标题..."
                  className="w-full bg-transparent border-none text-3xl font-bold text-white placeholder-white/20 focus:outline-none focus:ring-0 p-0"
                  required
                />
                <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/10 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">心情 / 主题:</span>
                    <div className="flex gap-1.5 p-1 bg-white/5 rounded-full">
                      {moodColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setMoodColor(color)}
                          className={`w-6 h-6 rounded-full transition-transform ${moodColor === color ? "scale-110 shadow-md ring-2 ring-offset-2 ring-white/30" : "hover:scale-110 opacity-70"
                            }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="h-4 w-px bg-white/10 hidden sm:block" />

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">分类:</span>
                    <select
                      name="category"
                      required
                      defaultValue={article?.category || "随笔"}
                      className="bg-white/5 border border-white/10 text-sm font-medium text-white py-1.5 px-3 rounded-full focus:ring-2 focus:ring-violet-500/30 cursor-pointer"
                    >
                      <option value="随笔">随笔</option>
                      <option value="技术">技术</option>
                      <option value="动漫">动漫</option>
                      <option value="游戏">游戏</option>
                      <option value="更新">更新</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Meta Info Card */}
            <div className="glass-card-deep rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-white/80 mb-2">
                  <Type size={16} className="text-white/40" /> 摘要
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={article?.description || ""}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/10 transition-all text-sm"
                  placeholder="提供简短的摘要或说明..."
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-white/80 mb-2">
                  <ImageIcon size={16} className="text-white/40" /> 封面图链接
                </label>
                <input
                  type="url"
                  name="cover_image"
                  defaultValue={article?.cover_image || ""}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/10 transition-all text-sm mb-3"
                  placeholder="https://content.com/image.jpg"
                />
                <div className="text-xs text-white/40 bg-white/5 p-3 rounded-xl border border-dashed border-white/10">
                  高质量封面图可以提升读者参与度。必须使用绝对 URL。
                </div>
              </div>
            </div>

            {/* Editor Container */}
            <div className="glass-card-deep rounded-2xl overflow-hidden flex flex-col relative z-20">
              <NotionEditor
                value={content}
                onChange={setContent}
                placeholder="开始写一篇文章，系统原生支持 Markdown..."
              />
            </div>

          </Form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

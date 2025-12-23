import { motion } from "framer-motion";
import { Link } from "react-router";
import type { Route } from "./+types/admin.articles";
import { redirect } from "react-router";
import { getSessionId } from "~/utils/auth";

export async function loader({ request, context }: Route.LoaderArgs) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/admin/login");
  }

  const { anime_db } = (context as any).cloudflare.env;

  try {
    const { results } = await anime_db
      .prepare("SELECT id, slug, title, views, status, created_at FROM articles ORDER BY created_at DESC")
      .all();

    const articles = (results || []).map((article: any) => ({
      ...article,
      createdAt: new Date(article.created_at * 1000).toISOString().split('T')[0],
    }));

    return { articles };
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return { articles: [] };
  }
}

export default function ArticlesManager({ loaderData }: Route.ComponentProps) {
  const { articles } = loaderData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Articles</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your blog posts.</p>
        </div>
        <Link to="/admin/article/new">
          <button className="px-4 py-2 rounded-full font-medium transition-all active:scale-95 shadow-sm hover:shadow bg-[#007AFF] text-white hover:bg-[#0071E3] shadow-lg shadow-blue-500/30 text-sm">
            + New Article
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-xl overflow-hidden divide-y divide-gray-100 border border-gray-100 shadow-sm">
        {articles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No articles found. Start writing!
          </div>
        ) : (
          articles.map((article: any, index: number) => (
            <div key={article.id} className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between group">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <Link to={`/articles/${article.slug}`} className="font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
                    {article.title}
                  </Link>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${article.status === "published"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                    }`}>
                    {article.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{article.createdAt}</span>
                  <span>•</span>
                  <span>{article.views} views</span>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                  <span className="sr-only">Edit</span>
                  ✎
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                  <span className="sr-only">Delete</span>
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}


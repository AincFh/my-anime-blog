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
  
  // TODO: 从数据库获取文章列表
  const articles = [
    { id: 1, title: "React教程：从入门到放弃", slug: "react-tutorial", views: 500, status: "published", createdAt: "2024-01-15" },
    { id: 2, title: "芙莉莲剧评：千年之旅", slug: "frieren-review", views: 300, status: "published", createdAt: "2024-01-14" },
    { id: 3, title: "我的追番清单2024", slug: "anime-list-2024", views: 250, status: "draft", createdAt: "2024-01-13" },
  ];
  
  return { articles };
}

export default function ArticlesManager({ loaderData }: Route.ComponentProps) {
  const { articles } = loaderData;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">文章管理</h1>
          <Link to="/admin/article/new">
            <motion.button
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              + 新建文章
            </motion.button>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">浏览量</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {articles.map((article, index) => (
                <motion.tr
                  key={article.id}
                  className="hover:bg-gray-50 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td className="px-6 py-4">
                    <Link to={`/articles/${article.slug}`} className="font-medium text-gray-800 hover:text-pink-600">
                      {article.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      article.status === "published" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {article.status === "published" ? "已发布" : "草稿"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono">{article.views}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-sm">{article.createdAt}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">编辑</button>
                      <button className="text-red-600 hover:text-red-800 text-sm">删除</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}


import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/articles.$slug";

export async function loader({ params }: Route.LoaderArgs) {
  const { slug } = params;

  // 模拟文章数据
  const article = {
    id: 1,
    title: "示例文章标题",
    slug: slug,
    content: "这是文章内容...",
    excerpt: "文章摘要...",
    cover: "https://acg.yaohud.cn/api/random",
    tags: ["标签1", "标签2"],
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: {
      name: "作者名称",
      avatar: "https://ui-avatars.com/api/?name=作者&background=random"
    }
  };

  return { article };
}

export default function ArticleDetail({ loaderData }: Route.ComponentProps) {
  const { article } = loaderData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <Link to="/articles" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← 返回文章列表
        </Link>

        <article className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          {article.cover && (
            <img
              src={article.cover}
              alt={article.title}
              className="w-full h-64 object-cover rounded-xl mb-6"
            />
          )}

          <h1 className="text-4xl font-bold text-white mb-4">{article.title}</h1>

          <div className="flex items-center gap-4 mb-6 text-gray-300">
            {article.author.avatar && (
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-10 h-10 rounded-full"
              />
            )}
            <span>{article.author.name}</span>
            <span>•</span>
            <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
          </div>

          <div className="flex gap-2 mb-6">
            {article.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-gray-200 leading-relaxed">{article.content}</p>
          </div>
        </article>
      </div>
    </div>
  );
}
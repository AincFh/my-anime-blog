import { motion } from "framer-motion";
import { Link } from "react-router";

/**
 * 那年今日回顾 (On This Day)
 * 功能：显示1年前、2年前的今天发布的文章
 */
interface OnThisDayProps {
  articles: Array<{
    slug: string;
    title: string;
    publishedAt: string;
    yearsAgo: number;
  }>;
}

export function OnThisDay({ articles }: OnThisDayProps) {
  if (articles.length === 0) return null;

  return (
    <motion.div
      className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
        <span>📜</span>
        <span>来自过去的胶囊</span>
      </h3>

      <div className="space-y-3">
        {articles.map((article) => (
          <motion.div
            key={article.slug}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors"
            whileHover={{ x: 4 }}
          >
            <Link to={`/articles/${article.slug}`}>
              <div className="text-white/60 text-sm mb-1">
                {article.yearsAgo}年前的今天
              </div>
              <div className="text-white font-medium">{article.title}</div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}


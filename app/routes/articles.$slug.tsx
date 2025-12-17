import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/articles.$slug";
import { CommentsSection } from "~/components/ui/interactive/CommentsSection";
import { ResponsiveContainer } from "~/components/ui/ResponsiveComponents";
import { GlassCard } from "~/components/ui/layout/GlassCard";
import { motion } from "framer-motion";
import { renderMarkdown } from "~/utils/markdown";
import { TableOfContents } from "~/components/article/TableOfContents";
import { Share2, Clock, Eye, Calendar } from "lucide-react";

export async function loader({ params, context }: Route.LoaderArgs) {
  const { slug } = params;
  const { anime_db } = context.cloudflare?.env || {};

  // 默认模拟数据
  let article = {
    id: 1,
    title: "《葬送的芙莉莲》：时间与记忆的温柔史诗",
    slug: slug,
    content: `
# 时间的魔法

在快节奏的现代动画市场中，《葬送的芙莉莲》像一首悠长而温柔的诗。它不急于讲述勇者如何战胜魔王，而是从"结束"开始，讲述一段关于"逝去"与"传承"的漫长旅程。

![芙莉莲](https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop)

## 故事背景

故事开始于勇者辛美尔一行人打倒魔王凯旋归来。对于拥有近乎无限寿命的精灵魔法使芙莉莲来说，这十年的冒险不过是眨眼一瞬。然而，当五十年后她再次见到苍老的辛美尔，并目送他离世时，她才终于意识到，自己从未真正了解过人类的"短暂"。

> "明明知道人类的寿命很短，为什么我没有试着去了解他呢？"

这句迟来的悔恨，成为了芙莉莲踏上新旅途的契机。

## 角色深度解析

### 芙莉莲 (Frieren)

作为活了上千年的精灵，芙莉莲最初给人的印象是淡漠、慵懒，甚至有些不通人情。

- **魔法观**：她收集魔法仅仅是因为"喜欢"，无论是"变出花田的魔法"还是"清洁铜像的魔法"，在她眼中都与毁灭性的攻击魔法同等重要。
- **成长**：旅途中，她逐渐学会了用辛美尔的视角看世界，开始理解"无聊小事"背后的情感价值。

### 费伦 (Fern)

被海塔托付给芙莉莲的人类魔法使。

*   **性格**：早熟、稳重，像个老妈子一样照顾着生活不能自理的芙莉莲。
*   **战斗风格**：以极快的施法速度和精准的魔力控制著称，被魔族称为"普通攻击魔法大师"。

\`\`\`javascript
// 费伦的战斗逻辑
const fernAttack = (target) => {
  while (target.isAlive()) {
    cast("Zoltraak"); // 普通攻击魔法
    if (target.defense < 10) {
      console.log("Too slow.");
    }
  }
}
\`\`\`

## 核心主题：寿命论与传承

作品不断通过**对比**来展现时间的残酷与温柔。

1.  **辛美尔的铜像**：遍布各地的铜像并非为了炫耀功绩，而是为了让芙莉莲在未来的漫长岁月中不至于孤单。
2.  **魔法的传承**：人类魔法虽然寿命短暂，但通过一代代的解析与改良，最终超越了长寿种族的认知。

:::spoiler[剧透警告：关于黄金乡篇]
在黄金乡篇中，马哈特与格鲁克的友情展示了魔族理解人类情感的另一种（失败的）可能性。这与芙莉莲的理解形成了鲜明对比。
:::

## 总结

《葬送的芙莉莲》是一部需要静下心来细细品味的作品。它没有毁天灭地的战斗特效（虽然疯房子做得很好），却能用平淡的对话击中你内心最柔软的地方。

它告诉我们，**重要的不是旅途的终点，而是沿途的风景，以及与谁同行。**
    `,
    excerpt: "它不急于讲述勇者如何战胜魔王，而是从“结束”开始，讲述一段关于“逝去”与“传承”的漫长旅程。",
    cover: "https://images.unsplash.com/photo-1620559612265-d84c8a2745f6?q=80&w=1200&auto=format&fit=crop",
    tags: ["动画", "漫评", "治愈", "奇幻"],
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 12450,
    author: {
      name: "AnimeLover",
      bio: "资深二次元观察家 / 追番狂魔",
      avatar: "https://ui-avatars.com/api/?name=AL&background=random&color=fff&bold=true"
    }
  };

  let comments: any[] = [];

  // 如果有数据库连接，尝试获取真实数据
  if (anime_db) {
    try {
      // 1. 获取文章
      const dbArticle = await anime_db
        .prepare("SELECT * FROM articles WHERE slug = ?")
        .bind(slug)
        .first();

      if (dbArticle) {
        article = {
          id: dbArticle.id,
          title: dbArticle.title,
          slug: dbArticle.slug,
          content: dbArticle.content,
          excerpt: dbArticle.summary || "",
          cover: dbArticle.cover_image || "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200",
          tags: dbArticle.tags ? JSON.parse(dbArticle.tags) : [],
          publishedAt: new Date(dbArticle.created_at * 1000).toISOString(),
          updatedAt: new Date(dbArticle.updated_at * 1000).toISOString(),
          views: dbArticle.views || 0,
          author: {
            name: "Admin", // 暂时硬编码，后续关联用户表
            bio: "System Administrator",
            avatar: "https://ui-avatars.com/api/?name=Admin&background=random"
          }
        };

        // 2. 获取评论 (仅获取已审核的)
        const dbComments = await anime_db
          .prepare(
            `SELECT * FROM comments 
             WHERE article_id = ? AND status = 'approved' 
             ORDER BY created_at DESC`
          )
          .bind(dbArticle.id)
          .all();

        if (dbComments.results) {
          comments = dbComments.results;
        }
      }
    } catch (error) {
      console.error("Failed to fetch article data:", error);
    }
  }

  return { article, comments };
}

export default function ArticleDetail({ loaderData }: Route.ComponentProps) {
  const { article, comments } = loaderData;
  const htmlContent = renderMarkdown(article.content);

  return (
    <ResponsiveContainer maxWidth="xl" className="py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* 顶部导航 */}
        <Link to="/articles" className="text-slate-500 hover:text-primary-start mb-6 inline-flex items-center gap-2 transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> 返回文章列表
        </Link>

        {/* 封面图区域 */}
        <GlassCard className="overflow-hidden mb-8 relative group">
          {article.cover && (
            <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
              <img
                src={article.cover}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

              <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full max-w-4xl">
                <div className="flex gap-2 mb-4">
                  {article.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-white/10 backdrop-blur-md text-white rounded-full text-xs font-bold border border-white/20 hover:bg-white/20 transition-colors cursor-default"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white font-display leading-tight shadow-black drop-shadow-lg mb-6">
                  {article.title}
                </h1>

                <div className="flex flex-wrap items-center gap-6 text-slate-300 text-sm">
                  <div className="flex items-center gap-2">
                    <img
                      src={article.author.avatar}
                      alt={article.author.name}
                      className="w-8 h-8 rounded-full border border-white/30"
                    />
                    <span className="text-white font-medium">{article.author.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye size={16} />
                    <span>{article.views} 阅读</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{Math.ceil(article.content.length / 300)} 分钟阅读</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 左侧：文章内容 (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <GlassCard className="p-8 md:p-12">
              <div
                className="prose prose-lg dark:prose-invert max-w-none 
                  prose-headings:font-display prose-headings:scroll-mt-24 
                  prose-a:text-primary-start hover:prose-a:text-primary-end 
                  prose-img:rounded-xl prose-img:shadow-lg prose-img:max-h-[600px] prose-img:w-auto prose-img:mx-auto
                  prose-pre:bg-[#1e1e1e] prose-pre:border prose-pre:border-white/10
                  leading-loose tracking-wide prose-p:my-6 prose-p:text-slate-300"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </GlassCard>

            {/* 评论区 (移动到左侧底部) */}
            <CommentsSection articleId={article.id} comments={comments} />
          </div>

          {/* 右侧：侧边栏 (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* 作者卡片 */}
            <GlassCard className="p-6 sticky top-24">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-16 h-16 rounded-full border-2 border-primary-start p-0.5"
                />
                <div>
                  <h3 className="font-bold text-lg text-white">{article.author.name}</h3>
                  <p className="text-sm text-slate-400">{article.author.bio}</p>
                </div>
              </div>
              <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors mb-6">
                关注作者
              </button>

              <hr className="border-white/10 mb-6" />

              {/* 目录 */}
              <TableOfContents content={article.content} />

              <hr className="border-white/10 my-6" />

              {/* 分享 */}
              <div className="flex items-center justify-between text-slate-400 text-sm">
                <span>分享文章</span>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </motion.div>
    </ResponsiveContainer>
  );
}
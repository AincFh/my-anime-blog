import { GlassCard } from "~/components/ui/GlassCard";
import { ReadingProgress } from "~/components/ui/ReadingProgress";
import { Link } from "react-router";
import { useEffect } from "react";
import type { Route } from "./+types/articles.$slug";
import { renderMarkdown } from "~/utils/markdown";
import { LazyImage } from "~/components/ui/LazyImage";
import { Spoiler } from "~/components/ui/Spoiler";
import { HeadpatButton } from "~/components/ui/HeadpatButton";
import { ImageLightbox } from "~/components/ui/ImageLightbox";

export async function loader({ params, context }: Route.LoaderArgs) {
  const { anime_db } = context.cloudflare.env;

  try {
    const article = await anime_db
      .prepare("SELECT * FROM articles WHERE slug = ?")
      .bind(params.slug)
      .first();

    if (!article) {
      throw new Response("Article not found", { status: 404 });
    }

    return { article };
  } catch (error) {
    console.error("Failed to fetch article:", error);
    throw new Response("Article not found", { status: 404 });
  }
}

export function meta({ data }: Route.MetaArgs) {
  if (!data?.article) {
    return [{ title: "文章未找到 | A.T. Field" }];
  }

  const { article } = data;
  
  // 基础 URL（使用默认域名）
  const baseUrl = "https://aincfh.dpdns.org";
  
  // 处理图片 URL（如果是相对路径，转换为绝对路径）
  const getImageUrl = (imagePath: unknown) => {
    const path = imagePath as string | null | undefined;
    if (!path) return `${baseUrl}/og-default.jpg`;
    if (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://'))) {
      return path;
    }
    return `${baseUrl}${typeof path === 'string' && path.startsWith('/') ? '' : '/'}${path || ''}`;
  };
  
  const ogImage = getImageUrl(article.cover_image);
  const articleUrl = `${baseUrl}/articles/${article.slug || ''}`;
  const title = String(article.title || '');
  const description = String(article.description || article.title || '');
  
  return [
    { title: `${title} | A.T. Field` },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: ogImage },
    { property: "og:url", content: articleUrl },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
  ];
}

export default function ArticleSlug({ loaderData }: Route.ComponentProps) {
  const { article } = loaderData;

  // 沉浸式阅读：进入文章后背景变暗
  useEffect(() => {
    const backgroundLayer = document.querySelector('[data-background-layer]') as HTMLElement;
    if (backgroundLayer) {
      backgroundLayer.style.filter = 'brightness(0.75) blur(8px)';
      backgroundLayer.style.transition = 'filter 0.5s ease-in-out';
    }

    return () => {
      if (backgroundLayer) {
        backgroundLayer.style.filter = '';
        backgroundLayer.style.transition = '';
      }
    };
  }, []);

  // 处理spoiler标记
  useEffect(() => {
    const spoilers = document.querySelectorAll('[data-spoiler]');
    spoilers.forEach((spoiler) => {
      const warning = spoiler.getAttribute('data-warning') || '剧透警告';
      const content = spoiler.innerHTML;
      // 这里可以用React组件替换，暂时保持HTML结构
    });
  }, [article.content]);

  const htmlContent = renderMarkdown(article.content || "");

  return (
    <>
      {/* 阅读进度条 */}
      <ReadingProgress />
      
      {/* 图片灯箱 */}
      <ImageLightbox />
      
      <div className="max-w-4xl mx-auto px-4 py-20">
        <Link 
          to="/articles" 
          className="text-primary-start hover:text-primary-end transition-colors mb-8 inline-block flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>返回文章列表</span>
        </Link>

        {/* 文章容器 */}
        <GlassCard className="min-h-[60vh] bg-white/90 backdrop-blur-xl">
          <div className="mb-8 border-b border-slate-200/50 pb-8">
            <span className="text-primary-start font-bold uppercase tracking-widest text-sm">
              {article.category || "文章"}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mt-4 mb-6 leading-tight text-slate-800">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-slate-600 text-sm">
              <span className="font-mono">
                {article.created_at ? new Date(article.created_at * 1000).toLocaleDateString('zh-CN') : ''}
              </span>
              <span>•</span>
              <span>约 {Math.ceil((String(article.content || '').length) / 500)} 分钟阅读</span>
            </div>
          </div>

          {/* 封面图 */}
          {article.cover_image && (
            <div className="mb-8 -mx-6">
              <LazyImage
                src={article.cover_image ? String(article.cover_image) : ''}
                alt={article.title || ''}
                className="w-full h-64 md:h-96 object-cover"
                blur={true}
              />
            </div>
          )}

          {/* 文章内容 - 支持Markdown和Spoiler */}
          <div 
            className="prose prose-lg max-w-none prose-slate markdown-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* 摸头杀点赞系统 */}
          <div className="mt-12 pt-8 border-t border-slate-200/50">
            <div className="flex items-center justify-center">
              <HeadpatButton
                count={article.likes || 0}
                onPat={async () => {
                  // TODO: 调用API更新点赞数
                  console.log("被摸头了！");
                }}
              />
            </div>
          </div>
        </GlassCard>
      </div>
    </>
  );
}

import type { LoaderFunctionArgs } from "react-router";

/**
 * 动态OG Image生成
 * 功能：当爬虫访问文章链接时，自动生成社交卡片图片
 */
export async function loader({ params, context, request }: LoaderFunctionArgs) {
  const { slug } = params;
  const { anime_db } = (context as any).cloudflare.env;

  // 检查User-Agent，判断是否为爬虫
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /bot|crawler|spider|crawling/i.test(userAgent);

  if (!isBot) {
    // 非爬虫直接返回404或重定向
    return new Response("Not Found", { status: 404 });
  }

  try {
    // 获取文章数据
    const article = await anime_db
      .prepare("SELECT * FROM articles WHERE slug = ?")
      .bind(slug)
      .first();

    if (!article) {
      return new Response("Article not found", { status: 404 });
    }

    // TODO: 使用 @vercel/og 或 Canvas API 生成图片
    // 这里返回一个占位响应，实际应该生成包含以下内容的图片：
    // - 文章封面
    // - 文章标题（大字体）
    // - 作者头像
    // - 评分雷达图（如果有）

    // 临时方案：返回重定向到封面图
    if (article.cover_image) {
      return Response.redirect(article.cover_image, 302);
    }

    // 如果没有封面，返回默认OG图片
    return Response.redirect("/og-default.jpg", 302);
  } catch (error) {
    console.error("OG Image generation error:", error);
    return new Response("Error", { status: 500 });
  }
}


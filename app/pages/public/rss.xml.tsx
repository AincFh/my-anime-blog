/**
 * RSS Feed生成
 * 功能：自动生成RSS 2.0格式的订阅源
 */

interface Article {
  slug: string;
  title: string;
  description: string | null;
  content: string;
  created_at: number;
  updated_at: number;
}

export async function loader({ context, request }: { context: any, request: Request }) {
  const { anime_db } = context.cloudflare.env;
  const url = new URL(request.url);

  try {
    // 获取最新文章
    const articlesResult = await anime_db
      .prepare(
        `SELECT slug, title, content, created_at, updated_at
         FROM articles
         ORDER BY created_at DESC
         LIMIT 20`
      )
      .all();

    const articles = (articlesResult.results || []) as Article[];
    const siteUrl = `${url.protocol}//${url.host}`;
    const feedUrl = `${siteUrl}/rss.xml`;

    // 生成RSS XML
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Project Blue Sky</title>
    <link>${siteUrl}</link>
    <description>沉浸式二次元个人终端</description>
    <language>zh-CN</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${articles
        .map((article: Article) => {
          const pubDate = new Date(article.created_at * 1000).toUTCString();
          const articleUrl = `${siteUrl}/articles/${article.slug}`;
          const description = article.content ? article.content.substring(0, 200) + "..." : "";

          return `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
        })
        .join("")}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("RSS generation error:", error);
    return new Response("RSS generation failed", { status: 500 });
  }
}

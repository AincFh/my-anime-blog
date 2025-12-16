import type { Route } from "./+types/atom.xml";

/**
 * Atom Feed生成
 * 功能：自动生成Atom 1.0格式的订阅源
 */
export async function loader({ context, request }: Route.LoaderArgs) {
  const { anime_db } = context.cloudflare.env;
  const url = new URL(request.url);

  try {
    // 获取最新文章
    const articlesResult = await anime_db
      .prepare(
        `SELECT slug, title, description, content, created_at, updated_at
         FROM articles
         ORDER BY created_at DESC
         LIMIT 20`
      )
      .all<{
        slug: string;
        title: string;
        description: string | null;
        content: string;
        created_at: number;
        updated_at: number;
      }>();

    const articles = articlesResult.results || [];
    const siteUrl = `${url.protocol}//${url.host}`;
    const feedUrl = `${siteUrl}/atom.xml`;

    // 生成Atom XML
    const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Project Blue Sky</title>
  <link href="${siteUrl}" rel="alternate" />
  <link href="${feedUrl}" rel="self" />
  <subtitle>沉浸式二次元个人终端</subtitle>
  <updated>${new Date().toISOString()}</updated>
  <id>${siteUrl}/</id>
  ${articles
    .map((article) => {
      const published = new Date(article.created_at * 1000).toISOString();
      const updated = new Date(article.updated_at * 1000).toISOString();
      const articleUrl = `${siteUrl}/articles/${article.slug}`;
      const content = article.content || article.description || "";

      return `
  <entry>
    <title type="html"><![CDATA[${article.title}]]></title>
    <link href="${articleUrl}" rel="alternate" />
    <id>${articleUrl}</id>
    <published>${published}</published>
    <updated>${updated}</updated>
    <content type="html"><![CDATA[${content}]]></content>
  </entry>`;
    })
    .join("")}
</feed>`;

    return new Response(atom, {
      headers: {
        "Content-Type": "application/atom+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Atom generation error:", error);
    return new Response("Atom generation failed", { status: 500 });
  }
}


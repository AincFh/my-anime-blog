import type { LoaderFunctionArgs } from "react-router";
import { json } from "react-router";

/**
 * 动态 OG Image 生成
 * 功能：当爬虫访问文章链接时，返回动态生成的社交分享图片
 * 
 * 使用 Canvas API 在 Edge Runtime 生成图片
 * 图片包含：文章标题、封面图、作者信息
 */
export async function loader({ params, context, request }: LoaderFunctionArgs) {
  const { slug } = params;
  const env = (context as any).cloudflare.env;
  const { anime_db } = env;

  // 检查 User-Agent，判断是否为爬虫
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot/i.test(userAgent);

  if (!isBot) {
    // 非爬虫直接返回 404，避免被直接访问
    return new Response("Not Found", { status: 404 });
  }

  try {
    // 获取文章数据
    const article = anime_db
      ? await anime_db
      .prepare("SELECT * FROM articles WHERE slug = ?")
      .bind(slug)
          .first()
      : null;

    if (!article) {
      // 返回默认 OG 图片（如果有的话）
      return Response.redirect("/og-default.jpg", 302);
    }

    const a = article as any;

    // 生成 SVG 格式的 OG 图片（更兼容且无需依赖）
    const svgContent = generateOGSVG({
      title: a.title || "星影小站",
      description: a.summary || a.content?.substring(0, 200) || "探索无尽的二次元世界",
      coverImage: a.cover_image,
      siteName: "A.T. Field 星影小站",
    });

    // 返回 SVG 响应，设置正确的 Content-Type
    return new Response(svgContent, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400, s-maxage=604800", // 1天本地缓存，7天 CDN
        "X-Robots-Tag": "noindex",
      },
    });

  } catch (error) {
    console.error("OG Image generation error:", error);
    // 出错时返回默认图片
    return Response.redirect("/og-default.jpg", 302);
  }
}

interface OGSVGOptions {
  title: string;
  description: string;
  coverImage?: string | null;
  siteName: string;
}

/**
 * 生成 OG 图片 SVG
 * 使用 SVG 而不是 Canvas，因为 SVG 可以在 Edge Runtime 中直接生成
 */
function generateOGSVG(options: OGSVGOptions): string {
  const { title, description, coverImage, siteName } = options;
  
  // 清理文本，防止 XSS
  const safeTitle = escapeXml(title).substring(0, 100);
  const safeDescription = escapeXml(description).substring(0, 200);
  const safeSiteName = escapeXml(siteName);
  
  // 背景渐变色
  const bgGradient = `
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#16213e;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#0f3460;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#FF9F43;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#FF6B6B;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#000000;stop-opacity:0" />
        <stop offset="100%" style="stop-color:#000000;stop-opacity:0.7" />
      </linearGradient>
    </defs>
  `;
  
  // 装饰元素
  const decorations = `
    <!-- 装饰圆环 -->
    <circle cx="850" cy="150" r="100" fill="none" stroke="url(#accent)" stroke-width="2" opacity="0.3" />
    <circle cx="850" cy="150" r="120" fill="none" stroke="url(#accent)" stroke-width="1" opacity="0.2" />
    <circle cx="150" cy="450" r="80" fill="none" stroke="url(#accent)" stroke-width="2" opacity="0.3" />
    <circle cx="150" cy="450" r="100" fill="none" stroke="url(#accent)" stroke-width="1" opacity="0.2" />
    
    <!-- 星星装饰 -->
    <polygon points="100,100 105,115 120,115 108,125 113,140 100,130 87,140 92,125 80,115 95,115" fill="url(#accent)" opacity="0.6" />
    <polygon points="900,400 905,410 915,410 907,417 910,427 900,420 890,427 893,417 885,410 895,410" fill="url(#accent)" opacity="0.4" />
    <polygon points="200,200 203,208 211,208 205,213 207,221 200,216 193,221 195,213 189,208 197,208" fill="url(#accent)" opacity="0.3" />
  `;
  
  // 如果有封面图，添加为背景
  const coverBackground = coverImage 
    ? `<image href="${escapeXml(coverImage)}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice" opacity="0.4"/>
       <rect x="0" y="0" width="1200" height="630" fill="url(#overlay)" />`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  ${bgGradient}
  
  <!-- 背景 -->
  <rect width="1200" height="630" fill="url(#bg)" />
  
  ${coverBackground}
  ${decorations}
  
  <!-- 顶部装饰线 -->
  <rect x="60" y="60" width="80" height="4" fill="url(#accent)" rx="2" />
  
  <!-- 站点名称 -->
  <text x="60" y="95" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#FF9F43" font-weight="600">
    ${safeSiteName}
  </text>
  
  <!-- 主标题 -->
  <text x="60" y="200" font-family="system-ui, -apple-system, sans-serif" font-size="56" fill="#ffffff" font-weight="800" letter-spacing="-1">
    ${safeTitle}
  </text>
  
  <!-- 分割线 -->
  <rect x="60" y="240" width="60" height="3" fill="url(#accent)" rx="1.5" />
  
  <!-- 描述 -->
  <text x="60" y="300" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#94a3b8" font-weight="400">
    ${safeDescription.substring(0, 80)}${safeDescription.length > 80 ? '...' : ''}
  </text>
  
  <!-- 底部装饰 -->
  <rect x="0" y="580" width="1200" height="50" fill="url(#accent)" opacity="0.1" />
  
  <!-- 阅读更多提示 -->
  <text x="60" y="530" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#64748b" font-weight="500">
    阅读更多 →
  </text>
  
  <!-- 右下角标记 -->
  <text x="1140" y="580" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#475569" text-anchor="end">
    ${new Date().getFullYear()}
  </text>
</svg>`;
}

/**
 * XML 实体转义
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

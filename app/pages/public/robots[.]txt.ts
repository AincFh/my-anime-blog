/**
 * robots.txt 动态生成
 */

export function loader({ request }: { request: Request }) {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /user/

Sitemap: ${baseUrl}/sitemap.xml
`;

    return new Response(robotsTxt, {
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, max-age=86400', // 24 小时缓存
        },
    });
}

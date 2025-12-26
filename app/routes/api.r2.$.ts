import type { Route } from "./+types/api.r2.$";

/**
 * R2 图片代理 API
 * 通过 Workers 访问 R2 存储桶中的图片
 * 路由: /api/r2/* -> R2 bucket
 */
export async function loader({ params, context }: Route.LoaderArgs) {
    const { IMAGES_BUCKET } = context.cloudflare.env;

    if (!IMAGES_BUCKET) {
        return new Response("R2 bucket not configured", { status: 503 });
    }

    // 获取请求的文件路径
    const key = params["*"] || "";

    if (!key) {
        return new Response("File path required", { status: 400 });
    }

    try {
        // 从 R2 获取对象
        const object = await IMAGES_BUCKET.get(key);

        if (!object) {
            return new Response("File not found", { status: 404 });
        }

        // 返回图片数据
        const headers = new Headers();
        headers.set("Content-Type", object.httpMetadata?.contentType || "image/jpeg");
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        headers.set("ETag", object.etag);

        return new Response(object.body, { headers });
    } catch (error) {
        console.error("R2 fetch error:", error);
        return new Response("Failed to fetch file", { status: 500 });
    }
}

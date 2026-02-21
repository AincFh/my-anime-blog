import type { Route } from "./+types/api.r2.$";
import type { Env } from "~/types/env";
import type { Headers as CloudflareHeaders } from "@cloudflare/workers-types";

/**
 * R2 图片代理 API
 * 通过 Workers 访问 R2 存储桶中的图片
 * 路由: /api/r2/* -> R2 bucket
 */
export async function loader({ params, context }: Route.LoaderArgs) {
    // 显式类型断言，确保 Env 类型正确
    // context.cloudflare 是 unknown，需要先断言
    const env = (context as any).cloudflare.env as Env;
    const { IMAGES_BUCKET } = env;

    if (!IMAGES_BUCKET) {
        console.error("CRITICAL: R2 Bucket 'IMAGES_BUCKET' is not bound or configured.");
        return new Response("Service Unavailable: R2 bucket not configured", { status: 503 });
    }

    // 获取请求的文件路径
    const key = params["*"] || "";

    if (!key) {
        return new Response("Bad Request: File path required", { status: 400 });
    }

    try {
        // 从 R2 获取对象
        const object = await IMAGES_BUCKET.get(key);

        if (!object) {
            console.warn(`Image not found in R2: ${key}`);
            return new Response("File not found", { status: 404 });
        }

        // 返回图片数据
        // 使用 Cloudflare Headers 类型以匹配 writeHttpMetadata
        const headers = new Headers() as unknown as CloudflareHeaders;
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);

        // 强制缓存策略
        headers.set("Cache-Control", "public, max-age=31536000, immutable");

        // 显式断言 body 类型，解决 Cloudflare ReadableStream 与 Web Standard ReadableStream 的类型不兼容
        return new Response(object.body as unknown as BodyInit, { headers: headers as unknown as Headers });
    } catch (error: any) {
        console.error(`R2 fetch error for key '${key}':`, error);
        return new Response("Internal Server Error: Failed to fetch file", { status: 500 });
    }
}

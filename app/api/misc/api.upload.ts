import type { Route } from "./+types/api.upload";
import { jsonWithSecurity } from "~/utils/security";
import { getSessionId } from "~/utils/auth";

/**
 * R2 文件上传 API
 * 功能：接收文件并上传到 Cloudflare R2 存储桶
 */
export async function action({ request, context }: Route.ActionArgs) {
    // 1. 权限验证
    const sessionId = getSessionId(request);
    if (!sessionId) {
        return jsonWithSecurity({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 检查 R2 绑定
    const env = (context as any).cloudflare.env;
    const r2_bucket = env.IMAGES_BUCKET;
    if (!r2_bucket) {
        console.error("R2 bucket not bound");
        return jsonWithSecurity({ error: "Storage service unavailable" }, { status: 503 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return jsonWithSecurity({ error: "No file provided" }, { status: 400 });
        }

        // 3. 验证文件类型（增加文件头魔数检查）
        if (!file.type.startsWith("image/")) {
            return jsonWithSecurity({ error: "Only images are allowed" }, { status: 400 });
        }

        // 文件大小限制 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return jsonWithSecurity({ error: "Image size too large (max 5MB)" }, { status: 400 });
        }

        // 读取文件头魔数
        const arrayBuffer = await file.arrayBuffer();
        const header = new Uint8Array(arrayBuffer.slice(0, 4));
        const hex = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join('');

        // 常见图片魔数
        // JPEG: FFD8FF
        // PNG: 89504E47
        // GIF: 47494638
        // WEBP: 52494646 (RIFF) ... 57454250 (WEBP)
        const isImage =
            hex.startsWith('ffd8ff') ||
            hex.startsWith('89504e47') ||
            hex.startsWith('47494638') ||
            hex.startsWith('52494646'); // RIFF

        if (!isImage) {
            return jsonWithSecurity({ error: "Invalid image format" }, { status: 400 });
        }

        // 4. 生成唯一文件名
        // 格式: uploads/YYYY/MM/timestamp-random.ext
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split(".").pop() || "jpg";
        const key = `uploads/${year}/${month}/${timestamp}-${random}.${ext}`;

        // 5. 上传到 R2
        await r2_bucket.put(key, file.stream(), {
            httpMetadata: {
                contentType: file.type,
            },
        });

        // 6. 返回公开访问 URL
        // 假设 R2 绑定了自定义域名，或者使用 Workers 代理访问
        const publicDomain = env.PUBLIC_R2_DOMAIN || "";
        const url = publicDomain
            ? `https://${publicDomain}/${key}`
            : `/api/r2/${key}`;

        return jsonWithSecurity({
            success: true,
            url: url,
            key: key
        });

    } catch (error) {
        console.error("Upload failed:", error);
        return jsonWithSecurity({ error: "Upload failed" }, { status: 500 });
    }
}

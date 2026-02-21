import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import type { EntryContext } from "react-router";
import type { AppLoadContext } from "~/types/context";

export default async function handleRequest(
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    routerContext: EntryContext,
    loadContext: AppLoadContext
) {
    let body = await renderToReadableStream(
        <ServerRouter context={routerContext} url={request.url} />,
        {
            signal: request.signal,
            onError(error: unknown) {
                // Log streaming rendering errors from inside the shell
                console.error(error);
                responseStatusCode = 500;
            },
        }
    );

    if (isbot(request.headers.get("user-agent") || "")) {
        await body.allReady;
    }

    responseHeaders.set("Content-Type", "text/html");

    // Security Headers
    responseHeaders.set("X-Content-Type-Options", "nosniff");
    responseHeaders.set("X-Frame-Options", "DENY");
    responseHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
    responseHeaders.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

    // HSTS (Enable in production)
    const isProd = loadContext.cloudflare.env.ENVIRONMENT === "production";
    if (isProd) {
        responseHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }

    // Content Security Policy
    // Note: 'unsafe-inline' is used for styles/scripts due to hydration/tailwind requirements. 
    // Ideally, we should implement Nonce-based CSP in the future.
    responseHeaders.set("Content-Security-Policy", [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
        "img-src 'self' data: blob: https:",
        "media-src 'self' https: data: blob:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' https://cloudflareinsights.com https://api.i-meto.com https://cdn.jsdelivr.net",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ].join("; "));
    return new Response(body, {
        headers: responseHeaders,
        status: responseStatusCode,
    });
}

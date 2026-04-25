import type { ActionFunctionArgs } from "react-router";
import { createThemeAction } from "remix-themes";
import { createDynamicThemeSessionResolver } from "~/sessions.theme.server";

export async function action({ request, context }: ActionFunctionArgs) {
    const env = context.cloudflare.env as { ENVIRONMENT?: string; SESSION_SECRET?: string };
    const isProd = env.ENVIRONMENT === "production";
    const secret = env.SESSION_SECRET || "default_secret";
    const resolver = createDynamicThemeSessionResolver(secret, isProd);
    return (createThemeAction as Function)(resolver)({ request, context, params: {} } as Record<string, unknown>);
}

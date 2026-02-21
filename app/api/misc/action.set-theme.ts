import type { Route } from "./+types/action.set-theme";
import { createThemeAction } from "remix-themes";
import { createDynamicThemeSessionResolver } from "~/sessions.theme.server";

export async function action({ request, context }: Route.ActionArgs) {
    const env = (context as any).cloudflare.env;
    const isProd = env.ENVIRONMENT === "production";
    const secret = env.SESSION_SECRET || "default_secret";
    const resolver = createDynamicThemeSessionResolver(secret, isProd);
    return (createThemeAction as any)(resolver)({ request, context, params: {} } as any);
}

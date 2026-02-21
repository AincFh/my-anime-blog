import { createThemeAction, createThemeSessionResolver, ThemeProvider } from "remix-themes";
import { createCookieSessionStorage } from "react-router";

// Theme storage needs to be dynamic based on env, but for now we export a factory
export function getThemeSession(secret: string, isProd: boolean) {
    return createCookieSessionStorage({
        cookie: {
            name: "theme",
            secure: isProd,
            secrets: [secret],
            sameSite: "lax",
            path: "/",
            httpOnly: true,
        },
    });
}

// The themeSessionResolver needs to be created with a SessionStorage instance.
// Since the secret is dynamic, consumers will need to call getThemeSession
// and then pass the result to createThemeSessionResolver.
// For now, we export a function that can create the resolver.
export function createDynamicThemeSessionResolver(secret: string, isProd: boolean) {
    return createThemeSessionResolver(getThemeSession(secret, isProd));
}

export { ThemeProvider };

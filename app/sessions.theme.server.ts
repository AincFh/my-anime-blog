import { createThemeSessionResolver, ThemeProvider } from "remix-themes";

const isServer = typeof window === "undefined";

// 1. Create the theme session resolver
// In a real app, you'd use a cookie session storage here.
// For now, we'll use a simple client-side only approach if we don't want to setup full session storage yet,
// BUT remix-themes requires a session resolver.
// Given the user wants performance and no FOUC, we should use a cookie.

// However, setting up the whole session storage might be complex if not already present.
// Let's check if we have a session storage utility.
// If not, I will create a simple one.

// Wait, I should probably check if `app/sessions.ts` exists.
// If not, I'll create a simple cookie session storage.

import { createCookieSessionStorage } from "react-router";

const sessionStorage = createCookieSessionStorage({
    cookie: {
        name: "__theme",
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secrets: ["s3cr3t"], // Replace with env var in production
        // secure: true, // Enable in production
    },
});

export const themeSessionResolver = createThemeSessionResolver(sessionStorage);

export { ThemeProvider };

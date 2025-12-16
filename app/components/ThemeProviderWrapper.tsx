import { useEffect } from "react";
import {
    PreventFlashOnWrongTheme,
    ThemeProvider,
    useTheme,
    Theme,
} from "remix-themes";

export function ThemeProviderWrapper({
    children,
    specifiedTheme,
    themeAction,
}: {
    children: React.ReactNode;
    specifiedTheme: string | null;
    themeAction: string;
}) {
    return (
        <ThemeProvider specifiedTheme={specifiedTheme} themeAction={themeAction}>
            <InnerThemeProviderWrapper>{children}</InnerThemeProviderWrapper>
        </ThemeProvider>
    );
}

function InnerThemeProviderWrapper({ children }: { children: React.ReactNode }) {
    const [theme] = useTheme();

    // 动态更新 html 元素的 class 来应用主题
    useEffect(() => {
        const html = document.documentElement;
        if (theme === Theme.DARK) {
            html.classList.add("dark");
            html.classList.remove("light");
        } else {
            html.classList.add("light");
            html.classList.remove("dark");
        }

        // 同时更新背景色，确保整个页面都有正确的背景
        html.style.backgroundColor = theme === Theme.DARK ? "#1a1f2e" : "#FAFAFA";
    }, [theme]);

    return (
        <>
            <PreventFlashOnWrongTheme ssrTheme={Boolean(theme)} />
            <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
                {children}
            </div>
        </>
    );
}

import {
    PreventFlashOnWrongTheme,
    ThemeProvider,
    useTheme,
    type Theme
} from "remix-themes";
import { useEffect, useState } from "react";
// Note: ThemeProvider from remix-themes handles theme resolver internally

export function ThemeProviderWrapper({
    children,
    specifiedTheme,
    themeAction,
}: {
    children: React.ReactNode;
    specifiedTheme: Theme | null;
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
    const [transitioning, setTransitioning] = useState(false);
    const [prevTheme, setPrevTheme] = useState<Theme | null>(null);

    // P0 核心修复：将 remix-themes 的 React 状态同步到 DOM class
    // remix-themes 的 setTheme() 只更新状态+写 cookie，从不操作 DOM class
    // PreventFlashOnWrongTheme 只在首次加载时执行一次，之后的切换全靠这里
    useEffect(() => {
        if (theme) {
            // 主题切换时播放过渡动画
            if (prevTheme !== null && prevTheme !== theme) {
                setTransitioning(true);
                setTimeout(() => setTransitioning(false), 400);
            }
            setPrevTheme(theme);

            const html = document.documentElement;
            html.classList.remove('light', 'dark');
            html.classList.add(theme);
        }
    }, [theme, prevTheme]);

    return (
        <>
            <PreventFlashOnWrongTheme ssrTheme={Boolean(theme)} />

            {/* 主题切换过渡遮罩 */}
            <div
                aria-hidden="true"
                className={`
                    fixed inset-0 z-[9999] pointer-events-none transition-all duration-300 ease-out
                    ${transitioning ? 'opacity-100' : 'opacity-0'}
                    ${theme === 'dark' ? 'bg-[#1c1f2b]' : 'bg-white'}
                `}
            />

            {children}
        </>
    );
}

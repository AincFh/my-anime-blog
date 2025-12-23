import {
    PreventFlashOnWrongTheme,
    ThemeProvider,
    useTheme,
} from "remix-themes";
// Note: ThemeProvider from remix-themes handles theme resolver internally

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
    return (
        <>
            <PreventFlashOnWrongTheme ssrTheme={Boolean(theme)} />
            {children}
        </>
    );
}

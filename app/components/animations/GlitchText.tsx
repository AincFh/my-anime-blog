import { useEffect, useState } from "react";
import clsx from "clsx";

interface GlitchTextProps {
    text: string;
    className?: string;
}

export function GlitchText({ text, className }: GlitchTextProps) {
    const [isGlitching, setIsGlitching] = useState(false);

    useEffect(() => {
        const triggerGlitch = () => {
            setIsGlitching(true);
            setTimeout(() => setIsGlitching(false), 200);

            // Random interval between 2s and 8s
            const nextInterval = Math.random() * 6000 + 2000;
            setTimeout(triggerGlitch, nextInterval);
        };

        const timer = setTimeout(triggerGlitch, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <h1
            className={clsx(
                "glitch-text font-display font-black uppercase tracking-widest relative inline-block",
                isGlitching && "animate-pulse", // Simple fallback, real glitch needs more complex CSS/keyframes
                className
            )}
            data-text={text}
            style={{
                textShadow: isGlitching ? "2px 0 #ec4899, -2px 0 #8b5cf6" : "none",
            }}
        >
            {text}
        </h1>
    );
}

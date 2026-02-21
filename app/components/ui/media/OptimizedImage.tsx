import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "~/utils/cn"; // assuming utils/cn exists, standard in this project likely

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "onDrag" | "fetchPriority" | "crossOrigin"> {
    src: string;
    alt: string;
    className?: string;
    aspectRatio?: "video" | "square" | "portrait" | "auto";
    fallbackSrc?: string;
}

export function OptimizedImage({
    src,
    alt,
    className,
    aspectRatio = "auto",
    fallbackSrc = "/placeholder.jpg", // Needs a real placeholder path
    ...props
}: OptimizedImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setHasError(true);
    };

    const finalSrc = hasError ? fallbackSrc : src;

    return (
        <div
            className={cn(
                "relative overflow-hidden bg-slate-200/50 dark:bg-slate-800/50",
                className
            )}
            style={{
                aspectRatio: aspectRatio === "auto" ? undefined :
                    aspectRatio === "video" ? "16/9" :
                        aspectRatio === "square" ? "1/1" : "3/4"
            }}
        >
            <AnimatePresence>
                {!isLoaded && !hasError && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800"
                    >
                        <div className="w-8 h-8 rounded-full border-2 border-primary-start/30 border-t-primary-start animate-spin" />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.img
                src={finalSrc}
                alt={alt}
                loading="lazy"
                decoding="async"
                className={cn(
                    "w-full h-full object-cover transition-opacity duration-500",
                    isLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={handleLoad}
                onError={handleError}
                {...(props as any)}
            />
        </div>
    );
}

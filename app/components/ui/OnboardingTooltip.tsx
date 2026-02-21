import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface OnboardingTooltipProps {
    stepKey: string;
    targetId: string;
    content: string;
    onComplete?: () => void;
    position?: "top" | "bottom" | "left" | "right";
}

export function OnboardingTooltip({
    stepKey,
    targetId,
    content,
    onComplete,
    position = "bottom"
}: OnboardingTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        // Check if already completed
        const hasCompleted = localStorage.getItem(`onboarding_${stepKey}`);
        if (hasCompleted) return;

        // Find target element
        const target = document.getElementById(targetId);
        if (target) {
            setTargetRect(target.getBoundingClientRect());
            setIsVisible(true);

            // Handle resize/scroll to update position
            const updateRect = () => {
                if (target) setTargetRect(target.getBoundingClientRect());
            };

            window.addEventListener("resize", updateRect);
            window.addEventListener("scroll", updateRect, true);

            return () => {
                window.removeEventListener("resize", updateRect);
                window.removeEventListener("scroll", updateRect, true);
            };
        }
    }, [stepKey, targetId]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(`onboarding_${stepKey}`, "true");
        onComplete?.();
    };

    if (!isVisible || !targetRect) return null;

    // Calculate position logic (simplified with edge detection)
    const getStyle = () => {
        const gap = 12;
        const tooltipWidth = 256; // max-w-xs (w-64 = 256px)

        // 默认中心点对齐
        let centerLeft = targetRect.left + targetRect.width / 2;
        let leftPos = centerLeft - tooltipWidth / 2;

        // 边缘边界检测
        const maxLeft = window.innerWidth - tooltipWidth - 16; // 16px padding from screen right edge
        const minLeft = 16; // 16px padding from screen left edge

        let adjustedLeft = Math.max(minLeft, Math.min(leftPos, maxLeft));

        // 当发生偏移时，计算箭头需要反向偏移多远才能指回目标中心
        let arrowOffset = centerLeft - adjustedLeft;
        // 防止箭头溢出 Tooltip 自身的范围
        let clampedArrowOffset = Math.max(24, Math.min(arrowOffset, tooltipWidth - 24));


        switch (position) {
            case "bottom":
                return {
                    container: { offset: { top: targetRect.bottom + gap, left: adjustedLeft } },
                    arrow: { left: clampedArrowOffset, top: -6 }
                };
            case "top":
                return {
                    container: { offset: { top: targetRect.top - gap, left: adjustedLeft, transform: "translateY(-100%)" } },
                    arrow: { left: clampedArrowOffset, bottom: -6 }
                };
            default:
                return { container: { offset: {} }, arrow: { left: '50%' } };
        }
    };

    const styleData = getStyle();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                    position: "fixed",
                    zIndex: 60,
                    ...styleData.container.offset
                }}
                className="max-w-xs w-64"
            >
                <div className="bg-primary-500 text-white p-4 rounded-2xl shadow-xl relative">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={14} />
                    </button>

                    <div className="font-bold text-sm mb-1">新功能</div>
                    <p className="text-xs text-white/90 leading-relaxed mb-3">
                        {content}
                    </p>

                    <button
                        onClick={handleDismiss}
                        className="bg-white text-primary-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white/90 transition-colors w-full"
                    >
                        我知道了
                    </button>

                    {/* Arrow */}
                    <div
                        className="absolute w-3 h-3 bg-primary-500 rotate-45 -z-10"
                        style={{
                            ...styleData.arrow,
                            marginLeft: -6
                        }}
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

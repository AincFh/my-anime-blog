import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from "framer-motion";
import { useEffect, useRef } from "react";

export function ParallaxBackground() {
    const ref = useRef<HTMLDivElement>(null);

    // Mouse parallax
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth mouse movement
    const springConfig = { damping: 25, stiffness: 150 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            // Normalize to -1 to 1
            const x = (clientX / innerWidth) - 0.5;
            const y = (clientY / innerHeight) - 0.5;

            mouseX.set(x * 20); // Max movement 20px
            mouseY.set(y * 20);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    // Hexagon component
    const Hexagon = ({ size, x, y, delay, color }: any) => (
        <motion.div
            className="absolute opacity-10"
            style={{
                width: size,
                height: size,
                left: x,
                top: y,
                x: springX,
                y: springY,
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                background: color || "var(--color-at-orange)",
            }}
            animate={{
                y: [0, -20, 0],
                rotate: [0, 10, -10, 0],
                opacity: [0.05, 0.1, 0.05],
            }}
            transition={{
                duration: 8,
                delay: delay,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        />
    );

    return (
        <div ref={ref} className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-primary">
            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            {/* Gradient Orbs */}
            <motion.div
                className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[100px] opacity-20"
                style={{ background: "var(--color-at-purple)", x: springX, y: springY }}
            />
            <motion.div
                className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-15"
                style={{ background: "var(--color-at-orange)", x: useTransform(springX, v => v * -1), y: useTransform(springY, v => v * -1) }}
            />

            {/* Floating Hexagons (EVA Style) */}
            <Hexagon size={120} x="10%" y="20%" delay={0} />
            <Hexagon size={80} x="85%" y="15%" delay={2} color="var(--color-at-purple)" />
            <Hexagon size={150} x="75%" y="60%" delay={1} />
            <Hexagon size={60} x="15%" y="70%" delay={3} color="var(--color-at-red)" />

            {/* Grid Lines */}
            <div className="absolute inset-0"
                style={{
                    backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
                    backgroundSize: "100px 100px"
                }}
            />
        </div>
    );
}

import { motion, AnimatePresence } from "framer-motion";
import { X, Type, Minimize2, Maximize2 } from "lucide-react";
import { useState, useEffect } from "react";

interface TheatricalReaderProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string; // HTML content or Markdown
}

export function TheatricalReader({ isOpen, onClose, title, content }: TheatricalReaderProps) {
    const [fontSize, setFontSize] = useState(18);
    const [isLightsOff, setIsLightsOff] = useState(false);

    // Prevent scrolling on body when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex justify-center overflow-y-auto"
                >
                    {/* Ambient Background */}
                    <div className="fixed inset-0 bg-slate-950">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-slate-900 to-blue-900/20 animate-pulse-slow" />
                        {/* Lights Off Overlay */}
                        <motion.div
                            className="absolute inset-0 bg-black pointer-events-none"
                            animate={{ opacity: isLightsOff ? 0.8 : 0 }}
                        />
                    </div>

                    {/* Content Container */}
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ delay: 0.1, type: "spring", damping: 25 }}
                        className="relative w-full max-w-3xl min-h-screen bg-slate-900/50 backdrop-blur-md shadow-2xl border-x border-white/5"
                    >
                        {/* Toolbar */}
                        <div className="sticky top-0 z-50 flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsLightsOff(!isLightsOff)}
                                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                                    title={isLightsOff ? "Turn Lights On" : "Turn Lights Off"}
                                >
                                    {isLightsOff ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
                                </button>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Type size={16} />
                                    <input
                                        type="range"
                                        min="16"
                                        max="24"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(Number(e.target.value))}
                                        className="w-24 accent-pink-500"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Article Content */}
                        <div className="p-8 md:p-16 pb-32">
                            <motion.h1
                                className="text-3xl md:text-5xl font-bold text-white mb-12 text-center font-serif leading-tight"
                                style={{ textShadow: "0 0 30px rgba(255,255,255,0.1)" }}
                            >
                                {title}
                            </motion.h1>

                            <div
                                className="prose prose-invert prose-lg max-w-none font-serif leading-loose text-gray-300"
                                style={{ fontSize: `${fontSize}px` }}
                                dangerouslySetInnerHTML={{ __html: content }}
                            />

                            <div className="mt-24 pt-12 border-t border-white/10 text-center text-gray-500 text-sm italic">
                                End of Theatrical Mode
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

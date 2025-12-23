import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface ColorPickerProps {
    colors: string[];
    selectedColor: string;
    onChange: (color: string) => void;
}

export function ColorPicker({ colors, selectedColor, onChange }: ColorPickerProps) {
    return (
        <div className="flex flex-wrap gap-3">
            {colors.map((color) => (
                <button
                    key={color}
                    type="button"
                    onClick={() => onChange(color)}
                    className="relative w-10 h-10 rounded-full shadow-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                    style={{ backgroundColor: color }}
                >
                    {selectedColor === color && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center text-white"
                        >
                            <Check size={16} strokeWidth={3} />
                        </motion.div>
                    )}
                </button>
            ))}
        </div>
    );
}

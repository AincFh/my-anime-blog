import { motion } from "framer-motion";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import { 
  Moon, Coffee, Zap, MessageSquare, Eye, Star, Sparkles, 
  Gift, Book, Cat, MousePointer2, Sun, Music, Lock, Key,
  Shield, Heart, Camera, Film, Tv, Play, Settings, Check,
  Clock, Package, Trophy, Crown, Coins, Gem, Palette, Rocket,
  BarChart3, MapPin, ShoppingCart, UtensilsCrossed, Pen, BookOpen,
  Rainbow, Image as ImageIcon, FileText, Wrench, Backpack, Gift as GiftIcon
} from "lucide-react";

// 图标名称到组件的映射
const iconMap: Record<string, LucideIcon> = {
  moon: Moon,
  sun: Sun,
  coffee: Coffee,
  zap: Zap,
  message: MessageSquare,
  eye: Eye,
  star: Star,
  sparkles: Sparkles,
  gift: GiftIcon,
  book: Book,
  cat: Cat,
  mouse: MousePointer2,
  music: Music,
  lock: Lock,
  key: Key,
  shield: Shield,
  heart: Heart,
  camera: Camera,
  film: Film,
  tv: Tv,
  play: Play,
  settings: Settings,
  check: Check,
  clock: Clock,
  package: Package,
  trophy: Trophy,
  crown: Crown,
  coins: Coins,
  gem: Gem,
  palette: Palette,
  rocket: Rocket,
  chart: BarChart3,
  map: MapPin,
  cart: ShoppingCart,
  utensils: UtensilsCrossed,
  pen: Pen,
  bookopen: BookOpen,
  rainbow: Rainbow,
  image: ImageIcon,
  file: FileText,
  wrench: Wrench,
  backpack: Backpack,
};

interface HexagonBadgeProps {
    icon: string;
    name: string;
    description: string;
    isUnlocked: boolean;
    size?: "sm" | "md" | "lg";
    onClick?: () => void;
    iconComponent?: LucideIcon;
}

export function HexagonBadge({
    icon,
    name,
    description,
    isUnlocked,
    size = "md",
    onClick,
    iconComponent
}: HexagonBadgeProps) {

    const sizeClasses = {
        sm: "w-24 h-24",
        md: "w-32 h-32",
        lg: "w-40 h-40",
    };

    const iconSizes = {
        sm: 24,
        md: 36,
        lg: 48,
    };

    // 优先使用传入的 iconComponent，否则根据 icon 名称查找
    const IconComponent = iconComponent || iconMap[icon] || Star;

    return (
        <motion.div
            className={clsx(
                "relative group cursor-pointer",
                sizeClasses[size]
            )}
            onClick={onClick}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Hexagon Shape */}
            <div
                className={clsx(
                    "absolute inset-0 clip-hexagon transition-all duration-500",
                    isUnlocked
                        ? "bg-gradient-to-br from-at-orange/80 to-at-purple/80 backdrop-blur-md shadow-[0_0_30px_rgba(255,159,67,0.4)]"
                        : "bg-slate-800/50 backdrop-blur-sm border border-white/5"
                )}
            >
                {/* Inner Border */}
                <div className={clsx(
                    "absolute inset-[2px] clip-hexagon flex items-center justify-center transition-all duration-500",
                    isUnlocked
                        ? "bg-black/20"
                        : "bg-black/40"
                )}>
                    {/* Icon */}
                    <div className={clsx(
                        "transition-all duration-500",
                        isUnlocked
                            ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            : "text-slate-400 opacity-30"
                    )}>
                        <IconComponent size={iconSizes[size]} />
                    </div>
                </div>
            </div>

            {/* Locked Overlay (Scanlines) */}
            {!isUnlocked && (
                <div className="absolute inset-0 clip-hexagon bg-[url('/patterns/grid.svg')] opacity-20 pointer-events-none" />
            )}

            {/* Hover Info (Holographic Tooltip) */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                <div className="bg-black/80 backdrop-blur-xl border border-at-orange/30 p-3 rounded-lg text-center shadow-2xl relative overflow-hidden">
                    {/* Holographic Glint */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-pulse" />

                    <h4 className={clsx(
                        "font-display font-bold text-sm mb-1",
                        isUnlocked ? "text-at-orange" : "text-slate-500"
                    )}>
                        {isUnlocked ? name : "???"}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        {isUnlocked ? description : "此成就尚未解锁"}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

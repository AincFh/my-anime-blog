/**
 * Emoji 到 SVG 图标的映射组件
 * 用于替代 emoji，提供一致的视觉风格
 */
import { 
  Star, Crown, Sparkles, Gift, Coins, Heart, Sun, Moon, 
  Coffee, Zap, Search, Eye, MousePointer2, Clock, Mail,
  Package, Shield, Flag, Film, Calendar, Tv, Play, Settings,
  Check, X, AlertTriangle, Info, ChevronRight, ChevronUp,
  BookOpen, Book, Archive, Image, Camera, Music, MessageSquare,
  User, Users, Home, ShoppingBag, Lock, Key, Globe, Wifi,
  Activity, Server, Database, ShieldCheck, AlertCircle, Tag,
  Trash2, Edit3, Plus, Save, RefreshCw, Loader2, Send,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Copy, Link as LinkIcon,
  Bold, Italic, Code, Quote, List, Heading1, Heading2, Image as ImageIcon,
  Volume2, VolumeX, Pause, ListMusic, Maximize2, Minimize2,
  Type, Languages, Palette, Bell, Gamepad2, Trophy, Package as Box,
  DollarSign, Infinity, Download, Layers, Tag as TagIcon,
  CloudUpload, RefreshCcw, History, BarChart3, TrendingUp,
  MoreVertical, Reply, PenTool, Wand2, EyeOff, Copy as CopyIcon,
  Building, Lightbulb, Smartphone, Laptop, Monitor, Keyboard, Calculator, Phone,
  UtensilsCrossed, Gem, ShoppingCart, Rocket, MapPin, Rainbow, Wrench, Backpack,
  Film as FilmIcon, Pen, Calendar as CalendarIcon, ShieldAlert, CheckCircle2, FileText,
  ChevronDown, ChevronLeft
} from "lucide-react";

// Emoji 映射表
const emojiToIcon: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  // 星星和评级
  "★": Star,
  "☆": Star,
  
  // 皇冠和等级
  "👑": Crown,
  "🧑‍💼": Crown,
  "🛡️": Shield,
  "🛡": Shield,
  
  // 货币和积分
  "💰": Coins,
  "💎": Coins,
  "✨": Sparkles,
  "⭐": Star,
  
  // 礼物和奖励
  "🎁": Gift,
  "🎀": Gift,
  
  // 时间和日历
  "🕰️": Clock,
  "🕰": Clock,
  "📅": Calendar,
  
  // 媒体
  "📺": Tv,
  "🎬": FilmIcon,
  "🎞️": FilmIcon,
  "🎞": FilmIcon,
  "▶️": Play,
  "▶": Play,
  "🎥": Camera,
  "🎨": Palette,
  "🖼️": Image,
  "🖼": Image,
  "📡": Globe,
  "📰": FileText,
  "📚": BookOpen,
  "📖": BookOpen,
  "📜": FileText,
  "🖊️": PenTool,
  "🖊": PenTool,
  "📝": FileText,
  
  // 音乐
  "🎵": Music,
  "🎶": Music,
  
  // 用户相关
  "👤": User,
  "👥": Users,
  "🏠": Home,
  "🧑‍🤝‍🧑": Users,
  "🐱": User,
  
  // 状态和情绪
  "🎉": Sparkles,
  "❤️": Heart,
  "☕": Coffee,
  "🌙": Moon,
  "🌟": Star,
  "⚡": Zap,
  "🔮": Sparkles,
  "🌀": Zap,
  
  // 物品和容器
  "📦": Box,
  "🎒": Package,
  "🗃️": Archive,
  "🗃": Archive,
  "🗂️": Package,
  
  // 动作
  "🔍": Search,
  "🔎": Search,
  "👁️": Eye,
  "🖱️": MousePointer2,
  "🖱": MousePointer2,
  "✍️": PenTool,
  "✍": PenTool,
  "👆": MousePointer2,
  "👇": MousePointer2,
  "➡️": ArrowRight,
  "⬇️": Download, // 优先使用下载图标
  "🔄": RefreshCw,
  "🔃": RefreshCw,
  "↩️": ArrowLeft,
  
  // 社交
  "💬": MessageSquare,
  "📧": Mail,
  "🗣️": MessageSquare,
  "🗣": MessageSquare,
  "🔔": Bell,
  
  // 状态标识
  "✅": Check,
  "❌": X,
  "⚠️": AlertTriangle,
  "⚠": AlertTriangle,
  "ℹ️": Info,
  "ℹ": Info,
  "✔️": Check,
  "✖️": X,
  "✓": Check,
  "✕": X,
  
  // 安全和设置
  "🔐": Lock,
  "🔑": Key,
  "🔧": Settings,
  "⚙️": Settings,
  "🔩": Settings,
  "🛠️": Settings,
  
  // 导航
  "▼": ChevronDown,
  "▲": ChevronUp,
  "›": ChevronRight,
  "‹": ChevronLeft,
  "→": ArrowRight,
  "←": ArrowLeft,
  
  // 编辑器
  "B": Bold,
  "I": Italic,
  
  // 其他
  "🧧": Gift,
  "⚛️": Globe,
  "🏷️": Tag,
  "🏷": Tag,
  "📁": Archive,
  "🏢": Building,
  "🌈": Rainbow,
  "🆕": Plus,
  "🚀": Rocket,
  "📍": MapPin,
  "📊": BarChart3,
  "🧩": Layers,
  "🎭": Globe,
  "💡": Lightbulb,
  "🔊": Volume2,
  "🔇": VolumeX,
  "🎮": Gamepad2,
  "🏆": Trophy,
  "📋": FileText,
  "💵": DollarSign,
  "∞": Infinity,
  "🔗": LinkIcon,
  "📎": LinkIcon,
  "🖇️": LinkIcon,
  "📌": TagIcon,
  "🔖": TagIcon,
  "🧮": Calculator,
  "💾": Save,
  "📀": FilmIcon,
  "📹": Camera,
  "🎙️": Music,
  "🎚️": Settings,
  "🎛️": Settings,
  "📻": Globe,
  "📠": Phone,
  "☎️": Phone,
  "📱": Smartphone,
  "💻": Laptop,
  "🖥️": Monitor,
  "⌨️": Keyboard,
};

// IconEmoji 组件：用于在 JSX 中替换 emoji
interface IconEmojiProps {
  emoji: string;
  className?: string;
  size?: number;
}

export function IconEmoji({ emoji, className = "", size = 16 }: IconEmojiProps) {
  const IconComponent = emojiToIcon[emoji];
  
  if (IconComponent) {
    return <IconComponent className={className} size={size} />;
  }
  
  // 如果都找不到，返回原文
  return <>{emoji}</>;
}

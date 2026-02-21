export const categoryColors: Record<string, string> = {
    "技术": "from-blue-500 to-cyan-500",
    "动漫": "from-pink-500 to-rose-500",
    "游戏": "from-purple-500 to-indigo-500",
    "随笔": "from-amber-500 to-orange-500",
    "公告": "from-emerald-500 to-teal-500",
};

// 预定义的一组好看的渐变色池
const gradientPool = [
    "from-red-500 to-orange-500",
    "from-orange-500 to-amber-500",
    "from-amber-500 to-yellow-500",
    "from-yellow-500 to-lime-500",
    "from-lime-500 to-green-500",
    "from-green-500 to-emerald-500",
    "from-emerald-500 to-teal-500",
    "from-teal-500 to-cyan-500",
    "from-cyan-500 to-sky-500",
    "from-sky-500 to-blue-500",
    "from-blue-500 to-indigo-500",
    "from-indigo-500 to-violet-500",
    "from-violet-500 to-purple-500",
    "from-purple-500 to-fuchsia-500",
    "from-fuchsia-500 to-pink-500",
    "from-pink-500 to-rose-500",
];

// DJB2 hash algorithm
function djb2(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    }
    return hash;
}

export function getCategoryColor(category: string): string {
    if (!category) return "from-slate-500 to-slate-600";

    // 1. Check predefined colors
    if (categoryColors[category]) {
        return categoryColors[category];
    }

    // 2. Generate consistent color from hash
    const hash = Math.abs(djb2(category));
    const index = hash % gradientPool.length;

    return gradientPool[index];
}

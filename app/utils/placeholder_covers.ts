/**
 * 文章默认封面占位图配置
 */

export const PLACEHOLDER_COVERS: Record<string, string> = {
  tech: "/images/placeholders/tech.png",
  life: "/images/placeholders/life.png",
  anime: "/images/placeholders/anime.png",
  default: "/images/placeholders/anime.png"
};

/**
 * 根据分类获取占位图
 */
export function getPlaceholderCover(category: string = ""): string {
  const cat = category.toLowerCase();
  
  if (cat.includes("tech") || cat.includes("技术") || cat.includes("代码")) return PLACEHOLDER_COVERS.tech;
  if (cat.includes("life") || cat.includes("生活") || cat.includes("感想")) return PLACEHOLDER_COVERS.life;
  if (cat.includes("anime") || cat.includes("漫") || cat.includes("番")) return PLACEHOLDER_COVERS.anime;
  
  return PLACEHOLDER_COVERS.default;
}

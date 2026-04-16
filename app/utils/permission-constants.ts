/**
 * 权限常量定义
 * 定义所有可用的权限键和会员等级常量
 * 兼容 Cloudflare Workers / D1 数据库环境
 */

/**
 * 权限键常量
 */
export const PermissionKeys = {
  // 内容权限
  CONTENT_ARTICLE_READ: 'content.article.read',
  CONTENT_BANGUMI_WATCH: 'content.bangumi.watch',
  CONTENT_MUSIC_PLAY: 'content.music.play',
  CONTENT_PREMIUM_EARLY: 'content.premium.early',
  CONTENT_PREMIUM_FULL: 'content.premium.full',

  // 功能权限
  FEATURE_AD_FREE: 'feature.ad.free',
  FEATURE_COLLECTION_BASIC: 'feature.collection.basic',
  FEATURE_COLLECTION_CLOUD: 'feature.collection.cloud',
  FEATURE_AVATAR_FRAME: 'feature.avatar.frame',
  FEATURE_EMOJI_PACK: 'feature.emoji.pack',
  FEATURE_THEME: 'feature.theme',

  // 游戏权限
  GAME_TASK_REWARD_MULTIPLIER: 'game.task.reward_multiplier',
  GAME_GACHA_PITY: 'game.gacha.pity',
  GAME_DAILY_BONUS: 'game.daily.bonus',

  // 社区权限
  COMMUNITY_EXCLUSIVE: 'community.exclusive',
  COMMUNITY_PRIORITY_SUPPORT: 'community.priority.support',
  COMMUNITY_BADGE: 'community.badge',
} as const;

/**
 * 会员等级常量（用于 sort_order 比较）
 */
export const TierLevels = {
  /** 免费用户 - 旅行者 */
  TRAVELER: 0,
  /** 月之子 - VIP */
  MOONCHILD: 1,
  /** 星之守护者 - SVIP */
  STAR_GUARDIAN: 2,
  /** 银河领主 - GVIP */
  GALAXY_LORD: 3,
} as const;

/**
 * 会员等级名称（数据库 name 字段）
 * 用于数据库查询和比较
 */
export const TierNamesDb = {
  TRAVELER: 'traveler',
  MOONCHILD: 'moonchild',
  STAR_GUARDIAN: 'star-guardian',
  GALAXY_LORD: 'galaxy-lord',
} as const;

/**
 * 等级名称映射（中文）
 */
export const TierNamesZh: Record<number, string> = {
  [TierLevels.TRAVELER]: '旅行者',
  [TierLevels.MOONCHILD]: '月之子',
  [TierLevels.STAR_GUARDIAN]: '星之守护者',
  [TierLevels.GALAXY_LORD]: '银河领主',
};

/**
 * 等级名称映射（英文）
 */
export const TierNamesEn: Record<number, string> = {
  [TierLevels.TRAVELER]: 'Traveler',
  [TierLevels.MOONCHILD]: 'Moonchild',
  [TierLevels.STAR_GUARDIAN]: 'Star Guardian',
  [TierLevels.GALAXY_LORD]: 'Galaxy Lord',
};

/**
 * 等级名称映射（完整）
 */
export const TierNames: Record<number, { name: string; nameEn: string }> = {
  [TierLevels.TRAVELER]: { name: '旅行者', nameEn: 'Traveler' },
  [TierLevels.MOONCHILD]: { name: '月之子', nameEn: 'Moonchild' },
  [TierLevels.STAR_GUARDIAN]: { name: '星之守护者', nameEn: 'Star Guardian' },
  [TierLevels.GALAXY_LORD]: { name: '银河领主', nameEn: 'Galaxy Lord' },
};

/**
 * 根据等级名称获取等级级别
 * 兼容新旧名称
 */
export function getTierLevelByName(name: string): number {
  const nameLower = name.toLowerCase();
  if (nameLower === 'traveler' || nameLower === 'free') return TierLevels.TRAVELER;
  if (nameLower === 'moonchild' || nameLower === 'vip') return TierLevels.MOONCHILD;
  if (nameLower === 'star-guardian' || nameLower === 'svip') return TierLevels.STAR_GUARDIAN;
  if (nameLower === 'galaxy-lord' || nameLower === 'gvip') return TierLevels.GALAXY_LORD;
  return TierLevels.TRAVELER;
}

/**
 * 根据等级级别获取等级名称
 */
export function getTierNameByLevel(level: number): string {
  return TierNamesZh[level] ?? '旅行者';
}

/**
 * 根据等级级别获取徽章颜色
 */
export function getTierColorByLevel(level: number): string {
  const colors: Record<number, string> = {
    [TierLevels.TRAVELER]: '#6B7280', // 灰色
    [TierLevels.MOONCHILD]: '#8B5CF6', // 紫色
    [TierLevels.STAR_GUARDIAN]: '#3B82F6', // 蓝色
    [TierLevels.GALAXY_LORD]: '#F59E0B', // 金色
  };
  return colors[level] ?? '#6B7280';
}

/**
 * 等级徽章颜色（保留用于兼容）
 */
export const TierBadgeColors: Record<number, string> = {
  [TierLevels.TRAVELER]: '#6B7280', // 灰色
  [TierLevels.MOONCHILD]: '#8B5CF6', // 紫色
  [TierLevels.STAR_GUARDIAN]: '#3B82F6', // 蓝色
  [TierLevels.GALAXY_LORD]: '#F59E0B', // 金色
};

/**
 * 权限类别
 */
export const PermissionCategories = {
  CONTENT: 'content',
  FEATURE: 'feature',
  GAME: 'game',
  COMMUNITY: 'community',
} as const;

/**
 * 默认权限值（免费用户）
 */
export const DefaultLimits = {
  maxAnimes: 20,
  maxGalleryPerDay: 50,
  aiChatPerDay: 3,
  coinMultiplier: 1,
  missionBonus: 0,
} as const;

/**
 * 权限描述（用于 UI 显示）
 */
export const PermissionDescriptions: Record<string, string> = {
  adFree: '无广告体验',
  download: '下载功能',
  customTheme: '自定义主题',
  exclusiveEmoji: '专属表情包',
  exclusiveEffect: '专属特效',
  earlyAccess: '抢先体验',
  prioritySupport: '优先客服支持',
  exclusiveBadge: '专属徽章',
  exclusiveBanner: '专属横幅',
  maxAnimes: '可收藏番剧数量',
  maxGalleryPerDay: '每日图库访问次数',
  aiChatPerDay: '每日 AI 对话次数',
  coinMultiplier: '星尘获取倍率',
  missionBonus: '任务奖励加成',
};

/**
 * 价格配置（分）
 */
export const TierPrices = {
  [TierLevels.TRAVELER]: { monthly: 0, quarterly: 0, yearly: 0 },
  [TierLevels.MOONCHILD]: { monthly: 990, quarterly: 2490, yearly: 9900 },
  [TierLevels.STAR_GUARDIAN]: { monthly: 2990, quarterly: 7990, yearly: 29900 },
  [TierLevels.GALAXY_LORD]: { monthly: 4990, quarterly: 12990, yearly: 49900 },
} as const;

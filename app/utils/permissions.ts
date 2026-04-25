/**
 * 权限检查工具
 * 用于在 Loader 和 Action 中验证用户会员权限
 */

import { queryFirst, queryAll, type Database } from '../services/db.server';
import { getUserMembershipTier, parsePrivileges, type TierPrivileges } from '../services/membership/tier.server';
import { AppError } from '~/errors';

/** 权限上下文 */
export interface PermissionContext {
  db: Database;
  userId: number;
}

/** 权限检查选项 */
export interface RequirePermissionOptions {
  /** 权限键 */
  permission: keyof TierPrivileges;
  /** 是否可选（默认为 false） */
  optional?: boolean;
  /** 失败时的错误消息 */
  errorMessage?: string;
  /** 失败时的 HTTP 状态码 */
  statusCode?: number;
}

/** 数据库中的权限记录 */
interface PermissionRecord {
  permission_key: string;
  value: number;
}

/**
 * 权限检查器类
 * 提供用户权限的检查和查询功能
 */
export class PermissionChecker {
  private db: Database;
  private userId: number;
  private cachedPrivileges: TierPrivileges | null = null;
  private cachedTierLevel: number | null = null;

  constructor(context: PermissionContext) {
    this.db = context.db;
    this.userId = context.userId;
  }

  /**
   * 获取用户当前会员等级
   */
  async getTierLevel(): Promise<number> {
    if (this.cachedTierLevel !== null) {
      return this.cachedTierLevel;
    }

    const { tier } = await getUserMembershipTier(this.db, this.userId);
    this.cachedTierLevel = tier?.sort_order ?? 0;
    return this.cachedTierLevel;
  }

  /**
   * 获取用户当前权限配置
   */
  async getPrivileges(): Promise<TierPrivileges> {
    if (this.cachedPrivileges !== null) {
      return this.cachedPrivileges;
    }

    const { tier } = await getUserMembershipTier(this.db, this.userId);
    this.cachedPrivileges = parsePrivileges(tier);
    return this.cachedPrivileges;
  }

  /**
   * 检查用户是否拥有指定权限
   */
  async has(permission: keyof TierPrivileges): Promise<boolean> {
    const privileges = await this.getPrivileges();
    const value = privileges[permission];

    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value > 0;
    }
    return !!value;
  }

  /**
   * 获取权限值（用于数值比较）
   */
  async getValue(permission: keyof TierPrivileges): Promise<number> {
    const privileges = await this.getPrivileges();
    const value = privileges[permission];

    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    return 0;
  }

  /**
   * 检查用户是否为会员（等级 > 0）
   */
  async isPremium(): Promise<boolean> {
    const level = await this.getTierLevel();
    return level > 0;
  }

  /**
   * 检查用户是否为 SVIP
   */
  async isSVIP(): Promise<boolean> {
    const level = await this.getTierLevel();
    return level >= 3;
  }

  /**
   * 检查用户等级是否达到指定等级
   */
  async hasTierLevel(minLevel: number): Promise<boolean> {
    const level = await this.getTierLevel();
    return level >= minLevel;
  }

  /**
   * 获取用户可收藏的最大数量
   */
  async getCollectionLimit(): Promise<number> {
    const limit = await this.getValue('maxAnimes');
    return limit === -1 ? Infinity : limit;
  }

  /**
   * 获取用户每日任务加成百分比
   */
  async getMissionBonus(): Promise<number> {
    const bonus = await this.getValue('missionBonus');
    return bonus / 100; // 转换为百分比
  }

  /**
   * 获取用户代币倍率
   */
  async getCoinMultiplier(): Promise<number> {
    const multiplier = await this.getValue('coinMultiplier');
    return multiplier || 1;
  }
}

/**
 * 创建权限检查器
 */
export function createPermissionChecker(context: PermissionContext): PermissionChecker {
  return new PermissionChecker(context);
}

/**
 * 检查用户是否为会员
 */
export async function isPremiumUser(context: PermissionContext): Promise<boolean> {
  const checker = new PermissionChecker(context);
  return checker.isPremium();
}

/**
 * 获取用户会员等级
 */
export async function getUserTierLevel(context: PermissionContext): Promise<number> {
  const checker = new PermissionChecker(context);
  return checker.getTierLevel();
}

/**
 * 检查用户是否有无广告权限
 */
export async function isAdFree(context: PermissionContext): Promise<boolean> {
  const checker = new PermissionChecker(context);
  return checker.has('adFree');
}

/**
 * 检查用户是否有抢先体验权限
 */
export async function hasEarlyAccess(context: PermissionContext): Promise<boolean> {
  const checker = new PermissionChecker(context);
  return checker.has('earlyAccess');
}

/**
 * 检查用户是否有下载权限
 */
export async function hasDownloadPermission(context: PermissionContext): Promise<boolean> {
  const checker = new PermissionChecker(context);
  return checker.has('download');
}

/**
 * 获取用户可浏览的动画数量上限
 */
export async function getMaxAnimes(context: PermissionContext): Promise<number> {
  const checker = new PermissionChecker(context);
  return checker.getCollectionLimit();
}

/**
 * 获取用户每日任务奖励加成
 */
export async function getMissionBonusPercent(context: PermissionContext): Promise<number> {
  const checker = new PermissionChecker(context);
  return checker.getMissionBonus();
}

/**
 * 获取用户代币倍率
 */
export async function getCoinMultiplierValue(context: PermissionContext): Promise<number> {
  const checker = new PermissionChecker(context);
  return checker.getCoinMultiplier();
}

/**
 * 便捷函数：计算星尘奖励（考虑会员倍率）
 * @param context 权限上下文
 * @param baseAmount 基础奖励数量
 * @returns 最终奖励数量
 */
export async function calculateStarDustReward(
  context: PermissionContext,
  baseAmount: number
): Promise<number> {
  const checker = new PermissionChecker(context);
  const bonus = await checker.getMissionBonus();
  return Math.floor(baseAmount * (1 + bonus));
}

/**
 * 检查收藏夹是否达到上限
 */
export async function checkCollectionLimit(
  context: PermissionContext,
  currentCount: number
): Promise<{
  allowed: boolean;
  limit: number;
  upgradeRequired: boolean;
}> {
  const checker = new PermissionChecker(context);
  const limit = await checker.getCollectionLimit();

  if (currentCount >= limit) {
    const level = await checker.getTierLevel();
    return {
      allowed: false,
      limit,
      upgradeRequired: level < 3, // 需要星之守护者或更高
    };
  }

  return { allowed: true, limit, upgradeRequired: false };
}

/**
 * 权限检查中间件工厂
 * 用于包装 Loader 或 Action 函数
 */
export function requirePermission(options: RequirePermissionOptions) {
  return function <T extends (...args: unknown[]) => unknown>(
    target: T,
    _context: ClassMethodDecoratorContext
  ): T {
    const originalMethod = target;

    return function (this: unknown, ...args: unknown[]) {
      // 实际实现需要在调用处使用
      return originalMethod.apply(this, args);
    } as T;
  };
}

/**
 * 会员等级常量
 */
export const TierLevels = {
  /** 免费用户 */
  FREE: 0,
  /** 月之子（VIP） */
  VIP: 1,
  /** 星之守护者（SVIP） */
  SVIP: 2,
  /** 银河领主（GVIP） */
  GVIP: 3,
} as const;

/**
 * 等级名称映射
 */
export const TierNames: Record<number, { name: string; nameEn: string }> = {
  [TierLevels.FREE]: { name: '旅行者', nameEn: 'Traveler' },
  [TierLevels.VIP]: { name: '月之子', nameEn: 'Moonchild' },
  [TierLevels.SVIP]: { name: '星之守护者', nameEn: 'Star Guardian' },
  [TierLevels.GVIP]: { name: '银河领主', nameEn: 'Galaxy Lord' },
};

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
 * 获取用户权限状态摘要
 */
export async function getPermissionSummary(
  context: PermissionContext
): Promise<{
  tierLevel: number;
  tierName: string;
  isPremium: boolean;
  isSVIP: boolean;
  privileges: TierPrivileges;
}> {
  const checker = new PermissionChecker(context);
  const level = await checker.getTierLevel();
  const privileges = await checker.getPrivileges();
  const tierName = TierNames[level]?.name ?? '旅行者';

  return {
    tierLevel: level,
    tierName,
    isPremium: level > 0,
    isSVIP: level >= TierLevels.SVIP,
    privileges,
  };
}

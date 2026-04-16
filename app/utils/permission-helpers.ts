/**
 * 权限检查辅助函数
 * 提供常用权限检查场景的便捷封装
 */

import { data } from 'react-router';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import {
  createPermissionChecker,
  type PermissionContext,
  TierLevels,
} from './permissions';
import { TierNames } from './permission-constants';
import type { Database } from '../services/db.server';
import { getSessionToken, verifySession } from '~/services/auth.server';

/**
 * 从 Loader/Action 参数中提取会话信息
 */
export async function getSessionFromArgs(
  args: LoaderFunctionArgs | ActionFunctionArgs
): Promise<{ userId: number; db: Database } | null> {
  const { request, env } = args;

  const token = getSessionToken(request);
  if (!token) {
    return null;
  }

  const result = await verifySession(token, env.anime_db);
  if (!result.valid || !result.user) {
    return null;
  }

  return { userId: result.user.id, db: env.anime_db };
}

/**
 * 示例：在 Loader 中检查会员权限
 */
export async function premiumContentLoader({ request, env }: LoaderFunctionArgs) {
  const token = getSessionToken(request);

  if (!token) {
    return data({ error: '请先登录' }, { status: 401 });
  }

  const session = await verifySession(token, env.anime_db);
  if (!session.valid || !session.user) {
    return data({ error: '请先登录' }, { status: 401 });
  }

  const userId = session.user.id;

  const checker = createPermissionChecker({
    db: env.anime_db,
    userId,
  });

  // 检查用户是否订阅了抢先看内容
  const hasEarlyAccess = await checker.has('earlyAccess');

  if (!hasEarlyAccess) {
    const tierLevel = await checker.getTierLevel();
    const tierName = TierNames[tierLevel]?.name ?? '旅行者';

    return data(
      {
        error: '需要月之子或更高级会员才能抢先体验',
        requireUpgrade: true,
        currentTier: tierName,
      },
      { status: 403 }
    );
  }

  // 获取内容...
  // const content = await getPremiumContent(env.anime_db, params.slug);

  return {
    // content,
  };
}

/**
 * 示例：在 Loader 中检查无广告权限
 */
export async function adFreeLoader({ request, env }: LoaderFunctionArgs) {
  const token = getSessionToken(request);

  if (!token) {
    // 未登录用户，显示广告
    return { showAds: true, reason: 'not_logged_in' };
  }

  const session = await verifySession(token, env.anime_db);
  if (!session.valid || !session.user) {
    return { showAds: true, reason: 'not_logged_in' };
  }

  const userId = session.user.id;

  const checker = createPermissionChecker({
    db: env.anime_db,
    userId,
  });

  const isAdFree = await checker.has('adFree');

  return {
    showAds: !isAdFree,
    reason: isAdFree ? undefined : 'not_premium',
  };
}

/**
 * 示例：在 Loader 中检查下载权限
 */
export async function downloadPermissionLoader({ request, env }: LoaderFunctionArgs) {
  const token = getSessionToken(request);

  if (!token) {
    return data({ error: '请先登录' }, { status: 401 });
  }

  const session = await verifySession(token, env.anime_db);
  if (!session.valid || !session.user) {
    return data({ error: '请先登录' }, { status: 401 });
  }

  const userId = session.user.id;

  const checker = createPermissionChecker({
    db: env.anime_db,
    userId,
  });

  const canDownload = await checker.has('download');

  if (!canDownload) {
    return data(
      {
        error: '下载功能仅对会员开放',
        requireUpgrade: true,
        upgradeTier: '月之子',
      },
      { status: 403 }
    );
  }

  return { canDownload: true };
}

/**
 * 示例：计算用户星尘奖励（考虑会员倍率）
 */
export async function calculateStarDustReward(
  context: PermissionContext,
  baseAmount: number
): Promise<{ finalAmount: number; bonus: number; bonusPercent: number }> {
  const checker = createPermissionChecker(context);
  const bonusPercent = await checker.getMissionBonus();
  const bonus = Math.floor(baseAmount * bonusPercent);
  const finalAmount = baseAmount + bonus;

  return {
    finalAmount,
    bonus,
    bonusPercent,
  };
}

/**
 * 示例：检查收藏夹是否达到上限
 */
export async function checkCollectionLimit(
  context: PermissionContext,
  currentCount: number
): Promise<{
  allowed: boolean;
  limit: number;
  upgradeRequired: boolean;
  currentCount: number;
  remaining: number;
}> {
  const checker = createPermissionChecker(context);
  const limit = await checker.getCollectionLimit();
  const level = await checker.getTierLevel();

  const allowed = currentCount < limit;
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - currentCount);

  return {
    allowed,
    limit,
    upgradeRequired: !allowed && level < TierLevels.STAR_GUARDIAN,
    currentCount,
    remaining,
  };
}

/**
 * 示例：检查用户等级是否满足最低要求
 */
export async function checkMinimumTier(
  context: PermissionContext,
  requiredTier: number
): Promise<{
  satisfied: boolean;
  currentTier: number;
  currentTierName: string;
  requiredTierName: string;
  upgradeRequired: boolean;
}> {
  const checker = createPermissionChecker(context);
  const currentTier = await checker.getTierLevel();
  const currentTierName = TierNames[currentTier]?.name ?? '旅行者';
  const requiredTierName = TierNames[requiredTier]?.name ?? '未知';

  return {
    satisfied: currentTier >= requiredTier,
    currentTier,
    currentTierName,
    requiredTierName,
    upgradeRequired: currentTier < requiredTier,
  };
}

/**
 * 示例：获取用户会员状态摘要
 */
export async function getMembershipSummary({ request, env }: LoaderFunctionArgs) {
  const token = getSessionToken(request);

  if (!token) {
    return {
      isLoggedIn: false,
      tierLevel: 0,
      tierName: '旅行者',
      isPremium: false,
    };
  }

  const session = await verifySession(token, env.anime_db);
  if (!session.valid || !session.user) {
    return {
      isLoggedIn: false,
      tierLevel: 0,
      tierName: '旅行者',
      isPremium: false,
    };
  }

  const userId = session.user.id;

  const checker = createPermissionChecker({
    db: env.anime_db,
    userId,
  });

  const tierLevel = await checker.getTierLevel();
  const tierName = TierNames[tierLevel]?.name ?? '旅行者';
  const isPremium = await checker.isPremium();

  return {
    isLoggedIn: true,
    tierLevel,
    tierName,
    isPremium,
  };
}

/**
 * 权限检查中间件：确保用户已登录
 */
export async function requireAuth(
  args: LoaderFunctionArgs | ActionFunctionArgs
): Promise<{ userId: number; db: Database }> {
  const { request, env } = args;
  const token = getSessionToken(request);

  if (!token) {
    throw new Response(JSON.stringify({ error: '请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = await verifySession(token, env.anime_db);
  if (!session.valid || !session.user) {
    throw new Response(JSON.stringify({ error: '请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return { userId: session.user.id, db: env.anime_db };
}

/**
 * 权限检查中间件：确保用户是会员
 */
export async function requirePremium(
  args: LoaderFunctionArgs | ActionFunctionArgs
): Promise<{ userId: number; db: Database }> {
  const { userId, db } = await requireAuth(args);

  const checker = createPermissionChecker({ db, userId });
  const isPremium = await checker.isPremium();

  if (!isPremium) {
    const tierLevel = await checker.getTierLevel();
    const tierName = TierNames[tierLevel]?.name ?? '旅行者';

    throw new Response(
      JSON.stringify({
        error: '此功能需要会员权限',
        currentTier: tierName,
        requireUpgrade: true,
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return { userId, db };
}

/**
 * 权限检查中间件：确保用户是 SVIP 或更高
 */
export async function requireSVIP(
  args: LoaderFunctionArgs | ActionFunctionArgs
): Promise<{ userId: number; db: Database }> {
  const { userId, db } = await requireAuth(args);

  const checker = createPermissionChecker({ db, userId });
  const isSVIP = await checker.isSVIP();

  if (!isSVIP) {
    const tierLevel = await checker.getTierLevel();
    const tierName = TierNames[tierLevel]?.name ?? '旅行者';

    throw new Response(
      JSON.stringify({
        error: '此功能需要星之守护者或更高级会员',
        currentTier: tierName,
        requireUpgrade: true,
        requiredTier: '星之守护者',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return { userId, db };
}

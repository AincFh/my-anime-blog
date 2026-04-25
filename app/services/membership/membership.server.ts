/**
 * 会员服务层
 * 支持新的会员等级体系（旅行者、月之子、星之守护者、银河领主）
 * 底层数据来源：subscriptions 表（通过 tier.server.ts）
 */

import { queryAll, queryFirst, type Database } from '../db.server';
import { getUserMembershipTier, getAllTiers as getAllTiersFromDb, type TierPrivileges } from './tier.server';
import { getLogger } from '~/utils/logger';

export interface MembershipTier {
  tier_id: number;
  tier_name: string;
  tier_name_en: string;
  tier_level: number;
  monthly_price_cents: number;
  yearly_price_cents: number;
  description: string | null;
  features: string[];
  color_hex: string | null;
  is_active: boolean;
}

export interface MembershipPermission {
  permission_key: string;
  permission_name: string;
  permission_category: string;
  value: number;
  extra_data: Record<string, unknown> | null;
}

export interface UserMembership {
  user_id: number;
  tier_level: number;
  tier_name: string;
  tier_name_en: string;
  color_hex: string | null;
  started_at: string;
  expires_at: string | null;
  status: 'active' | 'expired' | 'cancelled';
}

export interface TierPermissionsMap {
  [permissionKey: string]: number;
}

class MembershipService {
  /**
   * 获取所有会员等级列表
   * 数据来源：tier.server.ts → subscriptions 表
   */
  async getAllTiers(db: Database): Promise<MembershipTier[]> {
    const rows = await getAllTiersFromDb(db);
    return rows.map(row => ({
      tier_id: row.id,
      tier_name: row.name,
      tier_name_en: row.name,
      tier_level: row.sort_order,
      monthly_price_cents: row.price_monthly,
      yearly_price_cents: row.price_yearly,
      description: row.description,
      features: row.privileges ? Object.keys(JSON.parse(row.privileges)) : [],
      color_hex: row.badge_color,
      is_active: row.is_active === 1,
    }));
  }

  /**
   * 获取单个会员等级详情
   * 数据来源：tier.server.ts
   */
  async getTierByLevel(db: Database, level: number): Promise<MembershipTier | null> {
    const row = await queryFirst<{
      id: number;
      name: string;
      display_name: string;
      price_monthly: number;
      price_yearly: number;
      description: string | null;
      privileges: string | null;
      badge_color: string | null;
      sort_order: number;
      is_active: number;
    }>(db, 'SELECT * FROM membership_tiers WHERE sort_order = ? AND is_active = 1', level);

    if (!row) return null;

    return {
      tier_id: row.id,
      tier_name: row.name,
      tier_name_en: row.name,
      tier_level: row.sort_order,
      monthly_price_cents: row.price_monthly,
      yearly_price_cents: row.price_yearly,
      description: row.description,
      features: row.privileges ? Object.keys(JSON.parse(row.privileges)) : [],
      color_hex: row.badge_color,
      is_active: row.is_active === 1,
    };
  }

  /**
   * 获取用户在特定等级下的所有权限
   */
  async getUserPermissions(db: Database, tierLevel: number): Promise<MembershipPermission[]> {
    const rows = await queryAll<{
      permission_key: string;
      permission_name: string;
      permission_category: string;
      value: number;
      extra_data: string | null;
    }>(
      db,
      `SELECT mp.permission_key, mp.permission_name, mp.permission_category,
              COALESCE(tp.value, 0) as value, tp.extra_data
       FROM membership_permissions mp
       LEFT JOIN tier_permissions tp ON mp.permission_key = tp.permission_key 
                                    AND tp.tier_level = ?
       WHERE mp.is_active = 1
       ORDER BY mp.permission_category, mp.permission_name`,
      tierLevel
    );

    return rows.map(row => ({
      permission_key: row.permission_key,
      permission_name: row.permission_name,
      permission_category: row.permission_category,
      value: row.value,
      extra_data: this.parseExtraData(row.extra_data),
    }));
  }

  /**
   * 解析 extra_data JSON 字段
   */
  private parseExtraData(extraData: string | null): Record<string, unknown> | null {
    if (!extraData) return null;
    try {
      return JSON.parse(extraData);
    } catch {
      return null;
    }
  }

  /**
   * 获取用户权限 Map（用于快速查找）
   */
  async getUserPermissionsMap(db: Database, tierLevel: number): Promise<TierPermissionsMap> {
    const permissions = await this.getUserPermissions(db, tierLevel);
    const map: TierPermissionsMap = {};
    for (const p of permissions) {
      map[p.permission_key] = p.value;
    }
    return map;
  }

  /**
   * 检查用户是否拥有特定权限
   */
  async hasPermission(
    db: Database,
    userId: number,
    permissionKey: string
  ): Promise<boolean> {
    const userMembership = await this.getUserMembership(db, userId);
    if (!userMembership) return false;

    const permissions = await this.getUserPermissionsMap(db, userMembership.tier_level);
    return (permissions[permissionKey] ?? 0) > 0;
  }

  /**
   * 获取用户会员信息
   * 数据来源：tier.server.ts → subscriptions 表（统一数据源）
   */
  async getUserMembership(db: Database, userId: number): Promise<UserMembership | null> {
    const { tier, subscription } = await getUserMembershipTier(db, userId);

    if (!tier || tier.sort_order === 0) {
      return null; // 免费用户
    }

    const startDate = subscription?.start_date
      ? new Date(subscription.start_date * 1000).toISOString()
      : new Date().toISOString();
    const endDate = subscription?.end_date
      ? new Date(subscription.end_date * 1000).toISOString()
      : null;

    return {
      user_id: userId,
      tier_level: tier.sort_order,
      tier_name: tier.display_name,
      tier_name_en: tier.name,
      color_hex: tier.badge_color,
      started_at: startDate,
      expires_at: endDate,
      status: subscription?.status === 'active' ? 'active' : 'expired',
    };
  }

  /**
   * 创建/更新用户会员订阅
   */
  async upsertUserMembership(
    db: Database,
    userId: number,
    tierLevel: number,
    expiresAt: string | null,
    paymentMethod: string,
    paymentId: string
  ): Promise<boolean> {
    try {
      // 检查是否已有会员记录
      const existing = await queryFirst<{ id: number }>(
        db,
        'SELECT id FROM user_memberships WHERE user_id = ?',
        userId
      );

      if (existing) {
        // 更新现有记录
        await db.prepare(
          `UPDATE user_memberships
           SET tier_level = ?,
               expires_at = ?,
               payment_method = ?,
               payment_id = ?,
               status = 'active',
               updated_at = datetime('now')
           WHERE user_id = ?`
        ).bind(tierLevel, expiresAt, paymentMethod, paymentId, userId).run();
      } else {
        // 创建新记录
        await db.prepare(
          `INSERT INTO user_memberships (user_id, tier_level, started_at, expires_at, payment_method, payment_id, status)
           VALUES (?, ?, datetime('now'), ?, ?, ?, 'active')`
        ).bind(userId, tierLevel, expiresAt, paymentMethod, paymentId).run();
      }

      return true;
    } catch (error) {
      getLogger().error('Upsert user membership failed', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * 获取用户的权限值（用于需要数值比较的场景）
   */
  async getPermissionValue(
    db: Database,
    userId: number,
    permissionKey: string
  ): Promise<number> {
    const userMembership = await this.getUserMembership(db, userId);
    if (!userMembership) return 0;

    const permissions = await this.getUserPermissionsMap(db, userMembership.tier_level);
    return permissions[permissionKey] ?? 0;
  }

  /**
   * 获取用户星尘奖励倍率
   */
  async getStarDustMultiplier(db: Database, userId: number): Promise<number> {
    return await this.getPermissionValue(db, userId, 'game.task.reward_multiplier');
  }

  /**
   * 获取用户收藏夹上限
   */
  async getCollectionLimit(db: Database, userId: number): Promise<number> {
    const value = await this.getPermissionValue(db, userId, 'feature.collection.cloud');
    if (value === 0) {
      // 基础收藏夹
      return 50;
    }
    return value; // -1 表示无限
  }

  /**
   * 检查用户是否可以访问付费内容
   */
  async canAccessPremiumContent(
    db: Database,
    userId: number,
    contentType: 'early' | 'full'
  ): Promise<boolean> {
    const userMembership = await this.getUserMembership(db, userId);
    if (!userMembership) return false;

    if (contentType === 'early') {
      // 抢先体验需要 Lv1+
      return userMembership.tier_level >= 1;
    }
    if (contentType === 'full') {
      // 完全解锁需要 Lv3
      return userMembership.tier_level >= 3;
    }
    return false;
  }

  /**
   * 检查用户是否可以去除广告
   */
  async isAdFree(db: Database, userId: number): Promise<boolean> {
    return await this.hasPermission(db, userId, 'feature.ad.free');
  }

  /**
   * 获取 Gacha 保底加成值
   */
  async getGachaPityBonus(db: Database, userId: number): Promise<number> {
    return await this.getPermissionValue(db, userId, 'game.gacha.pity');
  }

  /**
   * 检查用户是否是 VIP 或更高（Lv1+）
   */
  async isVIPOrAbove(db: Database, userId: number): Promise<boolean> {
    const membership = await this.getUserMembership(db, userId);
    return membership !== null && membership.tier_level >= 1;
  }

  /**
   * 检查用户是否是 SVIP（Lv2+）
   */
  async isSVIP(db: Database, userId: number): Promise<boolean> {
    const membership = await this.getUserMembership(db, userId);
    return membership !== null && membership.tier_level >= 2;
  }

  /**
   * 检查用户是否是银河领主（Lv3）
   */
  async isGalaxyLord(db: Database, userId: number): Promise<boolean> {
    const membership = await this.getUserMembership(db, userId);
    return membership !== null && membership.tier_level >= 3;
  }

  /**
   * 获取会员等级名称
   */
  getTierName(level: number): string {
    const tierNames: Record<number, string> = {
      0: '旅行者',
      1: '月之子',
      2: '星之守护者',
      3: '银河领主',
    };
    return tierNames[level] ?? '未知';
  }

  /**
   * 获取会员等级颜色
   */
  getTierColor(level: number): string {
    const tierColors: Record<number, string> = {
      0: '#6B7280', // 灰色
      1: '#8B5CF6', // 紫色
      2: '#3B82F6', // 蓝色
      3: '#F59E0B', // 金色
    };
    return tierColors[level] ?? '#6B7280';
  }

  /**
   * 计算订阅结束时间
   */
  calculateEndDate(
    startDate: Date,
    period: 'monthly' | 'yearly'
  ): Date {
    const endDate = new Date(startDate);

    if (period === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (period === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    return endDate;
  }

  /**
   * 取消用户会员订阅
   */
  async cancelMembership(
    db: Database,
    userId: number
  ): Promise<boolean> {
    try {
      await db.prepare("UPDATE user_memberships SET status = 'cancelled' WHERE user_id = ?").bind(userId).run();
      return true;
    } catch (error) {
      getLogger().error('Cancel membership failed', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * 批量检查过期订阅并更新状态
   */
  async expireSubscriptions(db: Database): Promise<number> {
    try {
      const result = await db.prepare(
        `UPDATE user_memberships
         SET status = 'expired'
         WHERE status = 'active'
           AND expires_at IS NOT NULL
           AND expires_at < datetime('now')`
      ).run();
      return result.meta?.changes ?? 0;
    } catch (error) {
      getLogger().error('Expire subscriptions failed', { error: error instanceof Error ? error.message : String(error) });
      return 0;
    }
  }
}

export const membershipService = new MembershipService();

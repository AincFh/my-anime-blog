/**
 * 会员服务层
 * 支持新的会员等级体系（旅行者、月之子、星之守护者、银河领主）
 */

import { queryAll, queryFirst, execute, type Database } from '../db.server';

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
   */
  async getAllTiers(db: Database): Promise<MembershipTier[]> {
    const rows = await queryAll<{
      tier_id: number;
      tier_name: string;
      tier_name_en: string;
      tier_level: number;
      monthly_price_cents: number;
      yearly_price_cents: number;
      description: string | null;
      features: string | null;
      color_hex: string | null;
      is_active: number;
    }>(db, 'SELECT * FROM membership_tiers WHERE is_active = 1 ORDER BY sort_order ASC');

    return rows.map(row => ({
      tier_id: row.tier_id,
      tier_name: row.tier_name,
      tier_name_en: row.tier_name_en,
      tier_level: row.tier_level,
      monthly_price_cents: row.monthly_price_cents,
      yearly_price_cents: row.yearly_price_cents,
      description: row.description,
      features: this.parseFeatures(row.features),
      color_hex: row.color_hex,
      is_active: row.is_active === 1,
    }));
  }

  /**
   * 解析 features JSON 字段
   */
  private parseFeatures(features: string | null): string[] {
    if (!features) return [];
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * 获取单个会员等级详情
   */
  async getTierByLevel(db: Database, level: number): Promise<MembershipTier | null> {
    const row = await queryFirst<{
      tier_id: number;
      tier_name: string;
      tier_name_en: string;
      tier_level: number;
      monthly_price_cents: number;
      yearly_price_cents: number;
      description: string | null;
      features: string | null;
      color_hex: string | null;
      is_active: number;
    }>(db, 'SELECT * FROM membership_tiers WHERE tier_level = ? AND is_active = 1', level);

    if (!row) return null;

    return {
      tier_id: row.tier_id,
      tier_name: row.tier_name,
      tier_name_en: row.tier_name_en,
      tier_level: row.tier_level,
      monthly_price_cents: row.monthly_price_cents,
      yearly_price_cents: row.yearly_price_cents,
      description: row.description,
      features: this.parseFeatures(row.features),
      color_hex: row.color_hex,
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
   */
  async getUserMembership(db: Database, userId: number): Promise<UserMembership | null> {
    const row = await queryFirst<{
      user_id: number;
      tier_level: number;
      tier_name: string;
      tier_name_en: string;
      color_hex: string | null;
      started_at: string;
      expires_at: string | null;
      status: string;
    }>(
      db,
      `SELECT um.user_id, um.tier_level, um.started_at, um.expires_at, um.status,
              mt.tier_name, mt.tier_name_en, mt.color_hex
       FROM user_memberships um
       JOIN membership_tiers mt ON um.tier_level = mt.tier_level
       WHERE um.user_id = ? AND um.status = 'active'
       ORDER BY um.tier_level DESC
       LIMIT 1`,
      userId
    );

    if (!row) return null;

    // 检查是否过期
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      // 更新过期状态
      await execute(
        db,
        "UPDATE user_memberships SET status = 'expired' WHERE user_id = ?",
        userId
      );
      return null;
    }

    return {
      user_id: row.user_id,
      tier_level: row.tier_level,
      tier_name: row.tier_name,
      tier_name_en: row.tier_name_en,
      color_hex: row.color_hex,
      started_at: row.started_at,
      expires_at: row.expires_at,
      status: row.status as 'active' | 'expired' | 'cancelled',
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
        await execute(
          db,
          `UPDATE user_memberships
           SET tier_level = ?,
               expires_at = ?,
               payment_method = ?,
               payment_id = ?,
               status = 'active',
               updated_at = datetime('now')
           WHERE user_id = ?`,
          tierLevel,
          expiresAt,
          paymentMethod,
          paymentId,
          userId
        );
      } else {
        // 创建新记录
        await execute(
          db,
          `INSERT INTO user_memberships (user_id, tier_level, started_at, expires_at, payment_method, payment_id, status)
           VALUES (?, ?, datetime('now'), ?, ?, ?, 'active')`,
          userId,
          tierLevel,
          expiresAt,
          paymentMethod,
          paymentId
        );
      }

      return true;
    } catch (error) {
      console.error('Upsert user membership error:', error);
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
      await execute(
        db,
        "UPDATE user_memberships SET status = 'cancelled' WHERE user_id = ?",
        userId
      );
      return true;
    } catch (error) {
      console.error('Cancel membership error:', error);
      return false;
    }
  }

  /**
   * 批量检查过期订阅并更新状态
   */
  async expireSubscriptions(db: Database): Promise<number> {
    try {
      const result = await execute(
        db,
        `UPDATE user_memberships 
         SET status = 'expired' 
         WHERE status = 'active' 
           AND expires_at IS NOT NULL 
           AND expires_at < datetime('now')`
      );
      return result.meta?.changes ?? 0;
    } catch (error) {
      console.error('Expire subscriptions error:', error);
      return 0;
    }
  }
}

export const membershipService = new MembershipService();

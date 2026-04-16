/**
 * 会员服务导出
 * 统一导出所有会员相关的服务和类型
 */

export {
  membershipService,
  type MembershipTier,
  type MembershipPermission,
  type UserMembership,
  type TierPermissionsMap,
} from './membership.server';

// 导出原有模块（保持向后兼容）
export {
  getAllTiers,
  getTierById,
  getTierByName,
  parsePrivileges,
  getUserMembershipTier,
  checkUserPrivilege,
  getUserPrivilegeValue,
  isVIPOrAbove,
  isSVIP,
  getTierPrice,
  calculateEndDate,
  type MembershipTier as TierInfo,
  type TierPrivileges,
} from './tier.server';

export type { Subscription } from './subscription.server';
export {
  createSubscription,
  cancelSubscription,
  resumeAutoRenew,
  getUserSubscription,
  getUserSubscriptionHistory,
} from './subscription.server';

export {
  getUserMissions,
  updateMissionProgress,
  claimMissionReward,
  type Mission,
  type UserMission,
} from './mission.server';

export {
  getUserCoins,
  addCoins,
  spendCoins,
  refundCoins,
  getCoinTransactionHistory,
  claimDailyLoginReward,
  giftCoins,
  type CoinTransaction,
  type CoinSource,
} from './coins.server';

export {
  getPendingRenewalNotifications,
  sendRenewalReminder,
  sendExpiredNotice,
  processRenewalNotifications,
  calculateNextNotifyTime,
  type NotificationResult,
  type RenewalNotification,
} from './notify.server';

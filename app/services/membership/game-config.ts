/**
 * 游戏与经济系统配置
 * 集中管理常量，避免代码重复
 */

// 充值档位 — 从微额到超大额全覆盖
export const RECHARGE_PACKAGES = [
    { id: 'pkg_1', coins: 10, price: 100, bonus: 0, label: '¥1', tag: '' },
    { id: 'pkg_6', coins: 60, price: 600, bonus: 0, label: '¥6', tag: '' },
    { id: 'pkg_12', coins: 130, price: 1200, bonus: 10, label: '¥12', tag: '' },
    { id: 'pkg_30', coins: 350, price: 3000, bonus: 50, label: '¥30', tag: '热门' },
    { id: 'pkg_68', coins: 880, price: 6800, bonus: 200, label: '¥68', tag: '' },
    { id: 'pkg_128', coins: 1680, price: 12800, bonus: 520, label: '¥128', tag: '超值' },
    { id: 'pkg_328', coins: 4280, price: 32800, bonus: 1600, label: '¥328', tag: '' },
    { id: 'pkg_648', coins: 8880, price: 64800, bonus: 3520, label: '¥648', tag: '巨量' },
    { id: 'pkg_998', coins: 14800, price: 99800, bonus: 6200, label: '¥998', tag: '至尊' },
];

// AI 功能限额 (Feature Limits)
export const AI_DAILY_LIMITS = {
    summary: 100,
    search: 200,
    writing: 50,
    chat: 500,
    recommend: 300,
    moderate: 1000,

    // Default fallback
    default: 100,
} as const;

// 补签规则 — 分段递增，无每月次数限制
// 费用计算：baseCost + (consecutiveCount - 1) * incrementalCost，封顶于 maxCostPerDay
// 收支验证（月漏签3天成本：30+50+70=150，占普通用户月收入660的23%）
export const MAKEUP_SIGNIN_CONFIG = {
    baseCost: 30,          // 第1次补签费用
    incrementalCost: 20,   // 每次补签增加的固定金额
    maxCostPerDay: 100,   // 单次补签封顶
    maxDaysBack: 7,       // 最多补签过去多少天
} as const;

// 积分消耗规则 (Cost Rules)
export const COIN_COSTS = {
    check_in_makeup: 50, // 补签（基础价，见 MAKEUP_SIGNIN_CONFIG）
    modify_name: 500,    // 改名
} as const;

/**
 * 游戏与经济系统配置
 * 集中管理常量，避免代码重复
 */

// 充值档位
export const RECHARGE_PACKAGES = [
    { id: 'pkg_6', coins: 60, price: 600, bonus: 0, label: '6元' },
    { id: 'pkg_12', coins: 130, price: 1200, bonus: 10, label: '12元' },
    { id: 'pkg_30', coins: 350, price: 3000, bonus: 50, label: '30元' },
    { id: 'pkg_61', coins: 810, price: 6100, bonus: 120, label: '61元' }, // 调整
    { id: 'pkg_68', coins: 880, price: 6800, bonus: 120, label: '68元' },
    { id: 'pkg_128', coins: 1680, price: 12800, bonus: 300, label: '128元' },
    { id: 'pkg_328', coins: 4280, price: 32800, bonus: 900, label: '328元' },
    { id: 'pkg_648', coins: 8880, price: 64800, bonus: 2000, label: '648元' },
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

// 积分消耗规则 (Cost Rules)
export const COIN_COSTS = {
    check_in_makeup: 50, // 补签
    modify_name: 500,    // 改名
} as const;

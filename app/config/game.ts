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

// 积分消耗规则 (Cost Rules)
export const COIN_COSTS = {
    check_in_makeup: 50, // 补签
    modify_name: 500,    // 改名
} as const;

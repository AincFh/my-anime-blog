/**
 * 全局配置常量
 * 提供所有 ~config~ 导入断裂处的配置值
 */

// ══════════════════════════════════════════════════════════════════════════════
// 认证与安全配置
// ══════════════════════════════════════════════════════════════════════════════

export const SECURITY_CONFIG = {
    turnstileLevel: 'strict',
    fingerprintSalt: 'aincrad_sword_art_online',
};

export const AUTH_CONFIG = {
    codeExpiration: 300,
    tempPasswordExpiration: 300,
    sessionExpiration: 7 * 24 * 60 * 60,
    deviceRecordExpiration: 86400,
    loginFailLockout: 600,
    blockedDomains: ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com'],
};

export const RATE_LIMITS = {
    SEND_CODE:       { maxRequests: 1,  windowSeconds: 60,   keyPrefix: 'ratelimit:send_code' },
    SEND_CODE_HOUR:  { maxRequests: 5,  windowSeconds: 3600,  keyPrefix: 'ratelimit:send_code_hour' },
    COMMENT:         { maxRequests: 1,  windowSeconds: 10,   keyPrefix: 'ratelimit:comment' },
    LOGIN_FAIL:      { maxRequests: 5,  windowSeconds: 600,  keyPrefix: 'ratelimit:login_fail' },
} as const;

export const PAYMENT_CONFIG = {
    timestampValidity: 300,
    lockDuration: 30,
};

// ══════════════════════════════════════════════════════════════════════════════
// AI 配置
// ══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_AI_CONFIG = {
    enabled: true,
    features: {
        summary: true, search: true, writing: true, chat: true,
        recommend: true, moderate: true, seo: true, imageSuggest: true,
        tags: true, translate: true,
    },
    limits: {
        dailyTotal: 1000,
        perFeature: {
            summary: 100, search: 200, writing: 50, chat: 500,
            recommend: 300, moderate: 1000, seo: 100, imageSuggest: 50,
            tags: 100, translate: 100,
        },
    },
    chatbot: {
        name: '小绫',
        personality: '活泼可爱、热情、略带傲娇',
        welcomeMessage: '你好呀～我是小绫，有什么想问的尽管说！(◕‿◕)',
    },
};

// ══════════════════════════════════════════════════════════════════════════════
// 音乐播放器配置
// ══════════════════════════════════════════════════════════════════════════════

export const MUSIC_CONFIG = {
    apiBase: 'https://met.liiiu.cn/meting/api',
    defaultPlaylistId: '13641046209',
    cacheTtl: 3600,
};

// ══════════════════════════════════════════════════════════════════════════════
// Live2D 看板娘配置
// ══════════════════════════════════════════════════════════════════════════════

export const LIVE2D_MODELS = [
    'shizuku', 'chitose', 'haru01', 'haruto', 'hibiki', 'hijiki',
    'koharu', 'miku', 'ni-j', 'nico', 'nietzsche', 'nipsilon',
    'nito', 'tsumiki', 'unitychan',
] as const;

export type Live2dModelId = (typeof LIVE2D_MODELS)[number];

const MODEL_DIR: Record<Live2dModelId, string> = {
    shizuku:    'shizuku',
    chitose:    'chitose',
    haru01:     'haru01',
    haruto:     'haruto',
    hibiki:     'hibiki',
    hijiki:     'hijiki',
    koharu:     'koharu',
    miku:       'miku',
    'ni-j':     'ni-j',
    nico:       'nico',
    nietzsche:  'nietzsche',
    nipsilon:   'nipsilon',
    nito:       'nito',
    tsumiki:    'tsumiki',
    unitychan:  'unitychan',
};

export function getModelDir(modelId: string): string {
    return MODEL_DIR[modelId as Live2dModelId] ?? modelId;
}

export interface Live2dModelLayout {
    displayWidth: number;
    displayHeight: number;
    visualBottomNudgePx: number;
    headCenterFromBottomPx: number;
    headCenterFromBottomRatio: number;
    bubbleMaxHeight: number;
}

const DEFAULT_WIDTH = 135;
const DEFAULT_HEIGHT = 270;
const DEFAULT_HEAD_CENTER_FROM_BOTTOM_RATIO = 0.9;

const MODEL_LAYOUT_WIDTH: Partial<Record<Live2dModelId, number>> = {
    shizuku: 2.4, haru01: 2.9,
};

type Live2dLayoutOverride = Pick<Live2dModelLayout, 'visualBottomNudgePx' | 'bubbleMaxHeight'> & {
    headCenterFromBottomRatio: number;
};

const LIVE2D_MODEL_LAYOUT_OVERRIDES: Partial<Record<Live2dModelId, Live2dLayoutOverride>> = {
    shizuku:   { visualBottomNudgePx: 22, headCenterFromBottomRatio: 0.9,   bubbleMaxHeight: 96  },
    chitose:   { visualBottomNudgePx: 25, headCenterFromBottomRatio: 0.89,  bubbleMaxHeight: 100 },
    haru01:    { visualBottomNudgePx: 40, headCenterFromBottomRatio: 0.9,   bubbleMaxHeight: 104 },
    haruto:    { visualBottomNudgePx: 20, headCenterFromBottomRatio: 0.91,  bubbleMaxHeight: 92  },
    hibiki:    { visualBottomNudgePx: 26, headCenterFromBottomRatio: 0.89,  bubbleMaxHeight: 100 },
    hijiki:    { visualBottomNudgePx: 34, headCenterFromBottomRatio: 0.88,  bubbleMaxHeight: 104 },
    koharu:    { visualBottomNudgePx: 44, headCenterFromBottomRatio: 0.94,  bubbleMaxHeight: 108 },
    miku:      { visualBottomNudgePx: 25, headCenterFromBottomRatio: 0.89,  bubbleMaxHeight: 104 },
    'ni-j':    { visualBottomNudgePx: 22, headCenterFromBottomRatio: 0.89,  bubbleMaxHeight: 96  },
    nico:      { visualBottomNudgePx: 30, headCenterFromBottomRatio: 0.89,  bubbleMaxHeight: 104 },
    nietzsche: { visualBottomNudgePx: 18, headCenterFromBottomRatio: 0.92,  bubbleMaxHeight: 92  },
    nipsilon:  { visualBottomNudgePx: 33, headCenterFromBottomRatio: 0.88,  bubbleMaxHeight: 100 },
    nito:      { visualBottomNudgePx: 21, headCenterFromBottomRatio: 0.9,   bubbleMaxHeight: 92  },
    tsumiki:   { visualBottomNudgePx: 28, headCenterFromBottomRatio: 0.89,  bubbleMaxHeight: 100 },
    unitychan: { visualBottomNudgePx: 29, headCenterFromBottomRatio: 0.89,  bubbleMaxHeight: 104 },
};

export function getLive2dModelLayout(modelId: string): Live2dModelLayout {
    const id = modelId as Live2dModelId;
    const over = LIVE2D_MODEL_LAYOUT_OVERRIDES[id];
    const layoutWidth = MODEL_LAYOUT_WIDTH[id];
    const dw = layoutWidth !== undefined
        ? Math.round(DEFAULT_WIDTH * (layoutWidth / 2.4))
        : DEFAULT_WIDTH;
    const displayHeight = DEFAULT_HEIGHT;
    const ratio = over?.headCenterFromBottomRatio ?? DEFAULT_HEAD_CENTER_FROM_BOTTOM_RATIO;
    const headCenterFromBottomPx = Math.round(displayHeight * ratio);

    return {
        displayWidth:             dw,
        displayHeight,
        visualBottomNudgePx:      over?.visualBottomNudgePx ?? 25,
        headCenterFromBottomPx,
        headCenterFromBottomRatio: ratio,
        bubbleMaxHeight:           over?.bubbleMaxHeight ?? 100,
    };
}

// ══════════════════════════════════════════════════════════════════════════════
// UI 视觉参数
// ══════════════════════════════════════════════════════════════════════════════

export const UI_CONSTANTS = {
    sakuraParticleDensity: 30,
    defaultArticleCover: 'https://img.moegirl.org.cn/common/thumb/c/c1/Anime_Blog_Hero.jpg/800px-Anime_Blog_Hero.jpg',
    colors: {
        primary:   '#FF69B4',
        secondary: '#00BFFF',
    },
    live2d: {
        scriptSrc: 'https://cdn.jsdelivr.net/npm/live2d-widget@3.0.5/lib/L2Dwidget.min.js',
        rightInsetPx: 8,
        opacity: {
            default: 0.95,
            hover: 1,
        },
    },
};

// ══════════════════════════════════════════════════════════════════════════════
// 游戏与经济系统配置
// ══════════════════════════════════════════════════════════════════════════════

export const RECHARGE_PACKAGES = [
    { id: 'pkg_1',   coins: 10,   price: 100,   bonus: 0,    label: '¥1',   tag: '' },
    { id: 'pkg_6',   coins: 60,   price: 600,   bonus: 0,    label: '¥6',   tag: '' },
    { id: 'pkg_12',  coins: 130,  price: 1200,  bonus: 10,   label: '¥12',  tag: '' },
    { id: 'pkg_30',  coins: 350,  price: 3000,  bonus: 50,   label: '¥30',  tag: '热门' },
    { id: 'pkg_68',  coins: 880,  price: 6800,  bonus: 200,  label: '¥68',  tag: '' },
    { id: 'pkg_128', coins: 1680, price: 12800, bonus: 520,  label: '¥128', tag: '超值' },
    { id: 'pkg_328', coins: 4280, price: 32800, bonus: 1600, label: '¥328', tag: '' },
    { id: 'pkg_648', coins: 8880, price: 64800, bonus: 3520, label: '¥648', tag: '巨量' },
    { id: 'pkg_998', coins: 14800, price: 99800, bonus: 6200, label: '¥998', tag: '至尊' },
];

export const AI_DAILY_LIMITS = {
    summary: 100, search: 200, writing: 50, chat: 500,
    recommend: 300, moderate: 1000, default: 100,
} as const;

export const COIN_COSTS = {
    check_in_makeup: 50,
    modify_name: 500,
} as const;

/**
 * 应用全局配置
 */

// 认证与安全配置
export const SECURITY_CONFIG = {
    csrfSecret: typeof process !== 'undefined' ? process.env.CSRF_SECRET : undefined,
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
    SEND_CODE:       { maxRequests: 1, windowSeconds: 60,  keyPrefix: 'ratelimit:send_code' },
    SEND_CODE_HOUR: { maxRequests: 5, windowSeconds: 3600, keyPrefix: 'ratelimit:send_code_hour' },
    COMMENT:         { maxRequests: 1, windowSeconds: 10,  keyPrefix: 'ratelimit:comment' },
    LOGIN_FAIL:      { maxRequests: 5, windowSeconds: 600, keyPrefix: 'ratelimit:login_fail' },
} as const;

export const PAYMENT_CONFIG = {
    timestampValidity: 300,
    lockDuration: 30,
};

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

// 音乐播放器配置
export const MUSIC_CONFIG = {
    apiBase: 'https://api.i-meto.com/meting/api',
    defaultPlaylistId: '13641046209',
    cacheTtl: 3600,
};

// ═══════════════════════════════════════════════════════════════════════════
// Live2D 看板娘配置
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 看板娘池（仅人类/拟人向，不含动物与机甲模型）
 */
export const LIVE2D_MODELS = [
    'shizuku', 'chitose', 'haru01', 'haruto', 'hibiki', 'hijiki',
    'koharu', 'miku', 'ni-j', 'nico', 'nietzsche', 'nipsilon',
    'nito', 'tsumiki', 'unitychan',
] as const;

export type Live2dModelId = (typeof LIVE2D_MODELS)[number];

/** 模型 key → 实际目录名映射（npm 包名历史遗留问题） */
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
    nipsilon:   'ipsilon',   // 目录名实际为 'ipsilon'
    nito:       'nito',
    tsumiki:    'tsumiki',
    unitychan:  'unitychan',
};

/** 根据模型 key 返回实际目录名 */
export function getModelDir(modelId: string): string {
    return MODEL_DIR[modelId as Live2dModelId] ?? modelId;
}

/**
 * 单模型布局参数
 *
 * 设计原则：
 *   1. 不拉伸、不强制统一宽高比 —— 每个模型保持自身比例
 *   2. 容器适配模型大小，而非模型适配容器
 *   3. 弹幕气泡小三角永远指向角色头顶中心（head hit area），随模型高度变化
 *   4. 脚底用 translateY 补偿底部透明区，使角色视觉上贴齐视口底边
 */
export interface Live2dModelLayout {
    /**
     * L2Dwidget.init 传入的 display.width（px）。
     * 来自模型 layout.width（Live2D 标准单位）或纹理比例估算。
     */
    displayWidth: number;
    /**
     * L2Dwidget.init 传入的 display.height（px）。
     */
    displayHeight: number;
    /**
     * canvas.style.transform: translateY(nudge) 让角色脚底贴近视口底边。
     * 透明区多则正值（往下压），脚底偏上则负值（往上抬）。
     */
    visualBottomNudgePx: number;
    /**
     * 头部中心距容器底边的距离（px），由 displayHeight × ratio 计算。
     * 脚底对齐容器底边时，ratio 多在 0.82~0.92（头顶靠近画布上沿）；Q 版同样偏高。
     * 弹幕定位会再减去 visualBottomNudgePx，与 canvas 的 translateY 一致。
     */
    headCenterFromBottomPx: number;
    /**
     * 用于调参与文档：headCenterFromBottomPx / displayHeight。
     */
    headCenterFromBottomRatio: number;
    /**
     * 弹幕气泡本身的最大高度（px），决定气泡容器高度。
     */
    bubbleMaxHeight: number;
}

// 右下角挂件基准：不宜过大，否则占满半屏；宽度按 layout.width 相对 2.4 缩放
const DEFAULT_WIDTH = 135;
const DEFAULT_HEIGHT = 270;

// 未单独配置时：头顶约在画布靠上区域（相对脚底的比例）
// 越大 = 锚点越靠上（距容器底越远），指向头顶；Q 版头大在画布上方，ratio 往往要 ≥0.9
const DEFAULT_HEAD_CENTER_FROM_BOTTOM_RATIO = 0.9;

// Live2D layout.width 参考（仅用于计算 displayWidth）
// 数值来自各模型的 .model.json layout.width 字段
const MODEL_LAYOUT_WIDTH: Partial<Record<Live2dModelId, number>> = {
    shizuku:   2.4,
    haru01:    2.9,
};

/** 仅写与默认不同的字段；头顶用 ratio×displayHeight，避免换高度后三角仍指胸口 */
type Live2dLayoutOverride = Pick<
    Live2dModelLayout,
    'visualBottomNudgePx' | 'bubbleMaxHeight'
> & {
    headCenterFromBottomRatio: number;
};

const LIVE2D_MODEL_LAYOUT_OVERRIDES: Partial<Record<Live2dModelId, Live2dLayoutOverride>> = {
    shizuku: {
        visualBottomNudgePx:             22,
        headCenterFromBottomRatio:         0.9,
        bubbleMaxHeight:                   96,
    },
    chitose: {
        visualBottomNudgePx:             25,
        headCenterFromBottomRatio:         0.89,
        bubbleMaxHeight:                   100,
    },
    haru01: {
        visualBottomNudgePx:             40,
        headCenterFromBottomRatio:         0.9,
        bubbleMaxHeight:                   104,
    },
    haruto: {
        visualBottomNudgePx:             20,
        headCenterFromBottomRatio:         0.91,
        bubbleMaxHeight:                   92,
    },
    hibiki: {
        visualBottomNudgePx:             26,
        headCenterFromBottomRatio:         0.89,
        bubbleMaxHeight:                   100,
    },
    hijiki: {
        visualBottomNudgePx:             34,
        headCenterFromBottomRatio:         0.88,
        bubbleMaxHeight:                   104,
    },
    koharu: {
        // Q 版水手帽：头占画布上半，ratio 必须高，否则三角落在胸口
        visualBottomNudgePx:             44,
        headCenterFromBottomRatio:         0.94,
        bubbleMaxHeight:                   108,
    },
    miku: {
        visualBottomNudgePx:             25,
        headCenterFromBottomRatio:         0.89,
        bubbleMaxHeight:                   104,
    },
    'ni-j': {
        visualBottomNudgePx:             22,
        headCenterFromBottomRatio:         0.89,
        bubbleMaxHeight:                   96,
    },
    nico: {
        visualBottomNudgePx:             30,
        headCenterFromBottomRatio:         0.89,
        bubbleMaxHeight:                   104,
    },
    nietzsche: {
        visualBottomNudgePx:             18,
        headCenterFromBottomRatio:         0.92,
        bubbleMaxHeight:                   92,
    },
    nipsilon: {
        visualBottomNudgePx:             33,
        headCenterFromBottomRatio:         0.88,
        bubbleMaxHeight:                   100,
    },
    nito: {
        visualBottomNudgePx:             21,
        headCenterFromBottomRatio:         0.9,
        bubbleMaxHeight:                   92,
    },
    tsumiki: {
        visualBottomNudgePx:             28,
        headCenterFromBottomRatio:         0.89,
        bubbleMaxHeight:                   100,
    },
    unitychan: {
        visualBottomNudgePx:             29,
        headCenterFromBottomRatio:         0.89,
        bubbleMaxHeight:                   104,
    },
};

// UI 视觉参数
export const UI_CONSTANTS = {
    sakuraParticleDensity: 30,
    defaultArticleCover: 'https://img.moegirl.org.cn/common/thumb/c/c1/Anime_Blog_Hero.jpg/800px-Anime_Blog_Hero.jpg',
    colors: {
        primary:   '#FF69B4',
        secondary: '#00BFFF',
    },
    live2d: {
        scriptSrc: 'https://cdn.jsdelivr.net/npm/live2d-widget@3.0.5/lib/L2Dwidget.min.js',
        /** 模型画布距视口右边的固定内边距（px） */
        rightInsetPx: 8,
        opacity: {
            default: 0.95,
            hover: 1,
        },
    },
};

/**
 * 按模型 ID 返回完整布局参数。
 * 保持模型原始比例，不拉伸、不统一宽高比。
 */
export function getLive2dModelLayout(modelId: string): Live2dModelLayout {
    const id = modelId as Live2dModelId;
    const over = LIVE2D_MODEL_LAYOUT_OVERRIDES[id];

    // 宽度按 layout.width 相对基准 2.4 缩放，避免用「高度×系数」把宽拉到接近整屏
    const layoutWidth = MODEL_LAYOUT_WIDTH[id];
    const dw =
        layoutWidth !== undefined
            ? Math.round(DEFAULT_WIDTH * (layoutWidth / 2.4))
            : DEFAULT_WIDTH;

    const displayHeight = DEFAULT_HEIGHT;
    const ratio =
        over?.headCenterFromBottomRatio ?? DEFAULT_HEAD_CENTER_FROM_BOTTOM_RATIO;
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
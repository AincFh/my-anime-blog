/**
 * 应用全局配置
 * 集中管理常量、默认值和业务参数
 */

// 认证与安全配置
export const SECURITY_CONFIG = {
    // 移除不安全的 Fallback (P1 安全修复: 强制从构建环境或 Runtime 剥离)
    csrfSecret: typeof process !== 'undefined' ? process.env.CSRF_SECRET : undefined,
    // 极盾风控等级
    turnstileLevel: 'strict',
};

export const AUTH_CONFIG = {
    // 验证码有效期（秒）
    codeExpiration: 300,
    // 临时密码有效期（秒）
    tempPasswordExpiration: 300,
    // 会话有效期（秒）- 7天
    sessionExpiration: 7 * 24 * 60 * 60,
    // 设备信息及异常记录有效期（秒）- 1天
    deviceRecordExpiration: 86400,
    // 登录失败锁定时间（秒）- 10分钟
    loginFailLockout: 600,
    // 禁止注册的临时邮箱域名
    blockedDomains: [
        'tempmail.com',
        '10minutemail.com',
        'guerrillamail.com',
        'mailinator.com'
    ],
};

// 速率限制配置
export const RATE_LIMITS = {
    // 发送验证码：1次/60秒
    SEND_CODE: {
        maxRequests: 1,
        windowSeconds: 60,
        keyPrefix: 'ratelimit:send_code',
    },
    // 发送验证码（每小时）：5次/小时
    SEND_CODE_HOUR: {
        maxRequests: 5,
        windowSeconds: 3600,
        keyPrefix: 'ratelimit:send_code_hour',
    },
    // 评论：1次/10秒
    COMMENT: {
        maxRequests: 1,
        windowSeconds: 10,
        keyPrefix: 'ratelimit:comment',
    },
    // 登录失败：5次/10分钟
    LOGIN_FAIL: {
        maxRequests: 5,
        windowSeconds: 600,
        keyPrefix: 'ratelimit:login_fail',
    },
} as const;

// 支付配置
export const PAYMENT_CONFIG = {
    // 支付回调时间戳有效期（秒）- 5分钟
    timestampValidity: 300,
    // 支付锁过期时间（秒）- 30秒
    lockDuration: 30,
};

// AI 默认配置
export const DEFAULT_AI_CONFIG = {
    enabled: true,
    features: {
        summary: true,
        search: true,
        writing: true,
        chat: true,
        recommend: true,
        moderate: true,
        seo: true,
        imageSuggest: true,
        tags: true,
        translate: true,
    },
    limits: {
        dailyTotal: 1000,
        perFeature: {
            summary: 100,
            search: 200,
            writing: 50,
            chat: 500,
            recommend: 300,
            moderate: 1000,
            seo: 100,
            imageSuggest: 50,
            tags: 100,
            translate: 100,
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
    // Meting API 基础地址
    apiBase: 'https://api.i-meto.com/meting/api',
    // 默认网易云歌单 ID (动漫原声精选)
    defaultPlaylistId: '13641046209',
    // 缓存过期时间 (秒) - 1小时
    cacheTtl: 3600,
};

// UI 视觉参数常数
export const UI_CONSTANTS = {
    // 樱花粒子默认密度
    sakuraParticleDensity: 30,
    // 默认文章封面
    defaultArticleCover: 'https://img.moegirl.org.cn/common/thumb/c/c1/Anime_Blog_Hero.jpg/800px-Anime_Blog_Hero.jpg',
    // 全局品牌色
    colors: {
        primary: '#FF69B4', // 樱花粉
        secondary: '#00BFFF', // 深空蓝
    },
    // Live2D 看板娘配置
    live2d: {
        modelPath: 'https://fastly.jsdelivr.net/npm/live2d-widget-model-pio@1.0.5/assets/pio.model.json',
        scriptSrc: 'https://fastly.jsdelivr.net/npm/live2d-widget@3.0.5/lib/L2Dwidget.min.js',
        width: 160,
        height: 320,
        opacity: {
            default: 0.95,
            hover: 1
        }
    }
};

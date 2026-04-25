/**
 * 成就数据访问层
 * 封装成就定义和用户成就进度的所有数据库操作
 * 注意：当前成就数据为代码硬编码，本 Repository 预留接口以便后续迁移到数据库
 */

import { queryFirst, queryAll, type Database } from '~/services/db.server';

export interface Achievement {
    id: string;
    name: string;
    nameZh: string;
    description: string;
    descriptionZh: string;
    icon: string;
    category: 'exploration' | 'social' | 'creation' | 'spending' | 'time';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    requirement: {
        type: string;
        count: number;
    };
    reward: {
        coins?: number;
        exp?: number;
        badge?: string;
    };
}

export interface UserAchievementRow {
    user_id: number;
    achievement_id: string;
    unlocked_at: number;
    progress: number;
}

/**
 * 预定义成就数据（可迁移至数据库）
 */
export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_login',
        name: 'First Steps',
        nameZh: '初次探索',
        description: 'Complete your profile setup',
        descriptionZh: '完成个人资料设置',
        icon: '🎯',
        category: 'exploration',
        rarity: 'common',
        requirement: { type: 'profile_complete', count: 1 },
        reward: { coins: 50, exp: 30 },
    },
    {
        id: 'first_comment',
        name: 'Voice Heard',
        nameZh: '初发声音',
        description: 'Post your first comment',
        descriptionZh: '发表第一条评论',
        icon: '💬',
        category: 'social',
        rarity: 'common',
        requirement: { type: 'comment_count', count: 1 },
        reward: { coins: 10, exp: 5 },
    },
    {
        id: 'commenter_10',
        name: 'Active Commenter',
        nameZh: '活跃评论者',
        description: 'Post 10 comments',
        descriptionZh: '累计发表 10 条评论',
        icon: '🗣️',
        category: 'social',
        rarity: 'rare',
        requirement: { type: 'comment_count', count: 10 },
        reward: { coins: 100, exp: 50 },
    },
    {
        id: 'first_like',
        name: 'Heartthrob',
        nameZh: '初获心动',
        description: 'Like an article for the first time',
        descriptionZh: '首次点赞文章',
        icon: '❤️',
        category: 'exploration',
        rarity: 'common',
        requirement: { type: 'like_count', count: 1 },
        reward: { coins: 5, exp: 3 },
    },
    {
        id: 'gacha_10',
        name: 'Lucky Draw Beginner',
        nameZh: '扭蛋萌新',
        description: 'Draw from the gacha 10 times',
        descriptionZh: '累计扭蛋 10 次',
        icon: '🎰',
        category: 'spending',
        rarity: 'common',
        requirement: { type: 'gacha_count', count: 10 },
        reward: { coins: 50, exp: 20 },
    },
    {
        id: 'gacha_100',
        name: 'Gacha Enthusiast',
        nameZh: '扭蛋爱好者',
        description: 'Draw from the gacha 100 times',
        descriptionZh: '累计扭蛋 100 次',
        icon: '🎱',
        category: 'spending',
        rarity: 'epic',
        requirement: { type: 'gacha_count', count: 100 },
        reward: { coins: 500, exp: 200, badge: 'gacha_master' },
    },
    {
        id: 'vip_member',
        name: 'Privileged Member',
        nameZh: '尊享会员',
        description: 'Become a VIP member',
        descriptionZh: '成为 VIP 会员',
        icon: '👑',
        category: 'spending',
        rarity: 'rare',
        requirement: { type: 'membership', count: 1 },
        reward: { exp: 100 },
    },
    {
        id: 'svip_member',
        name: 'Supreme Member',
        nameZh: '至臻会员',
        description: 'Become a SVIP member',
        descriptionZh: '成为 SVIP 会员',
        icon: '💎',
        category: 'spending',
        rarity: 'legendary',
        requirement: { type: 'membership_svip', count: 1 },
        reward: { coins: 1000, exp: 500, badge: 'svip_badge' },
    },
    {
        id: 'signin_7',
        name: 'Week Warrior',
        nameZh: '周战勇者',
        description: 'Sign in for 7 consecutive days',
        descriptionZh: '连续签到 7 天',
        icon: '📅',
        category: 'time',
        rarity: 'rare',
        requirement: { type: 'signin_streak', count: 7 },
        reward: { coins: 70, exp: 35 },
    },
    {
        id: 'signin_30',
        name: 'Monthly Devotion',
        nameZh: '月奉虔诚',
        description: 'Sign in for 30 consecutive days',
        descriptionZh: '连续签到 30 天',
        icon: '🌙',
        category: 'time',
        rarity: 'epic',
        requirement: { type: 'signin_streak', count: 30 },
        reward: { coins: 300, exp: 150, badge: 'monthly_devotee' },
    },
    {
        id: 'reader_10',
        name: 'Avid Reader',
        nameZh: '嗜读如命',
        description: 'Read 10 articles',
        descriptionZh: '累计阅读 10 篇文章',
        icon: '📖',
        category: 'exploration',
        rarity: 'common',
        requirement: { type: 'article_read', count: 10 },
        reward: { coins: 30, exp: 20 },
    },
    {
        id: 'first_purchase',
        name: 'First Purchase',
        nameZh: '初次消费',
        description: 'Make your first purchase in the shop',
        descriptionZh: '在商城完成首次消费',
        icon: '🛍️',
        category: 'spending',
        rarity: 'common',
        requirement: { type: 'purchase_count', count: 1 },
        reward: { coins: 20, exp: 10 },
    },
];

export const achievementRepository = {
    getAllAchievements(): Achievement[] {
        return ACHIEVEMENTS;
    },

    getAchievementById(id: string): Achievement | undefined {
        return ACHIEVEMENTS.find(a => a.id === id);
    },

    getAchievementsByCategory(category: Achievement['category']): Achievement[] {
        return ACHIEVEMENTS.filter(a => a.category === category);
    },

    getAchievementsByRarity(rarity: Achievement['rarity']): Achievement[] {
        return ACHIEVEMENTS.filter(a => a.rarity === rarity);
    },

    getRarityColor(rarity: Achievement['rarity']): string {
        const colors: Record<Achievement['rarity'], string> = {
            common: 'text-slate-500',
            rare: 'text-blue-500',
            epic: 'text-purple-500',
            legendary: 'text-amber-500',
        };
        return colors[rarity];
    },

    getRarityBgColor(rarity: Achievement['rarity']): string {
        const colors: Record<Achievement['rarity'], string> = {
            common: 'bg-slate-100 dark:bg-slate-800',
            rare: 'bg-blue-100 dark:bg-blue-900/30',
            epic: 'bg-purple-100 dark:bg-purple-900/30',
            legendary: 'bg-amber-100 dark:bg-amber-900/30',
        };
        return colors[rarity];
    },
};

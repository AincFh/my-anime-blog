-- 调整会员权益策略
-- 原则：普通功能免费开放，只有高成本或独特价值的功能才是会员专享

-- 普通用户 - 开放大部分功能
UPDATE membership_tiers SET 
    description = '免费使用全部基础功能',
    privileges = '{
        "maxAnimes": -1,
        "maxGalleryPerDay": -1,
        "aiChatPerDay": 10,
        "aiImagePerDay": 3,
        "coinMultiplier": 1,
        "adFree": false,
        "download": true,
        "hdDownload": false,
        "customTheme": true,
        "customAvatar": true,
        "exclusiveEmoji": false,
        "exclusiveEffect": false,
        "earlyAccess": false,
        "prioritySupport": false,
        "profileBadge": null,
        "commentHighlight": false,
        "uploadLimit": 10,
        "privateMessage": true,
        "exclusiveArticles": false,
        "dailySignInBonus": 5,
        "birthdayGift": false
    }'
WHERE name = 'free';

-- VIP 会员 - 去广告 + AI 增强 + 专属标识
UPDATE membership_tiers SET 
    description = '无广告体验 + AI 扩容 + 专属标识',
    privileges = '{
        "maxAnimes": -1,
        "maxGalleryPerDay": -1,
        "aiChatPerDay": 100,
        "aiImagePerDay": 30,
        "coinMultiplier": 2,
        "adFree": true,
        "download": true,
        "hdDownload": true,
        "customTheme": true,
        "customAvatar": true,
        "exclusiveEmoji": true,
        "exclusiveEffect": false,
        "earlyAccess": false,
        "prioritySupport": false,
        "profileBadge": "vip",
        "commentHighlight": true,
        "uploadLimit": 50,
        "privateMessage": true,
        "exclusiveArticles": false,
        "dailySignInBonus": 20,
        "birthdayGift": true
    }'
WHERE name = 'vip';

-- SVIP 会员 - 全部无限 + 最高优先级
UPDATE membership_tiers SET 
    description = 'AI无限 + 抢先体验 + 优先客服',
    privileges = '{
        "maxAnimes": -1,
        "maxGalleryPerDay": -1,
        "aiChatPerDay": -1,
        "aiImagePerDay": -1,
        "coinMultiplier": 3,
        "adFree": true,
        "download": true,
        "hdDownload": true,
        "customTheme": true,
        "customAvatar": true,
        "exclusiveEmoji": true,
        "exclusiveEffect": true,
        "earlyAccess": true,
        "prioritySupport": true,
        "profileBadge": "svip",
        "commentHighlight": true,
        "uploadLimit": -1,
        "privateMessage": true,
        "exclusiveArticles": true,
        "dailySignInBonus": 50,
        "birthdayGift": true,
        "betaFeatures": true,
        "apiAccess": true
    }'
WHERE name = 'svip';

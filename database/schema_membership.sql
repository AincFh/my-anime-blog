-- ================================================
-- 会员系统数据库表
-- ================================================

-- 1. 会员等级表
DROP TABLE IF EXISTS membership_tiers;
CREATE TABLE membership_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,              -- 'free', 'vip', 'svip'
    display_name TEXT NOT NULL,             -- '普通会员', 'VIP会员', 'SVIP会员'
    description TEXT,                       -- 等级描述
    price_monthly INTEGER DEFAULT 0,        -- 月费（分）
    price_quarterly INTEGER DEFAULT 0,      -- 季费（分）
    price_yearly INTEGER DEFAULT 0,         -- 年费（分）
    privileges TEXT,                        -- JSON: 权限配置
    badge_url TEXT,                         -- 徽章图片
    badge_color TEXT,                       -- 徽章颜色
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (unixepoch())
);

-- 2. 用户订阅表
DROP TABLE IF EXISTS subscriptions;
CREATE TABLE subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tier_id INTEGER NOT NULL,
    period TEXT CHECK(period IN ('monthly', 'quarterly', 'yearly')),
    status TEXT CHECK(status IN ('active', 'expired', 'cancelled', 'pending')) DEFAULT 'pending',
    start_date INTEGER,
    end_date INTEGER,
    auto_renew INTEGER DEFAULT 1,
    next_notify_at INTEGER,                 -- 续费提醒时间
    cancelled_at INTEGER,                   -- 取消时间
    cancel_reason TEXT,                     -- 取消原因
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tier_id) REFERENCES membership_tiers(id)
);

-- 3. 支付订单表
DROP TABLE IF EXISTS payment_orders;
CREATE TABLE payment_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,          -- 订单号 (格式: ORD + 时间戳 + 随机)
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,                -- 金额（分）
    currency TEXT DEFAULT 'CNY',
    payment_method TEXT,                    -- 'wechat', 'alipay', 'paypal', 'mock'
    payment_channel TEXT,                   -- 具体渠道
    status TEXT CHECK(status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled', 'expired')) DEFAULT 'pending',
    product_type TEXT,                      -- 'subscription', 'coins', 'shop_item'
    product_id TEXT,                        -- 关联的商品/订阅ID
    product_name TEXT,                      -- 商品名称
    trade_no TEXT,                          -- 第三方交易号
    nonce TEXT,                             -- 防重放随机串
    sign TEXT,                              -- 签名
    client_ip TEXT,                         -- 客户端IP
    user_agent TEXT,                        -- 用户代理
    paid_at INTEGER,
    expires_at INTEGER,                     -- 订单过期时间
    refund_amount INTEGER,                  -- 退款金额
    refund_at INTEGER,                      -- 退款时间
    metadata TEXT,                          -- JSON: 额外信息
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 4. 积分交易记录表
DROP TABLE IF EXISTS coin_transactions;
CREATE TABLE coin_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,                -- 正数=获得，负数=消费
    type TEXT CHECK(type IN ('earn', 'spend', 'gift', 'refund', 'expire')),
    source TEXT,                            -- 'daily_login', 'purchase', 'shop', 'activity', 'admin'
    reference_type TEXT,                    -- 关联类型
    reference_id TEXT,                      -- 关联ID
    balance_before INTEGER,                 -- 交易前余额
    balance_after INTEGER,                  -- 交易后余额
    description TEXT,
    operator_id INTEGER,                    -- 操作人（管理员操作时）
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. 积分商城商品表
DROP TABLE IF EXISTS shop_items;
CREATE TABLE shop_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT,                              -- 'avatar_frame', 'badge', 'theme', 'emoji', 'coupon'
    price_coins INTEGER NOT NULL,           -- 积分价格
    original_price INTEGER,                 -- 原价（用于显示折扣）
    stock INTEGER DEFAULT -1,               -- -1 表示无限
    sold_count INTEGER DEFAULT 0,
    image_url TEXT,
    preview_url TEXT,                       -- 预览图
    data TEXT,                              -- JSON: 商品数据（如主题配置）
    tier_required TEXT,                     -- 最低会员等级要求
    is_active INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0,          -- 推荐商品
    sort_order INTEGER DEFAULT 0,
    start_time INTEGER,                     -- 上架时间
    end_time INTEGER,                       -- 下架时间
    created_at INTEGER DEFAULT (unixepoch())
);

-- 6. 用户购买记录表
DROP TABLE IF EXISTS user_purchases;
CREATE TABLE user_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    transaction_id INTEGER,                 -- 关联积分交易
    purchased_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES shop_items(id),
    FOREIGN KEY (transaction_id) REFERENCES coin_transactions(id)
);

-- 7. 登录历史表
DROP TABLE IF EXISTS login_history;
CREATE TABLE login_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT,                       -- 'desktop', 'mobile', 'tablet'
    browser TEXT,
    os TEXT,
    location TEXT,                          -- 地理位置（可选）
    status TEXT CHECK(status IN ('success', 'failed', '2fa_required', 'blocked')),
    fail_reason TEXT,                       -- 失败原因
    session_token TEXT,                     -- 关联会话
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. 审计日志表
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,                   -- 'login', 'logout', 'payment', 'subscription', 'settings_change'
    target_type TEXT,                       -- 'user', 'order', 'subscription'
    target_id TEXT,
    old_value TEXT,                         -- JSON: 修改前
    new_value TEXT,                         -- JSON: 修改后
    ip_address TEXT,
    user_agent TEXT,
    risk_level TEXT DEFAULT 'low',          -- 'low', 'medium', 'high'
    metadata TEXT,                          -- JSON: 额外信息
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ================================================
-- 索引优化
-- ================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_no ON payment_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ================================================
-- 初始数据
-- ================================================

-- 会员等级初始化
INSERT INTO membership_tiers (name, display_name, description, price_monthly, price_quarterly, price_yearly, privileges, badge_color, sort_order) VALUES
('free', '普通用户', '基础功能', 0, 0, 0, 
 '{"maxAnimes":20,"maxGalleryPerDay":50,"aiChatPerDay":3,"coinMultiplier":1,"adFree":false,"download":false,"customTheme":false,"exclusiveEmoji":false,"exclusiveEffect":false,"earlyAccess":false,"prioritySupport":false}',
 NULL, 0),
('vip', 'VIP会员', '解锁更多功能', 1990, 4990, 16800,
 '{"maxAnimes":-1,"maxGalleryPerDay":-1,"aiChatPerDay":50,"coinMultiplier":1.5,"adFree":true,"download":true,"customTheme":true,"exclusiveEmoji":true,"exclusiveEffect":false,"earlyAccess":false,"prioritySupport":false,"badge":"vip"}',
 '#FFD700', 1),
('svip', 'SVIP会员', '尊享全部特权', 3990, 9990, 29900,
 '{"maxAnimes":-1,"maxGalleryPerDay":-1,"aiChatPerDay":-1,"coinMultiplier":2,"adFree":true,"download":true,"customTheme":true,"exclusiveEmoji":true,"exclusiveEffect":true,"earlyAccess":true,"prioritySupport":true,"badge":"svip"}',
 '#E5C100', 2);

-- 示例商城商品
INSERT INTO shop_items (name, description, type, price_coins, image_url, is_active, is_featured) VALUES
('金色头像框', '闪耀的金色边框', 'avatar_frame', 500, '/shop/frame-gold.png', 1, 1),
('二次元主题', '可爱的动漫风格主题', 'theme', 300, '/shop/theme-anime.png', 1, 1),
('樱花表情包', '12个樱花主题表情', 'emoji', 200, '/shop/emoji-sakura.png', 1, 0),
('VIP专属徽章', '限定VIP徽章', 'badge', 1000, '/shop/badge-vip.png', 1, 0);

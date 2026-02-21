-- ================================================
-- 退款记录表
-- ================================================

DROP TABLE IF EXISTS refunds;
CREATE TABLE refunds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    refund_no TEXT UNIQUE NOT NULL,          -- 退款单号 (格式: REF + 时间戳 + 随机)
    order_no TEXT NOT NULL,                  -- 关联订单号
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,                 -- 退款金额（分）
    reason TEXT,                             -- 退款原因
    status TEXT CHECK(status IN ('pending', 'processing', 'success', 'failed', 'rejected')) DEFAULT 'pending',
    operator_id INTEGER,                     -- 操作员 ID（管理员退款时）
    trade_refund_no TEXT,                    -- 第三方退款流水号
    
    -- 时间戳
    requested_at INTEGER DEFAULT (unixepoch()),
    processed_at INTEGER,
    completed_at INTEGER,
    
    -- 审计信息
    ip_address TEXT,
    user_agent TEXT,
    metadata TEXT,                           -- JSON: 额外信息
    
    FOREIGN KEY (order_no) REFERENCES payment_orders(order_no),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_refunds_order_no ON refunds(order_no);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_refund_no ON refunds(refund_no);

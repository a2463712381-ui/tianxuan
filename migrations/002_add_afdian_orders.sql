-- 002: 爱发电订单表 + codes 表新增字段
-- 运行方式: npx wrangler d1 execute tianxuan-codes --remote --file=migrations/002_add_afdian_orders.sql

-- 爱发电订单记录表
CREATE TABLE IF NOT EXISTS afdian_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  out_trade_no TEXT UNIQUE NOT NULL,          -- 爱发电订单号
  plan_id TEXT NOT NULL,                       -- 爱发电方案 ID
  tier TEXT NOT NULL CHECK(tier IN ('single','double')),
  total_amount TEXT DEFAULT '0.00',            -- 实付金额
  afdian_user_id TEXT DEFAULT '',              -- 爱发电买家 user_id
  code_plain TEXT DEFAULT '',                  -- 生成的兑换码明文（仅短暂存储供前端取用）
  device_id TEXT DEFAULT '',                   -- 购买时前端传来的 deviceId
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','delivered','failed')),
  created_at TEXT DEFAULT (datetime('now')),
  delivered_at TEXT DEFAULT NULL
);

-- codes 表新增 order_id 字段，关联爱发电订单
ALTER TABLE codes ADD COLUMN order_id TEXT DEFAULT '';

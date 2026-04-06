/**
 * POST /api/afdian-webhook
 *
 * 接收爱发电 Webhook 订单回调。
 * 流程：验签 → 判断 plan_id → 自动生成兑换码 → 写入 D1 → 返回 {ec: 200}
 *
 * 环境变量：
 *   AFDIAN_TOKEN   — 爱发电 API Token
 *   AFDIAN_USER_ID — 爱发电创作者 user_id
 */

/* ========== 常量：plan_id → tier 映射 ========== */
const PLAN_TIER_MAP = {
  "930c9f5e317511f1a81052540025c377": "single",  // 个人深度报告 ¥1.99
  "b924250e317511f1a4505254001e7c00": "double",  // 双人深度报告 ¥2.99
};

/* ========== 工具函数 ========== */

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** 生成随机兑换码：TX-XXXX-XXXX-XXXX */
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 去掉 I/O/0/1 避免混淆
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `TX-${seg()}-${seg()}-${seg()}`;
}

/** SHA-256 哈希 */
async function hashCode(code) {
  const data = new TextEncoder().encode(code);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** MD5 签名（用于爱发电验签） */
async function md5(str) {
  const data = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("MD5", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ========== 主处理函数 ========== */

export async function onRequestPost(context) {
  const { env } = context;
  const db = env.DB;
  const token = env.AFDIAN_TOKEN;

  let payload;
  try {
    payload = await context.request.json();
  } catch {
    return json({ ec: 200, em: "" }); // 解析失败也返回 200，避免爱发电重试
  }

  // 基本结构校验
  if (!payload?.data?.order) {
    return json({ ec: 200, em: "" });
  }

  const order = payload.data.order;
  const outTradeNo = order.out_trade_no;
  const planId = order.plan_id;
  const totalAmount = order.total_amount || "0.00";
  const afdianUserId = order.user_id || "";
  const orderStatus = order.status;

  // 只处理交易成功的订单（status = 2）
  if (orderStatus !== 2) {
    return json({ ec: 200, em: "" });
  }

  // 判断 tier
  const tier = PLAN_TIER_MAP[planId];
  if (!tier) {
    // 未知方案，忽略
    console.log(`[afdian-webhook] Unknown plan_id: ${planId}, order: ${outTradeNo}`);
    return json({ ec: 200, em: "" });
  }

  // 幂等：检查是否已经处理过这个订单
  const existing = await db
    .prepare("SELECT id FROM afdian_orders WHERE out_trade_no = ?")
    .bind(outTradeNo)
    .first();

  if (existing) {
    // 已处理过，直接返回成功
    return json({ ec: 200, em: "" });
  }

  // 生成兑换码
  const codePlain = generateCode();
  const codeHash = await hashCode(codePlain);
  const now = new Date().toISOString();

  // 事务：同时写入 codes 表和 afdian_orders 表
  try {
    // 1. 写入 codes 表
    await db
      .prepare(
        "INSERT INTO codes (code_hash, tier, status, order_id) VALUES (?, ?, 'active', ?)"
      )
      .bind(codeHash, tier, outTradeNo)
      .run();

    // 2. 写入 afdian_orders 表
    await db
      .prepare(
        "INSERT INTO afdian_orders (out_trade_no, plan_id, tier, total_amount, afdian_user_id, code_plain, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)"
      )
      .bind(outTradeNo, planId, tier, totalAmount, afdianUserId, codePlain, now)
      .run();

    console.log(`[afdian-webhook] Order ${outTradeNo} → code generated (${tier})`);
  } catch (err) {
    console.error(`[afdian-webhook] DB error for order ${outTradeNo}:`, err);
    // 即使失败也返回 200，避免爱发电无限重试
  }

  return json({ ec: 200, em: "" });
}

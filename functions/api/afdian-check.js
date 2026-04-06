/**
 * GET /api/afdian-check?deviceId=xxx&tier=single&since=1712345678
 *
 * 前端轮询接口：用户付款后，前端每 3 秒调一次。
 * 查找 since 时间戳之后、指定 tier、尚未领取的爱发电订单。
 * 找到后自动将兑换码绑定到该 deviceId，返回解锁结果。
 *
 * 响应：
 *   { found: false }                          — 还没收到订单
 *   { found: true, level: "single"|"double" } — 已自动解锁
 */

/* ========== SHA-256 ========== */
async function hashCode(code) {
  const data = new TextEncoder().encode(code);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  const db = env.DB;

  const url = new URL(context.request.url);
  const deviceId = url.searchParams.get("deviceId");
  const tier = url.searchParams.get("tier"); // "single" or "double"
  const sinceTs = url.searchParams.get("since"); // Unix 秒级时间戳

  if (!deviceId || !tier || !sinceTs) {
    return json({ found: false });
  }

  // 将 Unix 时间戳转为 ISO 字符串
  const sinceDate = new Date(parseInt(sinceTs, 10) * 1000).toISOString();

  // 查找符合条件的最新未领取订单
  // tier 匹配规则：如果用户要 single，则 single/double 都可以；如果要 double，只能 double
  const tierCondition =
    tier === "single"
      ? "tier IN ('single', 'double')"
      : "tier = 'double'";

  const order = await db
    .prepare(
      `SELECT id, out_trade_no, code_plain, tier
       FROM afdian_orders
       WHERE status = 'pending'
         AND created_at >= ?
         AND ${tierCondition}
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .bind(sinceDate)
    .first();

  if (!order || !order.code_plain) {
    return json({ found: false });
  }

  // 找到了！自动将兑换码绑定到这个设备
  const codeHash = await hashCode(order.code_plain);
  const now = new Date().toISOString();

  try {
    // 1. 更新 codes 表：标记为已使用，绑定设备
    await db
      .prepare(
        "UPDATE codes SET status = 'used', used_at = ?, used_by_device = ? WHERE code_hash = ? AND status = 'active'"
      )
      .bind(now, deviceId, codeHash)
      .run();

    // 2. 更新 afdian_orders 表：标记为已发货
    await db
      .prepare(
        "UPDATE afdian_orders SET status = 'delivered', device_id = ?, delivered_at = ?, code_plain = '' WHERE id = ?"
      )
      .bind(deviceId, now, order.id)
      .run();

    return json({ found: true, level: order.tier });
  } catch (err) {
    console.error("[afdian-check] Error delivering code:", err);
    return json({ found: false });
  }
}

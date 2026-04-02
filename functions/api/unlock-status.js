/**
 * GET /api/unlock-status?deviceId=xxx
 *
 * 查询该设备的解锁状态。
 * 响应体：{ single: boolean, double: boolean }
 */

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

  if (!deviceId) {
    return json({ single: false, double: false });
  }

  // 查该设备兑换过的所有码的 tier
  const { results } = await db
    .prepare(
      "SELECT DISTINCT tier FROM codes WHERE used_by_device = ? AND status = 'used'"
    )
    .bind(deviceId)
    .all();

  const tiers = new Set(results.map((r) => r.tier));

  const hasDouble = tiers.has("double");
  const hasSingle = tiers.has("single") || hasDouble; // double 包含 single

  return json({ single: hasSingle, double: hasDouble });
}

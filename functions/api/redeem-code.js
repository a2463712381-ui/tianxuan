/**
 * POST /api/redeem-code
 *
 * 请求体：{ code: string, deviceId: string, expectedTier?: "single" | "double" }
 * 响应体：{ level: "single" | "double" | false, error: "" | "invalid" | "used" | "expired" | "disabled" | "wrong_tier" | "network" }
 */

/* ========== 输入标准化（与前端 normalizeCode 保持一致） ========== */
function normalizeCode(raw) {
  return raw
    .replace(/[\s\u3000]+/g, "")
    .replace(/[\uff01-\uff5e]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    )
    .replace(/[—–～]/g, "-")
    .toUpperCase();
}

/* ========== SHA-256 哈希 ========== */
async function hashCode(code) {
  const data = new TextEncoder().encode(code);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ========== JSON 响应工具 ========== */
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/* ========== 主处理函数 ========== */
export async function onRequestPost(context) {
  const { env } = context;
  const db = env.DB;

  // 解析请求体
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ level: false, error: "invalid" }, 400);
  }

  const { code, deviceId, expectedTier } = body;

  if (!code || typeof code !== "string") {
    return json({ level: false, error: "invalid" }, 400);
  }

  // 标准化 + 哈希
  const normalized = normalizeCode(code);
  const codeHash = await hashCode(normalized);

  // 查库
  const row = await db
    .prepare("SELECT code_hash, tier, status, expires_at FROM codes WHERE code_hash = ?")
    .bind(codeHash)
    .first();

  // 码不存在
  if (!row) {
    return json({ level: false, error: "invalid" });
  }

  // 码已使用
  if (row.status === "used") {
    // 如果是同一设备重复提交，允许返回成功（幂等）
    const usedRow = await db
      .prepare("SELECT used_by_device FROM codes WHERE code_hash = ?")
      .bind(row.code_hash)
      .first();
    if (usedRow && usedRow.used_by_device === (deviceId || "")) {
      const level = row.tier;
      if (expectedTier === "double" && level === "single") {
        return json({ level: "single", error: "wrong_tier" });
      }
      return json({ level, error: "" });
    }
    return json({ level: false, error: "used" });
  }

  // 码已禁用
  if (row.status === "disabled") {
    return json({ level: false, error: "disabled" });
  }

  // 码已过期
  if (row.status === "expired") {
    return json({ level: false, error: "expired" });
  }

  if (row.expires_at) {
    const now = new Date().toISOString();
    if (now > row.expires_at) {
      // 顺便更新状态
      await db
        .prepare("UPDATE codes SET status = 'expired' WHERE code_hash = ?")
        .bind(row.code_hash)
        .run();
      return json({ level: false, error: "expired" });
    }
  }

  // 错档检测（在真正消费码之前）
  if (expectedTier === "double" && row.tier === "single") {
    return json({ level: "single", error: "wrong_tier" });
  }

  // 原子更新：只有 status='active' 才更新
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      "UPDATE codes SET status = 'used', used_at = ?, used_by_device = ? WHERE code_hash = ? AND status = 'active'"
    )
    .bind(now, deviceId || "", row.code_hash)
    .run();

  // 如果 changes = 0，说明并发竞争中被其他请求先消费了
  if (!result.meta.changes) {
    return json({ level: false, error: "used" });
  }

  const level = row.tier;

  return json({ level, error: "" });
}

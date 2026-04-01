/**
 * 兑换码验证 & 解锁状态管理（前端硬编码 MVP）
 *
 * 权限层级：free < single < double
 *   - single 码：解锁个人完整报告
 *   - double 码：解锁个人完整报告 + 全部相处指南深度版
 *
 * 修改兑换码：编辑下方 SINGLE_CODES / DOUBLE_CODES，重新 build 部署即可。
 */

const SINGLE_CODES = new Set([
  "TX-SINGLE-01",
  "TX-SINGLE-02",
]);

const DOUBLE_CODES = new Set([
  "TX-DOUBLE-01",
  "TX-DOUBLE-02",
]);

const SINGLE_KEY = "tianxuan_single_unlocked";
const DOUBLE_KEY = "tianxuan_double_unlocked";

/* ========== 读取解锁状态 ========== */

export function isSingleUnlocked() {
  try {
    return localStorage.getItem(SINGLE_KEY) === "1" || isDoubleUnlocked();
  } catch {
    return false;
  }
}

export function isDoubleUnlocked() {
  try {
    return localStorage.getItem(DOUBLE_KEY) === "1";
  } catch {
    return false;
  }
}

// Backward-compatible aliases for older premium-guide callers.
export function isPremiumUnlocked() {
  return isDoubleUnlocked();
}

/* ========== 验证码并解锁 ========== */

/**
 * 验证兑换码，返回解锁的层级
 * @param {string} input — 用户输入的兑换码
 * @returns {"single" | "double" | false}
 */
export function validateAndUnlock(input) {
  const code = input.trim().toUpperCase();

  if (DOUBLE_CODES.has(code)) {
    try {
      localStorage.setItem(DOUBLE_KEY, "1");
      localStorage.setItem(SINGLE_KEY, "1");
    } catch { /* silent */ }
    return "double";
  }

  if (SINGLE_CODES.has(code)) {
    try {
      localStorage.setItem(SINGLE_KEY, "1");
    } catch { /* silent */ }
    return "single";
  }

  return false;
}

export function validateCode(input) {
  const code = input.trim().toUpperCase();
  return DOUBLE_CODES.has(code);
}

export function markPremiumUnlocked() {
  try {
    localStorage.setItem(DOUBLE_KEY, "1");
    localStorage.setItem(SINGLE_KEY, "1");
  } catch { /* silent */ }
}

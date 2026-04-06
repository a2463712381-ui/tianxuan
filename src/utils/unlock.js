/**
 * 兑换码验证 & 解锁状态管理（服务端校验版）
 *
 * 权限层级：free < single < double
 *   - single 码：解锁个人完整报告
 *   - double 码：解锁个人完整报告 + 全部相处指南深度版
 *
 * 校验逻辑已迁移到服务端（Cloudflare Pages Functions + D1）。
 * 前端 localStorage 仅作为短期缓存，页面初始化时从服务端校正。
 */

const SINGLE_KEY = "tianxuan_single_unlocked";
const DOUBLE_KEY = "tianxuan_double_unlocked";
const DEVICE_KEY = "tianxuan_device_id";

/* ========== 设备标识 ========== */

/**
 * 获取或生成一个稳定的设备标识。
 * 存在 localStorage 中，同一浏览器同一域名下不变。
 */
export function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID
        ? crypto.randomUUID()
        : "dev-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

/* ========== 输入标准化 ========== */

/**
 * 标准化用户输入的兑换码：
 * - 去除所有空格（前后 + 中间）
 * - 全角字符转半角（Ａ→A, １→1, －→-）
 * - 中文横杠（—、–、～）转英文连字符
 * - 统一大写
 */
export function normalizeCode(raw) {
  return raw
    .replace(/[\s\u3000]+/g, "")
    .replace(/[\uff01-\uff5e]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    )
    .replace(/[—–～]/g, "-")
    .toUpperCase();
}

/* ========== 读取解锁状态（本地缓存） ========== */

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

export function isPremiumUnlocked() {
  return isDoubleUnlocked();
}

export function getUnlockTierLabel() {
  if (isDoubleUnlocked()) return "完整版（含双人）";
  if (isSingleUnlocked()) return "个人版";
  return "未解锁";
}

/* ========== 写入本地缓存 ========== */

function cacheUnlock(level) {
  try {
    if (level === "double") {
      localStorage.setItem(DOUBLE_KEY, "1");
      localStorage.setItem(SINGLE_KEY, "1");
    } else if (level === "single") {
      localStorage.setItem(SINGLE_KEY, "1");
    }
  } catch { /* silent */ }
}

/* ========== 服务端校验 ========== */

/**
 * 向服务端验证兑换码（异步）
 *
 * @param {string} input — 用户输入的兑换码
 * @param {"single" | "double"} expectedTier — 期望的层级
 * @returns {Promise<{ level: "single" | "double" | false, error: string }>}
 *
 * error 含义：
 *   ""           — 成功
 *   "invalid"    — 码不存在
 *   "used"       — 码已被其他设备使用
 *   "expired"    — 码已过期
 *   "disabled"   — 码已禁用
 *   "wrong_tier" — 码存在但层级不匹配
 *   "network"    — 网络错误
 */
export async function validateForTier(input, expectedTier) {
  const code = normalizeCode(input);
  const deviceId = getDeviceId();

  try {
    const res = await fetch("/api/redeem-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, deviceId, expectedTier }),
    });

    if (!res.ok) {
      return { level: false, error: "network" };
    }

    const data = await res.json();

    // 解锁成功 → 写入本地缓存
    if (data.level && !data.error) {
      cacheUnlock(data.level);
    }

    return data;
  } catch {
    return { level: false, error: "network" };
  }
}

/* ========== 爱发电支付轮询 ========== */

/** 爱发电商品页 URL */
const AFDIAN_URLS = {
  single: "https://afdian.com/item/930c9f5e317511f1a81052540025c377",
  double: "https://afdian.com/item/b924250e317511f1a4505254001e7c00",
};

/**
 * 打开爱发电支付页并开始轮询等待解锁。
 *
 * @param {"single"|"double"} tier — 购买的层级
 * @param {(status: {polling: boolean, found: boolean, level: string|false}) => void} onUpdate — 状态回调
 * @returns {{ stop: () => void }} — 调用 stop() 停止轮询
 */
export function startAfdianPurchase(tier, onUpdate) {
  const deviceId = getDeviceId();
  const since = Math.floor(Date.now() / 1000); // 秒级时间戳
  let stopped = false;
  let timerId = null;

  // 打开爱发电支付页
  const url = AFDIAN_URLS[tier] || AFDIAN_URLS.single;
  window.open(url, "_blank");

  onUpdate({ polling: true, found: false, level: false });

  // 轮询函数
  async function poll() {
    if (stopped) return;

    try {
      const res = await fetch(
        `/api/afdian-check?deviceId=${encodeURIComponent(deviceId)}&tier=${tier}&since=${since}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.found && data.level) {
          // 解锁成功！
          cacheUnlock(data.level);
          stopped = true;
          onUpdate({ polling: false, found: true, level: data.level });
          return;
        }
      }
    } catch {
      // 网络错误，继续轮询
    }

    if (!stopped) {
      // 5 分钟后自动停止轮询
      if (Date.now() / 1000 - since > 300) {
        stopped = true;
        onUpdate({ polling: false, found: false, level: false });
        return;
      }
      timerId = setTimeout(poll, 3000); // 每 3 秒轮询一次
    }
  }

  // 启动轮询
  timerId = setTimeout(poll, 3000);

  return {
    stop() {
      stopped = true;
      if (timerId) clearTimeout(timerId);
      onUpdate({ polling: false, found: false, level: false });
    },
  };
}

/**
 * 从服务端同步解锁状态到本地缓存。
 * 应在页面初始化时调用一次。
 *
 * @returns {Promise<{ single: boolean, double: boolean }>}
 */
export async function syncUnlockStatus() {
  const deviceId = getDeviceId();

  try {
    const res = await fetch(`/api/unlock-status?deviceId=${encodeURIComponent(deviceId)}`);

    if (!res.ok) {
      // 网络失败时不覆盖本地缓存，静默降级
      return { single: isSingleUnlocked(), double: isDoubleUnlocked() };
    }

    const data = await res.json();

    // 用服务端结果校正本地缓存
    try {
      if (data.double) {
        localStorage.setItem(DOUBLE_KEY, "1");
        localStorage.setItem(SINGLE_KEY, "1");
      } else if (data.single) {
        localStorage.setItem(SINGLE_KEY, "1");
        localStorage.removeItem(DOUBLE_KEY);
      } else {
        localStorage.removeItem(SINGLE_KEY);
        localStorage.removeItem(DOUBLE_KEY);
      }
    } catch { /* silent */ }

    return data;
  } catch {
    return { single: isSingleUnlocked(), double: isDoubleUnlocked() };
  }
}

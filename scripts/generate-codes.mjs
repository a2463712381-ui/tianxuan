/**
 * 兑换码生成脚本
 *
 * 用法：
 *   node scripts/generate-codes.mjs --tier single --count 10
 *   node scripts/generate-codes.mjs --tier double --count 5
 *   node scripts/generate-codes.mjs --tier single --count 10 --campaign test-batch-1
 *
 * 输出：
 *   1. 控制台打印明文码列表（发给用户/运营）
 *   2. 生成 INSERT SQL（复制到 Cloudflare D1 Console 执行）
 *   3. 同时写入 scripts/output/ 目录下的文件
 */

import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ========== 参数解析 ========== */
const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const tier = getArg("tier", "single");
const count = parseInt(getArg("count", "10"), 10);
const campaign = getArg("campaign", "");
const expiresAt = getArg("expires", ""); // 可选，ISO 格式如 2026-12-31T23:59:59

if (!["single", "double"].includes(tier)) {
  console.error("--tier 必须是 single 或 double");
  process.exit(1);
}
if (count < 1 || count > 1000) {
  console.error("--count 必须在 1-1000 之间");
  process.exit(1);
}

/* ========== 生码逻辑 ========== */
const PREFIX = tier === "double" ? "TXD" : "TXS";

function generateCode() {
  // 格式：TXS-XXXX-XXXX 或 TXD-XXXX-XXXX（8 位随机字母数字）
  const rand = randomBytes(4).toString("hex").toUpperCase(); // 8 chars
  return `${PREFIX}-${rand.slice(0, 4)}-${rand.slice(4, 8)}`;
}

function sha256(str) {
  return createHash("sha256").update(str).digest("hex");
}

/* ========== 生成 ========== */
const codes = [];
const hashSet = new Set();

for (let i = 0; i < count; i++) {
  let code;
  let hash;
  // 确保无碰撞
  do {
    code = generateCode();
    hash = sha256(code);
  } while (hashSet.has(hash));

  hashSet.add(hash);
  codes.push({ code, hash });
}

/* ========== 输出 ========== */
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outputDir = join(__dirname, "output");
mkdirSync(outputDir, { recursive: true });

// 1. 明文码列表
const plainList = codes.map((c) => c.code).join("\n");
console.log(`\n===== ${tier.toUpperCase()} 兑换码（${count} 个）=====\n`);
console.log(plainList);

const plainFile = join(outputDir, `codes-${tier}-${timestamp}.txt`);
writeFileSync(plainFile, plainList, "utf-8");

// 2. INSERT SQL
const expiresValue = expiresAt ? `'${expiresAt}'` : "NULL";
const campaignValue = campaign || `batch-${timestamp}`;

const sqlLines = codes.map(
  (c) =>
    `INSERT INTO codes (code_hash, tier, status, campaign, expires_at) VALUES ('${c.hash}', '${tier}', 'active', '${campaignValue}', ${expiresValue});`
);
const sqlContent = sqlLines.join("\n");

console.log(`\n===== INSERT SQL =====\n`);
console.log(sqlContent);

const sqlFile = join(outputDir, `codes-${tier}-${timestamp}.sql`);
writeFileSync(sqlFile, sqlContent, "utf-8");

console.log(`\n===== 文件已保存 =====`);
console.log(`明文码：${plainFile}`);
console.log(`SQL：${sqlFile}`);
console.log(`\n将上方 SQL 复制到 Cloudflare D1 Console 执行即可。\n`);

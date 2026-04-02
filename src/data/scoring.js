/**
 * 评分逻辑 —— v5（6 维 + 标准化 + 通用 tie-break）
 *
 * 6 个维度：
 *   CN  连接需求     → companion  朝暮相依
 *   SN  稳定需求     → steady     有常相守
 *   BS  边界需求     → boundary   知止有度
 *   AS  空间需求     → free       闲云野鹤
 *   DR  共鸣需求     → resonance  高山流水
 *   GT  信任节奏     → gentle     静水流深
 */

/* ========== 维度 → 结果 key 映射 ========== */
const RESULT_KEYS = {
  CN: "companion",
  SN: "steady",
  BS: "boundary",
  AS: "free",
  DR: "resonance",
  GT: "gentle"
};

/* ========== DIMENSION_MAP ==========
 * 每道题 4 个选项，每个选项映射一个维度。
 * 映射严格对应选项文案语义。
 *
 * 维度出现统计（运行时自动计算，此处为参考）：
 *   见 DIMENSION_MAX_SCORES
 */
const DIMENSION_MAP = [
  // ── A. 靠近与初识 ──
  { A: "CN", B: "GT", C: "BS", D: "DR" }, // Q1  (不变)
  { A: "DR", B: "SN", C: "CN", D: "AS" }, // Q2  (调序 DACB + C文案微调)
  { A: "CN", B: "GT", C: "BS", D: "DR" }, // Q3  (不变)
  { A: "DR", B: "GT", C: "SN", D: "CN" }, // Q4  (调序 DCBA + B文案改SN纯度)

  // ── B. 日常维系 ──
  { A: "CN", B: "SN", C: "GT", D: "DR" }, // Q5  (不变)
  { A: "AS", B: "SN", C: "DR", D: "CN" }, // Q6  (调序 CBDA)
  { A: "CN", B: "SN", C: "AS", D: "DR" }, // Q7  (不变)
  { A: "CN", B: "SN", C: "BS", D: "DR" }, // Q8  (不变)

  // ── C. 不适与边界 ──
  { A: "BS", B: "AS", C: "CN", D: "DR" }, // Q9  (调序 BADC)
  { A: "SN", B: "BS", C: "AS", D: "DR" }, // Q10 (不变)
  { A: "CN", B: "SN", C: "AS", D: "DR" }, // Q11 (不变)
  { A: "BS", B: "GT", C: "CN", D: "DR" }, // Q12 (调序 CDAB + B文案改GT纯度)

  // ── D. 信任与判断 ──
  { A: "CN", B: "SN", C: "GT", D: "DR" }, // Q13 (不变)
  { A: "CN", B: "BS", C: "AS", D: "DR" }, // Q14 (不变)
  { A: "GT", B: "DR", C: "CN", D: "SN" }, // Q15 (调序 CDAB)
  { A: "CN", B: "SN", C: "BS", D: "DR" }, // Q16 (不变)

  // ── E. 修复与深化 ──
  { A: "DR", B: "GT", C: "CN", D: "SN" }, // Q17 (调序 DCAB)
  { A: "CN", B: "SN", C: "BS", D: "AS" }, // Q18 (不变)
  { A: "CN", B: "GT", C: "BS", D: "DR" }, // Q19 (不变)
  { A: "CN", B: "SN", C: "AS", D: "DR" }, // Q20 (不变)
];

/* ========== 区分度题组 ==========
 * 每个维度选 4 道"最能体现该维度独特行为"的题。
 * 用于近分 tie-break：在这些题上选了该维度的次数 = 区分度强度。
 *
 * 选题标准：该题中该维度的选项语义纯度高，不串其他维度。
 * 括号内标注该维度在该题的选项位置。
 */
const DISCRIMINATOR_QUESTIONS = {
  CN: [1, 8, 11, 14],   // Q1A 主动靠近开心 / Q8A 对方先开口 / Q11A 心虚补偿 / Q14A 怕被忽视
  SN: [5, 10, 13, 16],  // Q5B 不联系也踏实 / Q10A 消失不交代 / Q13B 始终如一 / Q16B 考验后还在
  BS: [9, 12, 16, 18],  // Q9A 提前说好时长 / Q12A 边界被踩 / Q16C 尊重雷区 / Q18C 应该先问我
  AS: [6, 7, 11, 14],   // Q6A 喘不过气 / Q7C 各忙各的 / Q11C 催了更不想回 / Q14C 被捆绑
  DR: [3, 7, 10, 13],   // Q3D 内容有深度就投入 / Q7D 走心长谈 / Q10D 永远聊琐事 / Q13D 聊过真正重要的事
  GT: [1, 4, 12, 17],   // Q1B 先观察 / Q4B 还没想好要不要推进 / Q12B 还没到那份上 / Q17B 消化情绪再面对
};

/* ========== 每个维度在 DIMENSION_MAP 中的出现次数 ========== */
function getDimensionMaxScores() {
  const maxes = { CN: 0, SN: 0, BS: 0, AS: 0, DR: 0, GT: 0 };
  DIMENSION_MAP.forEach(mapping => {
    Object.values(mapping).forEach(dim => {
      if (dim in maxes) maxes[dim]++;
    });
  });
  return maxes;
}

const DIMENSION_MAX_SCORES = getDimensionMaxScores();

/* ========== 基础计分 ========== */
function createEmptyScores() {
  return { CN: 0, SN: 0, BS: 0, AS: 0, DR: 0, GT: 0 };
}

function calculateDimensionScores(answers) {
  return answers.reduce((scores, answer, index) => {
    const dimension = DIMENSION_MAP[index]?.[answer];
    if (dimension && dimension in scores) {
      scores[dimension] += 1;
    }
    return scores;
  }, createEmptyScores());
}

/* ========== 标准化分（百分比） ========== */
function normalizeScores(rawScores) {
  const normalized = {};
  for (const [dim, raw] of Object.entries(rawScores)) {
    const max = DIMENSION_MAX_SCORES[dim] || 1;
    normalized[dim] = Math.round((raw / max) * 100);
  }
  return normalized;
}

/* ========== tie-break：区分度题组强度 ========== */
function getDiscriminatorStrength(answers, dimension) {
  const questions = DISCRIMINATOR_QUESTIONS[dimension];
  if (!questions) return 0;
  return questions.reduce((count, qNum) => {
    const answer = answers[qNum - 1]; // 0-based
    const mapped = DIMENSION_MAP[qNum - 1]?.[answer];
    return count + (mapped === dimension ? 1 : 0);
  }, 0);
}

function resolveTie(answers, rawScores, dimA, dimB) {
  // 第 1 层：区分度题组强度
  const strengthA = getDiscriminatorStrength(answers, dimA);
  const strengthB = getDiscriminatorStrength(answers, dimB);

  if (strengthA !== strengthB) {
    return strengthA > strengthB
      ? { primary: dimA, secondary: dimB }
      : { primary: dimB, secondary: dimA };
  }

  // 第 2 层：原始 raw score（未标准化）
  if (rawScores[dimA] !== rawScores[dimB]) {
    return rawScores[dimA] > rawScores[dimB]
      ? { primary: dimA, secondary: dimB }
      : { primary: dimB, secondary: dimA };
  }

  // 第 3 层：仍然平手 → 保持标准化分排序
  return { primary: dimA, secondary: dimB };
}

/* ========== 主判定函数 ========== */
export function determineResult(answers) {
  const rawScores = calculateDimensionScores(answers);
  const normScores = normalizeScores(rawScores);

  // 按标准化分降序排列
  const sorted = Object.entries(normScores)
    .sort((a, b) => b[1] - a[1]);

  const [primaryDim, primaryScore] = sorted[0];
  const [secondaryDim, secondaryScore] = sorted[1];

  // 置信度判定
  const gap = primaryScore - secondaryScore;
  let confidence;
  if (gap >= 15) {
    confidence = "high";
  } else if (gap >= 5) {
    confidence = "moderate";
  } else {
    confidence = "close";
  }

  let finalPrimary = primaryDim;
  let finalSecondary = secondaryDim;

  // 近分时用区分度题组做 tie-break
  if (confidence === "close") {
    const resolved = resolveTie(answers, rawScores, primaryDim, secondaryDim);
    finalPrimary = resolved.primary;
    finalSecondary = resolved.secondary;
  }

  return {
    resultKey: RESULT_KEYS[finalPrimary],
    secondaryKey: RESULT_KEYS[finalSecondary],
    scores: rawScores,
    normalizedScores: normScores,
    sorted: sorted.map(([dim]) => dim),
    confidence
  };
}

/* ========== 导出给外部组件使用 ========== */
export { DIMENSION_MAX_SCORES };

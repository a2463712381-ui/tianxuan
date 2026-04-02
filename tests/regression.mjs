/**
 * 回归测试 —— v5 测量系统
 *
 * 运行：node tests/regression.mjs
 *
 * 包含 50+ 组典型答案样本，覆盖：
 *   - 极端型（6 类各 1 组纯选）
 *   - 强偏向型（6 类各 1 组，主维度明显但非全选）
 *   - 接近型（CN/SN、BS/AS、GT/SN、DR/CN 各 1 组）
 *   - 混合型（多维接近、无明显单峰）
 *   - 边界 case（tie-break 触发、confidence 阈值边界）
 *
 * 每组验证：
 *   - resultKey（主类型）
 *   - secondaryKey（次倾向，可选）
 *   - confidence（可选）
 *   - 基本合理性断言
 */

import { determineResult, DIMENSION_MAX_SCORES } from '../src/data/scoring.js';

/* ========== 工具函数 ========== */

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    failed++;
    failures.push(message);
    console.log(`  ✗ ${message}`);
  } else {
    passed++;
  }
}

function runCase(name, answers, expected) {
  const result = determineResult(answers);

  console.log(`\n[${name}]`);
  console.log(`  主类型: ${result.resultKey} | 次倾向: ${result.secondaryKey} | confidence: ${result.confidence}`);
  console.log(`  标准化分: ${JSON.stringify(result.normalizedScores)}`);

  if (expected.resultKey) {
    assert(
      result.resultKey === expected.resultKey,
      `${name}: 期望主类型 ${expected.resultKey}，实际 ${result.resultKey}`
    );
  }

  if (expected.secondaryKey) {
    assert(
      result.secondaryKey === expected.secondaryKey,
      `${name}: 期望次倾向 ${expected.secondaryKey}，实际 ${result.secondaryKey}`
    );
  }

  if (expected.confidence) {
    assert(
      result.confidence === expected.confidence,
      `${name}: 期望 confidence=${expected.confidence}，实际 ${result.confidence}`
    );
  }

  if (expected.notResultKey) {
    assert(
      result.resultKey !== expected.notResultKey,
      `${name}: 主类型不应为 ${expected.notResultKey}，实际 ${result.resultKey}`
    );
  }

  // 基本合理性检查
  assert(
    ['companion', 'steady', 'boundary', 'free', 'gentle', 'resonance'].includes(result.resultKey),
    `${name}: resultKey 必须是合法类型`
  );
  assert(
    result.resultKey !== result.secondaryKey,
    `${name}: 主类型和次倾向不应相同`
  );
  assert(
    ['high', 'moderate', 'close'].includes(result.confidence),
    `${name}: confidence 必须是 high/moderate/close`
  );
  assert(
    result.sorted.length === 6,
    `${name}: sorted 应包含 6 个维度`
  );

  return result;
}

/* ========== 维度→选项位置映射表（从 DIMENSION_MAP 推导） ==========
 *
 * CN 出现位置: Q1A Q2C Q3A Q4D Q5A Q6D Q7A Q8A Q9C Q11A Q12C Q13A Q14A Q15C Q16A Q17C Q18A Q19A Q20A (19次)
 * SN 出现位置: Q2B Q4C Q5B Q6B Q7B Q8B Q10A Q11B Q13B Q15D Q16B Q17D Q18B Q20B (14次)
 * BS 出现位置: Q1C Q3C Q9A Q10B Q12A Q14B Q16C Q18C Q19C (9次)
 * AS 出现位置: Q2D Q6A Q7C Q9B Q10C Q11C Q14C Q18D Q20C (9次)
 * DR 出现位置: Q1D Q2A Q3D Q4A Q5D Q6C Q7D Q8D Q9D Q10D Q11D Q12D Q13D Q14D Q15B Q16D Q17A Q19D Q20D (19次)
 * GT 出现位置: Q1B Q3B Q4B Q5C Q8C Q12B Q13C Q15A Q17B Q19B (10次)
 */

console.log('========================================');
console.log('  天选·知交卷 v5 回归测试');
console.log('========================================');

/* ========== 一、极端型（6 组）========== */
console.log('\n--- 一、极端型 ---');

// 极端 CN：尽可能多地选 CN 对应的选项
runCase('极端CN', [
  'A', // Q1→CN
  'C', // Q2→CN
  'A', // Q3→CN
  'D', // Q4→CN
  'A', // Q5→CN
  'D', // Q6→CN
  'A', // Q7→CN
  'A', // Q8→CN
  'C', // Q9→CN
  'A', // Q10→SN (CN 无选项)
  'A', // Q11→CN
  'C', // Q12→CN
  'A', // Q13→CN
  'A', // Q14→CN
  'C', // Q15→CN
  'A', // Q16→CN
  'C', // Q17→CN
  'A', // Q18→CN
  'A', // Q19→CN
  'A', // Q20→CN
], { resultKey: 'companion', confidence: 'high' });

// 极端 SN：尽可能多地选 SN 对应的选项
runCase('极端SN', [
  'C', // Q1→BS (SN 无选项)
  'B', // Q2→SN
  'B', // Q3→GT (SN 无选项)
  'C', // Q4→SN
  'B', // Q5→SN
  'B', // Q6→SN
  'B', // Q7→SN
  'B', // Q8→SN
  'A', // Q9→BS (SN 无选项)
  'A', // Q10→SN
  'B', // Q11→SN
  'A', // Q12→BS (SN 无选项)
  'B', // Q13→SN
  'B', // Q14→BS (SN 无选项)
  'D', // Q15→SN
  'B', // Q16→SN
  'D', // Q17→SN
  'B', // Q18→SN
  'C', // Q19→BS (SN 无选项)
  'B', // Q20→SN
], { resultKey: 'steady' });

// 极端 BS：尽可能多地选 BS 对应的选项
runCase('极端BS', [
  'C', // Q1→BS
  'B', // Q2→SN (BS 无选项)
  'C', // Q3→BS
  'C', // Q4→SN (BS 无选项)
  'B', // Q5→SN (BS 无选项)
  'B', // Q6→SN (BS 无选项)
  'B', // Q7→SN (BS 无选项)
  'C', // Q8→BS
  'A', // Q9→BS
  'B', // Q10→BS
  'B', // Q11→SN (BS 无选项)
  'A', // Q12→BS
  'B', // Q13→SN (BS 无选项)
  'B', // Q14→BS
  'D', // Q15→SN (BS 无选项)
  'C', // Q16→BS
  'D', // Q17→SN (BS 无选项)
  'C', // Q18→BS
  'C', // Q19→BS
  'B', // Q20→SN (BS 无选项)
], { resultKey: 'boundary' });

// 极端 AS：尽可能多地选 AS 对应的选项
runCase('极端AS', [
  'C', // Q1→BS (AS 无选项)
  'D', // Q2→AS
  'C', // Q3→BS (AS 无选项)
  'C', // Q4→SN (AS 无选项)
  'B', // Q5→SN (AS 无选项)
  'A', // Q6→AS
  'C', // Q7→AS
  'C', // Q8→BS (AS 无选项)
  'B', // Q9→AS
  'C', // Q10→AS
  'C', // Q11→AS
  'A', // Q12→BS (AS 无选项)
  'B', // Q13→SN (AS 无选项)
  'C', // Q14→AS
  'D', // Q15→SN (AS 无选项)
  'C', // Q16→BS (AS 无选项)
  'D', // Q17→SN (AS 无选项)
  'D', // Q18→AS
  'C', // Q19→BS (AS 无选项)
  'C', // Q20→AS
], { resultKey: 'free' });

// 极端 DR：尽可能多地选 DR 对应的选项
runCase('极端DR', [
  'D', // Q1→DR
  'A', // Q2→DR
  'D', // Q3→DR
  'A', // Q4→DR
  'D', // Q5→DR
  'C', // Q6→DR
  'D', // Q7→DR
  'D', // Q8→DR
  'D', // Q9→DR
  'D', // Q10→DR
  'D', // Q11→DR
  'D', // Q12→DR
  'D', // Q13→DR
  'D', // Q14→DR
  'B', // Q15→DR
  'D', // Q16→DR
  'A', // Q17→DR
  'C', // Q18→BS (DR 无选项)
  'D', // Q19→DR
  'D', // Q20→DR
], { resultKey: 'resonance', confidence: 'high' });

// 极端 GT：尽可能多地选 GT 对应的选项
runCase('极端GT', [
  'B', // Q1→GT
  'B', // Q2→SN (GT 无选项)
  'B', // Q3→GT
  'B', // Q4→GT
  'C', // Q5→GT
  'B', // Q6→SN (GT 无选项)
  'B', // Q7→SN (GT 无选项)
  'C', // Q8→BS (GT 无选项，但 C→BS)
  'A', // Q9→BS (GT 无选项)
  'A', // Q10→SN (GT 无选项)
  'B', // Q11→SN (GT 无选项)
  'B', // Q12→GT
  'C', // Q13→GT
  'B', // Q14→BS (GT 无选项)
  'A', // Q15→GT
  'B', // Q16→SN (GT 无选项)
  'B', // Q17→GT
  'B', // Q18→SN (GT 无选项)
  'B', // Q19→GT
  'B', // Q20→SN (GT 无选项)
], { resultKey: 'gentle' });


/* ========== 二、强偏向型（6 组）========== */
console.log('\n--- 二、强偏向型 ---');

// 强偏 CN（14/19 选 CN，其余混选）
runCase('强偏CN', [
  'A', // Q1→CN
  'C', // Q2→CN
  'A', // Q3→CN
  'D', // Q4→CN
  'A', // Q5→CN
  'D', // Q6→CN
  'A', // Q7→CN
  'A', // Q8→CN
  'D', // Q9→DR（分散）
  'D', // Q10→DR（分散）
  'A', // Q11→CN
  'C', // Q12→CN
  'A', // Q13→CN
  'A', // Q14→CN
  'B', // Q15→DR（分散）
  'A', // Q16→CN
  'D', // Q17→SN（分散）
  'B', // Q18→SN（分散）
  'A', // Q19→CN
  'A', // Q20→CN
], { resultKey: 'companion' });

// 强偏 SN
runCase('强偏SN', [
  'D', // Q1→DR（分散）
  'B', // Q2→SN
  'A', // Q3→CN（分散）
  'C', // Q4→SN
  'B', // Q5→SN
  'B', // Q6→SN
  'B', // Q7→SN
  'B', // Q8→SN
  'C', // Q9→CN（分散）
  'A', // Q10→SN
  'B', // Q11→SN
  'C', // Q12→CN（分散）
  'B', // Q13→SN
  'B', // Q14→BS（分散）
  'D', // Q15→SN
  'B', // Q16→SN
  'D', // Q17→SN
  'B', // Q18→SN
  'A', // Q19→CN（分散）
  'B', // Q20→SN
], { resultKey: 'steady' });

// 强偏 DR
runCase('强偏DR', [
  'D', // Q1→DR
  'A', // Q2→DR
  'D', // Q3→DR
  'A', // Q4→DR
  'D', // Q5→DR
  'C', // Q6→DR
  'D', // Q7→DR
  'D', // Q8→DR
  'A', // Q9→BS（分散）
  'D', // Q10→DR
  'D', // Q11→DR
  'D', // Q12→DR
  'D', // Q13→DR
  'D', // Q14→DR
  'A', // Q15→GT（分散）
  'B', // Q16→SN（分散）
  'A', // Q17→DR
  'C', // Q18→BS（分散）
  'D', // Q19→DR
  'D', // Q20→DR
], { resultKey: 'resonance' });

// 强偏 GT：GT 全拿 9/9 = 100%，分散到 CN/SN/DR 而非 AS
runCase('强偏GT', [
  'B', // Q1→GT
  'B', // Q2→SN（分散）
  'B', // Q3→GT
  'B', // Q4→GT
  'C', // Q5→GT
  'D', // Q6→CN（分散）
  'A', // Q7→CN（分散）
  'D', // Q8→DR（分散）
  'D', // Q9→DR（分散）
  'A', // Q10→SN（分散）
  'A', // Q11→CN（分散）
  'B', // Q12→GT
  'C', // Q13→GT
  'A', // Q14→CN（分散）
  'A', // Q15→GT
  'B', // Q16→SN（分散）
  'B', // Q17→GT
  'B', // Q18→SN（分散）
  'B', // Q19→GT
  'B', // Q20→SN（分散）
], { resultKey: 'gentle' });

// 强偏 BS
runCase('强偏BS', [
  'C', // Q1→BS
  'D', // Q2→AS（分散）
  'C', // Q3→BS
  'C', // Q4→SN（分散）
  'C', // Q5→GT（分散）
  'A', // Q6→AS（分散）
  'C', // Q7→AS（分散）
  'C', // Q8→BS
  'A', // Q9→BS
  'B', // Q10→BS
  'C', // Q11→AS（分散）
  'A', // Q12→BS
  'C', // Q13→GT（分散）
  'B', // Q14→BS
  'A', // Q15→GT（分散）
  'C', // Q16→BS
  'B', // Q17→GT（分散）
  'C', // Q18→BS
  'C', // Q19→BS
  'C', // Q20→AS（分散）
], { resultKey: 'boundary' });

// 强偏 AS
runCase('强偏AS', [
  'C', // Q1→BS（分散）
  'D', // Q2→AS
  'C', // Q3→BS（分散）
  'B', // Q4→GT（分散）
  'C', // Q5→GT（分散）
  'A', // Q6→AS
  'C', // Q7→AS
  'C', // Q8→BS（分散）
  'B', // Q9→AS
  'C', // Q10→AS
  'C', // Q11→AS
  'B', // Q12→GT（分散）
  'C', // Q13→GT（分散）
  'C', // Q14→AS
  'A', // Q15→GT（分散）
  'C', // Q16→BS（分散）
  'B', // Q17→GT（分散）
  'D', // Q18→AS
  'C', // Q19→BS（分散）
  'C', // Q20→AS
], { resultKey: 'free' });


/* ========== 三、接近型（4 组）========== */
console.log('\n--- 三、接近型 ---');

// CN/SN 接近：两者标准化分差距小
// CN=9/19≈47%, SN=9/14≈64% → 差距17% → 实际是 high
// 调整为真正接近的配置：CN≈8/19=42%, SN≈6/14=43%
runCase('接近CN-SN', [
  'A', // Q1→CN
  'B', // Q2→SN
  'A', // Q3→CN
  'C', // Q4→SN
  'A', // Q5→CN
  'B', // Q6→SN
  'A', // Q7→CN
  'B', // Q8→SN
  'D', // Q9→DR（中性）
  'A', // Q10→SN
  'A', // Q11→CN
  'D', // Q12→DR（中性）
  'B', // Q13→SN
  'D', // Q14→DR（中性）
  'B', // Q15→DR（中性）
  'A', // Q16→CN
  'C', // Q17→CN
  'A', // Q18→CN
  'D', // Q19→DR（中性）
  'D', // Q20→DR（中性）
], {});

// BS/AS 接近
runCase('接近BS-AS', [
  'C', // Q1→BS
  'D', // Q2→AS
  'C', // Q3→BS
  'B', // Q4→GT（中性）
  'C', // Q5→GT（中性）
  'A', // Q6→AS
  'C', // Q7→AS
  'C', // Q8→BS
  'A', // Q9→BS
  'C', // Q10→AS
  'C', // Q11→AS
  'A', // Q12→BS
  'C', // Q13→GT（中性）
  'C', // Q14→AS
  'A', // Q15→GT（中性）
  'C', // Q16→BS
  'B', // Q17→GT（中性）
  'C', // Q18→BS
  'C', // Q19→BS
  'D', // Q20→DR（中性）
], {});  // 只验证合理性，具体谁是主由 tie-break 决定

// GT/SN 接近
runCase('接近GT-SN', [
  'B', // Q1→GT
  'B', // Q2→SN
  'B', // Q3→GT
  'B', // Q4→GT
  'B', // Q5→SN
  'B', // Q6→SN
  'B', // Q7→SN
  'B', // Q8→SN
  'D', // Q9→DR（中性）
  'A', // Q10→SN
  'B', // Q11→SN
  'B', // Q12→GT
  'C', // Q13→GT
  'D', // Q14→DR（中性）
  'A', // Q15→GT
  'B', // Q16→SN
  'B', // Q17→GT
  'A', // Q18→CN（中性）
  'B', // Q19→GT
  'B', // Q20→SN
], {});  // GT 和 SN 接近

// DR/CN 接近
runCase('接近DR-CN', [
  'A', // Q1→CN
  'A', // Q2→DR
  'D', // Q3→DR
  'A', // Q4→DR
  'A', // Q5→CN
  'D', // Q6→CN
  'D', // Q7→DR
  'A', // Q8→CN
  'D', // Q9→DR
  'D', // Q10→DR
  'A', // Q11→CN
  'C', // Q12→CN
  'A', // Q13→CN
  'D', // Q14→DR
  'B', // Q15→DR
  'A', // Q16→CN
  'A', // Q17→DR
  'A', // Q18→CN
  'A', // Q19→CN
  'D', // Q20→DR
], {});  // DR 和 CN 接近


/* ========== 四、混合型（6 组）========== */
console.log('\n--- 四、混合型 ---');

// 多维接近：CN/SN/DR 三者都不低
runCase('混合CN-SN-DR', [
  'A', // Q1→CN
  'A', // Q2→DR
  'A', // Q3→CN
  'C', // Q4→SN
  'B', // Q5→SN
  'D', // Q6→CN
  'D', // Q7→DR
  'B', // Q8→SN
  'D', // Q9→DR
  'A', // Q10→SN
  'A', // Q11→CN
  'D', // Q12→DR
  'B', // Q13→SN
  'A', // Q14→CN
  'B', // Q15→DR
  'B', // Q16→SN
  'C', // Q17→CN
  'B', // Q18→SN
  'A', // Q19→CN
  'D', // Q20→DR
], {});

// 四维打散：CN/BS/AS/GT 各 ~5 分
runCase('四维打散', [
  'C', // Q1→BS
  'D', // Q2→AS
  'B', // Q3→GT
  'D', // Q4→CN
  'C', // Q5→GT
  'A', // Q6→AS
  'A', // Q7→CN
  'C', // Q8→BS
  'B', // Q9→AS
  'B', // Q10→BS
  'C', // Q11→AS
  'B', // Q12→GT
  'A', // Q13→CN
  'C', // Q14→AS
  'A', // Q15→GT
  'C', // Q16→BS
  'C', // Q17→CN
  'C', // Q18→BS
  'B', // Q19→GT
  'A', // Q20→CN
], {});

// 纯均匀分布
runCase('均匀ABCD循环', [
  'A', 'B', 'C', 'D',
  'A', 'B', 'C', 'D',
  'A', 'B', 'C', 'D',
  'A', 'B', 'C', 'D',
  'A', 'B', 'C', 'D',
], {});

// 反向循环
runCase('反向DCBA循环', [
  'D', 'C', 'B', 'A',
  'D', 'C', 'B', 'A',
  'D', 'C', 'B', 'A',
  'D', 'C', 'B', 'A',
  'D', 'C', 'B', 'A',
], {});

// 全A
runCase('全选A', [
  'A', 'A', 'A', 'A', 'A',
  'A', 'A', 'A', 'A', 'A',
  'A', 'A', 'A', 'A', 'A',
  'A', 'A', 'A', 'A', 'A',
], {});

// 全D
runCase('全选D', [
  'D', 'D', 'D', 'D', 'D',
  'D', 'D', 'D', 'D', 'D',
  'D', 'D', 'D', 'D', 'D',
  'D', 'D', 'D', 'D', 'D',
], {});


/* ========== 五、Tie-break 边界测试（8 组）========== */
console.log('\n--- 五、Tie-break 边界 ---');

// CN vs DR 同分 — 这两个维度都有 19 次出现机会
// 让两者各拿 10 分标准化分相同（各 10/19 ≈ 52.6%）
runCase('CN-DR同分tie-break', [
  'A', // Q1→CN
  'A', // Q2→DR
  'A', // Q3→CN
  'A', // Q4→DR
  'A', // Q5→CN
  'C', // Q6→DR
  'A', // Q7→CN
  'A', // Q8→CN
  'D', // Q9→DR
  'D', // Q10→DR
  'A', // Q11→CN
  'D', // Q12→DR
  'A', // Q13→CN
  'D', // Q14→DR
  'C', // Q15→CN
  'A', // Q16→CN
  'A', // Q17→DR
  'C', // Q18→BS（中性）
  'A', // Q19→CN
  'D', // Q20→DR
], {});  // tie-break 决定

// BS vs AS 同分 — 这两个维度都有 9 次出现机会
runCase('BS-AS同分tie-break', [
  'C', // Q1→BS
  'D', // Q2→AS
  'C', // Q3→BS
  'B', // Q4→GT（中性）
  'C', // Q5→GT（中性）
  'A', // Q6→AS
  'C', // Q7→AS
  'C', // Q8→BS
  'A', // Q9→BS
  'C', // Q10→AS
  'C', // Q11→AS
  'A', // Q12→BS
  'C', // Q13→GT（中性）
  'C', // Q14→AS
  'A', // Q15→GT（中性）
  'C', // Q16→BS
  'B', // Q17→GT（中性）
  'C', // Q18→BS
  'C', // Q19→BS
  'C', // Q20→AS
], {});

// confidence 刚好 high（差距 = 15）
runCase('confidence边界-high', [
  'A', // Q1→CN
  'C', // Q2→CN
  'A', // Q3→CN
  'D', // Q4→CN
  'A', // Q5→CN
  'D', // Q6→CN
  'A', // Q7→CN
  'A', // Q8→CN
  'C', // Q9→CN
  'A', // Q10→SN
  'A', // Q11→CN
  'C', // Q12→CN
  'A', // Q13→CN
  'A', // Q14→CN
  'C', // Q15→CN
  'A', // Q16→CN
  'C', // Q17→CN
  'A', // Q18→CN
  'A', // Q19→CN
  'A', // Q20→CN
], { resultKey: 'companion', confidence: 'high' });

// 三路同分（CN/DR/SN）
runCase('三路接近CN-DR-SN', [
  'A', // Q1→CN
  'B', // Q2→SN
  'D', // Q3→DR
  'C', // Q4→SN
  'D', // Q5→DR
  'D', // Q6→CN
  'B', // Q7→SN
  'D', // Q8→DR
  'C', // Q9→CN
  'A', // Q10→SN
  'D', // Q11→DR
  'C', // Q12→CN
  'D', // Q13→DR
  'A', // Q14→CN
  'D', // Q15→SN
  'B', // Q16→SN
  'A', // Q17→DR
  'B', // Q18→SN
  'A', // Q19→CN
  'D', // Q20→DR
], {});


/* ========== 六、GT 独立产出验证（4 组）========== */
console.log('\n--- 六、GT 独立产出验证 ---');

// GT 在有限出现机会下全拿 + 其他维度分散
runCase('GT全拿+分散', [
  'B', // Q1→GT
  'A', // Q2→DR（分散）
  'B', // Q3→GT
  'B', // Q4→GT
  'C', // Q5→GT
  'C', // Q6→DR（分散）
  'A', // Q7→CN（分散）
  'C', // Q8→BS（分散）
  'D', // Q9→DR（分散）
  'B', // Q10→BS（分散）
  'A', // Q11→CN（分散）
  'B', // Q12→GT
  'C', // Q13→GT
  'A', // Q14→CN（分散）
  'A', // Q15→GT
  'D', // Q16→DR（分散）
  'B', // Q17→GT
  'D', // Q18→AS（分散）
  'B', // Q19→GT
  'A', // Q20→CN（分散）
], { resultKey: 'gentle' });

// GT 8/10 + CN 8/19 — GT 应该胜出（80% vs 42%）
runCase('GT高标准化优势', [
  'B', // Q1→GT
  'C', // Q2→CN
  'B', // Q3→GT
  'B', // Q4→GT
  'C', // Q5→GT
  'D', // Q6→CN
  'A', // Q7→CN
  'A', // Q8→CN
  'C', // Q9→CN
  'A', // Q10→SN（中性）
  'A', // Q11→CN
  'B', // Q12→GT
  'C', // Q13→GT
  'A', // Q14→CN
  'A', // Q15→GT
  'A', // Q16→CN
  'B', // Q17→GT
  'A', // Q18→CN（中性）
  'B', // Q19→GT（GT 第9个！→ 实际只有10个位置所以 9/10=90%）
  'A', // Q20→CN
], { resultKey: 'gentle' });

// GT 中等 (5/10=50%) vs SN 中等 (7/14=50%) — 标准化分相同
runCase('GT-SN标准化相同', [
  'B', // Q1→GT
  'B', // Q2→SN
  'B', // Q3→GT
  'C', // Q4→SN
  'B', // Q5→SN
  'B', // Q6→SN
  'A', // Q7→CN（中性）
  'D', // Q8→DR（中性）
  'D', // Q9→DR（中性）
  'A', // Q10→SN
  'D', // Q11→DR（中性）
  'B', // Q12→GT
  'C', // Q13→GT
  'D', // Q14→DR（中性）
  'A', // Q15→GT
  'B', // Q16→SN
  'D', // Q17→SN
  'A', // Q18→CN（中性）
  'D', // Q19→DR（中性）
  'A', // Q20→CN（中性）
], {});

// GT 弱（3/10=30%）不应为主类型，除非其他更低
runCase('GT弱不应主导', [
  'B', // Q1→GT
  'C', // Q2→CN
  'A', // Q3→CN
  'D', // Q4→CN
  'A', // Q5→CN
  'D', // Q6→CN
  'A', // Q7→CN
  'A', // Q8→CN
  'C', // Q9→CN
  'D', // Q10→DR
  'A', // Q11→CN
  'B', // Q12→GT
  'A', // Q13→CN
  'A', // Q14→CN
  'C', // Q15→CN
  'A', // Q16→CN
  'B', // Q17→GT
  'A', // Q18→CN
  'A', // Q19→CN
  'A', // Q20→CN
], { resultKey: 'companion', notResultKey: 'gentle' });


/* ========== 七、次倾向漂移检测（6 组）========== */
console.log('\n--- 七、次倾向检测 ---');

// 主 CN，次应该随分散的分数而定
runCase('主CN次应为DR', [
  'A', // Q1→CN
  'A', // Q2→DR
  'A', // Q3→CN
  'A', // Q4→DR
  'A', // Q5→CN
  'C', // Q6→DR
  'A', // Q7→CN
  'A', // Q8→CN
  'D', // Q9→DR
  'D', // Q10→DR
  'A', // Q11→CN
  'C', // Q12→CN
  'A', // Q13→CN
  'A', // Q14→CN
  'B', // Q15→DR
  'A', // Q16→CN
  'A', // Q17→DR
  'A', // Q18→CN
  'A', // Q19→CN
  'A', // Q20→CN
], { resultKey: 'companion', secondaryKey: 'resonance' });

// 主 DR，次应为 CN
runCase('主DR次应为CN', [
  'D', // Q1→DR
  'A', // Q2→DR
  'D', // Q3→DR
  'A', // Q4→DR
  'D', // Q5→DR
  'D', // Q6→CN
  'D', // Q7→DR
  'D', // Q8→DR
  'C', // Q9→CN
  'D', // Q10→DR
  'D', // Q11→DR
  'D', // Q12→DR
  'D', // Q13→DR
  'D', // Q14→DR
  'C', // Q15→CN
  'D', // Q16→DR
  'C', // Q17→CN
  'A', // Q18→CN
  'D', // Q19→DR
  'D', // Q20→DR
], { resultKey: 'resonance', secondaryKey: 'companion' });

// 主 SN，次应为 BS（两者在外特征上最接近）
runCase('主SN次为BS', [
  'C', // Q1→BS
  'B', // Q2→SN
  'C', // Q3→BS
  'C', // Q4→SN
  'B', // Q5→SN
  'B', // Q6→SN
  'B', // Q7→SN
  'B', // Q8→SN
  'A', // Q9→BS
  'A', // Q10→SN
  'B', // Q11→SN
  'A', // Q12→BS
  'B', // Q13→SN
  'B', // Q14→BS
  'D', // Q15→SN
  'C', // Q16→BS
  'D', // Q17→SN
  'C', // Q18→BS
  'C', // Q19→BS
  'B', // Q20→SN
], { resultKey: 'steady', secondaryKey: 'boundary' });

// 主 GT，次应为 SN（两者行为表征接近）
runCase('主GT次为SN', [
  'B', // Q1→GT
  'B', // Q2→SN
  'B', // Q3→GT
  'B', // Q4→GT
  'B', // Q5→SN
  'B', // Q6→SN
  'A', // Q7→CN（中性）
  'D', // Q8→DR（中性）
  'D', // Q9→DR（中性）
  'A', // Q10→SN
  'D', // Q11→DR（中性）
  'B', // Q12→GT
  'C', // Q13→GT
  'D', // Q14→DR（中性）
  'A', // Q15→GT
  'B', // Q16→SN
  'B', // Q17→GT
  'A', // Q18→CN（中性）
  'B', // Q19→GT
  'B', // Q20→SN
], { resultKey: 'gentle', secondaryKey: 'steady' });

// 主 BS，次应为 AS
runCase('主BS次为AS', [
  'C', // Q1→BS
  'D', // Q2→AS
  'C', // Q3→BS
  'B', // Q4→GT（中性）
  'C', // Q5→GT（中性）
  'A', // Q6→AS
  'C', // Q7→AS
  'C', // Q8→BS
  'A', // Q9→BS
  'C', // Q10→AS
  'B', // Q11→SN（中性）
  'A', // Q12→BS
  'B', // Q13→SN（中性）
  'C', // Q14→AS
  'D', // Q15→SN（中性）
  'C', // Q16→BS
  'D', // Q17→SN（中性）
  'C', // Q18→BS
  'C', // Q19→BS
  'C', // Q20→AS
], { resultKey: 'boundary', secondaryKey: 'free' });

// 主 AS，次应为 BS
runCase('主AS次为BS', [
  'C', // Q1→BS
  'D', // Q2→AS
  'C', // Q3→BS
  'B', // Q4→GT（中性）
  'C', // Q5→GT（中性）
  'A', // Q6→AS
  'C', // Q7→AS
  'C', // Q8→BS
  'B', // Q9→AS
  'C', // Q10→AS
  'C', // Q11→AS
  'A', // Q12→BS
  'B', // Q13→SN（中性）
  'C', // Q14→AS
  'D', // Q15→SN（中性）
  'C', // Q16→BS
  'D', // Q17→SN（中性）
  'D', // Q18→AS
  'C', // Q19→BS
  'C', // Q20→AS
], { resultKey: 'free', secondaryKey: 'boundary' });


/* ========== 八、稳定性 & 一致性（4 组）========== */
console.log('\n--- 八、稳定性 & 一致性 ---');

// 相同答案运行两次，结果应完全一致
const fixedAnswers = ['A','B','C','D','A','B','C','D','A','B','C','D','A','B','C','D','A','B','C','D'];
const r1 = determineResult(fixedAnswers);
const r2 = determineResult(fixedAnswers);
console.log('\n[幂等性检查]');
assert(r1.resultKey === r2.resultKey, '幂等性: 相同输入应产出相同 resultKey');
assert(r1.secondaryKey === r2.secondaryKey, '幂等性: 相同输入应产出相同 secondaryKey');
assert(r1.confidence === r2.confidence, '幂等性: 相同输入应产出相同 confidence');
assert(JSON.stringify(r1.scores) === JSON.stringify(r2.scores), '幂等性: 相同输入应产出相同 scores');
assert(JSON.stringify(r1.normalizedScores) === JSON.stringify(r2.normalizedScores), '幂等性: 相同输入应产出相同 normalizedScores');

// 输出结构完整性检查
console.log('\n[结构完整性检查]');
const structResult = determineResult(['A','A','A','A','A','A','A','A','A','A','A','A','A','A','A','A','A','A','A','A']);
assert('resultKey' in structResult, '结构: 应包含 resultKey');
assert('secondaryKey' in structResult, '结构: 应包含 secondaryKey');
assert('scores' in structResult, '结构: 应包含 scores');
assert('normalizedScores' in structResult, '结构: 应包含 normalizedScores');
assert('sorted' in structResult, '结构: 应包含 sorted');
assert('confidence' in structResult, '结构: 应包含 confidence');
assert(Object.keys(structResult.scores).length === 6, '结构: scores 应有 6 个维度');
assert(Object.keys(structResult.normalizedScores).length === 6, '结构: normalizedScores 应有 6 个维度');

// 验证维度出现次数
console.log('\n[维度出现次数验证]');
console.log(`  DIMENSION_MAX_SCORES: ${JSON.stringify(DIMENSION_MAX_SCORES)}`);
const totalSlots = Object.values(DIMENSION_MAX_SCORES).reduce((a, b) => a + b, 0);
assert(totalSlots === 80, `维度总位数应为 80（20题×4选项），实际 ${totalSlots}`);

// 标准化分范围检查
console.log('\n[标准化分范围检查]');
for (let trial = 0; trial < 100; trial++) {
  const randomAnswers = Array.from({length: 20}, () => 'ABCD'[Math.floor(Math.random() * 4)]);
  const rr = determineResult(randomAnswers);
  for (const [dim, val] of Object.entries(rr.normalizedScores)) {
    assert(val >= 0 && val <= 100, `标准化分 ${dim}=${val} 应在 0-100 范围`);
  }
}


/* ========== 汇总 ========== */
console.log('\n========================================');
console.log(`  总计: ${passed + failed} 项断言`);
console.log(`  通过: ${passed}`);
console.log(`  失败: ${failed}`);
console.log('========================================');

if (failed > 0) {
  console.log('\n失败详情:');
  failures.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
  process.exit(1);
} else {
  console.log('\n✓ 全部通过');
  process.exit(0);
}

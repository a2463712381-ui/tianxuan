import { useState, useEffect } from "react";
import CompatibilityGuide from "./CompatibilityGuide";
import { isSingleUnlocked, isDoubleUnlocked, validateForTier, normalizeCode } from "../utils/unlock";
import { trackUnlockSingle, trackUnlockFail } from "../utils/analytics";
import { DIMENSION_MAX_SCORES } from "../data/scoring";
import { resultContent } from "../data/results";

const scoreLabels = {
  CN: "连接",
  SN: "稳定",
  BS: "边界",
  AS: "空间",
  DR: "共鸣",
  GT: "信任"
};

/* ========== 六维雷达图（纯 SVG）========== */
const RADAR_DIMS = ["CN", "SN", "BS", "AS", "DR", "GT"];
const RADAR_SIZE = 280;
const RADAR_CX = RADAR_SIZE / 2;
const RADAR_CY = RADAR_SIZE / 2;
const RADAR_R = 110;
const RADAR_LEVELS = 4;

function polarToXY(angleDeg, radius) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [RADAR_CX + radius * Math.cos(rad), RADAR_CY + radius * Math.sin(rad)];
}

function RadarChart({ scores }) {
  const angles = RADAR_DIMS.map((_, i) => (360 / RADAR_DIMS.length) * i);

  const pcts = RADAR_DIMS.map((dim) => {
    const max = DIMENSION_MAX_SCORES[dim] || 1;
    return Math.round((scores[dim] / max) * 100);
  });

  const gridPolygons = [];
  for (let lv = 1; lv <= RADAR_LEVELS; lv++) {
    const r = (RADAR_R / RADAR_LEVELS) * lv;
    const pts = angles.map((a) => polarToXY(a, r).join(",")).join(" ");
    gridPolygons.push(
      <polygon
        key={lv}
        points={pts}
        fill="none"
        stroke="rgba(111,132,183,0.12)"
        strokeWidth={lv === RADAR_LEVELS ? 1.5 : 0.8}
      />
    );
  }

  const axisLines = angles.map((a, i) => {
    const [x, y] = polarToXY(a, RADAR_R);
    return (
      <line key={i} x1={RADAR_CX} y1={RADAR_CY} x2={x} y2={y}
        stroke="rgba(111,132,183,0.10)" strokeWidth={0.8} />
    );
  });

  const dataPoints = pcts.map((pct, i) => {
    const r = (pct / 100) * RADAR_R;
    return polarToXY(angles[i], r);
  });
  const dataPolygonPts = dataPoints.map((p) => p.join(",")).join(" ");

  const labels = RADAR_DIMS.map((dim, i) => {
    const labelR = RADAR_R + 22;
    const [x, y] = polarToXY(angles[i], labelR);
    const isTop = pcts[i] === Math.max(...pcts);
    return (
      <text key={dim} x={x} y={y} textAnchor="middle" dominantBaseline="central"
        fontSize="12" fontWeight={isTop ? 700 : 400}
        fill={isTop ? "#5f74a7" : "#8090b0"} fontFamily="inherit">
        {scoreLabels[dim]}
      </text>
    );
  });

  const dots = dataPoints.map(([x, y], i) => (
    <circle key={i} cx={x} cy={y} r={3} fill="#6f84b7" stroke="#fff" strokeWidth={1.5} />
  ));

  return (
    <div className="radar-chart-container">
      <svg viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`} width="100%"
        style={{ maxWidth: RADAR_SIZE, display: "block", margin: "0 auto" }}>
        {gridPolygons}
        {axisLines}
        <polygon points={dataPolygonPts} fill="rgba(111,132,183,0.15)"
          stroke="#6f84b7" strokeWidth={2} strokeLinejoin="round" />
        {dots}
        {labels}
      </svg>
    </div>
  );
}

const SECONDARY_SUBTITLES = {
  companion: "你需要被回应的确定感",
  steady: "你要的不是热烈而是持久",
  boundary: "你需要被尊重的分寸感",
  free: "你需要不被打扰的自在感",
  gentle: "你需要用自己的速度靠近",
  resonance: "你等的不是陪伴而是共鸣"
};

const TYPE_VERSES = {
  companion: "愿我如星君如月，夜夜流光相皎洁。",
  steady: "桃李春风一杯酒，江湖夜雨十年灯。",
  boundary: "相看两不厌，只有敬亭山。",
  free: "行到水穷处，坐看云起时。",
  gentle: "细雨湿衣看不见，闲花落地听无声。",
  resonance: "身无彩凤双飞翼，心有灵犀一点通。"
};

function extractShortTitle(title) {
  const match = title.match(/【(.+?)】/);
  return match ? match[1] : title;
}

function renderLines(text) {
  return text.split("\n").filter((line) => line.trim())
    .map((line, index) => <p key={`${line}-${index}`} className="body-copy">{line}</p>);
}

function ResultListSection({ title, items, tone = "default", kicker }) {
  return (
    <section className={`result-block result-block-${tone}`}>
      <div className="result-block-header">
        <span className="result-block-kicker">{kicker}</span>
        <h3 className="section-title">{title}</h3>
      </div>
      <ul className="result-list">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

/* ========== Tab 常量 ========== */
const TAB_SELF = "self";
const TAB_PAIR = "pair";

function ResultScreen({
  result, scores, onRestart, onCopyShare, onGeneratePoster, posterLoading,
  copied, seriesTag, siteUrl, resultKey, secondaryKey,
  onCopyInvite, inviteCopied, inviteFrom,
  onGenerateCompatPoster, compatPosterLoading, onRerunForTA
}) {
  const [singleOk, setSingleOk] = useState(isSingleUnlocked);
  const [doubleOk, setDoubleOk] = useState(isDoubleUnlocked);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [shareExpanded, setShareExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(inviteFrom ? TAB_PAIR : TAB_SELF);

  const shortTitle = extractShortTitle(result.title);
  const maxScore = Math.max(...Object.values(scores));

  function handleTabChange(tab) {
    setActiveTab(tab);
    const tabBar = document.querySelector(".result-tab-bar");
    if (tabBar) {
      setTimeout(() => tabBar.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  async function handleCodeSubmit(e) {
    e.preventDefault();
    if (codeLoading) return;
    setCodeLoading(true);
    setCodeError("");
    try {
      const result = await validateForTier(codeInput, "single");
      if (result.level && !result.error) {
        setSingleOk(true);
        if (result.level === "double") setDoubleOk(true);
        setCodeError("");
        setCodeInput("");
        trackUnlockSingle(resultKey);
      } else {
        setCodeError(result.error || "invalid");
        trackUnlockFail("single");
      }
    } catch {
      setCodeError("network");
    } finally {
      setCodeLoading(false);
    }
  }

  function handleCodeChange(e) { setCodeInput(e.target.value); setCodeError(""); }
  function handleCodePaste(e) {
    e.preventDefault();
    setCodeInput(normalizeCode(e.clipboardData.getData("text")));
    setCodeError("");
  }

  return (
    <section className="screen fade-in">
      <div className="result-story-card">
        {/* ========== Hero 区 ========== */}
        <div className="result-hero">
          <div className="result-hero-glow result-hero-glow-left" />
          <div className="result-hero-glow result-hero-glow-right" />
          <div className="result-hero-badge">「{seriesTag}」</div>
          <p className="result-hero-label">于你而言，最惬意的羁绊当如是——</p>
          <h1 className="result-hero-title">{shortTitle}</h1>
          {TYPE_VERSES[resultKey] && (
            <p className="result-hero-verse">{TYPE_VERSES[resultKey]}</p>
          )}
          {result.subtitle && <p className="result-hero-subtitle">{result.subtitle}</p>}
          <p className="result-hero-summary">{result.summary}</p>
        </div>

        {/* ========== 次倾向提示 ========== */}
        {secondaryKey && secondaryKey !== resultKey && (
          <div className="result-secondary-hint">
            <span className="result-secondary-label">隐性倾向</span>
            <span className="result-secondary-type">
              {extractShortTitle(resultContent[secondaryKey]?.title || "")}
            </span>
            {SECONDARY_SUBTITLES[secondaryKey] && (
              <span className="result-secondary-desc">{SECONDARY_SUBTITLES[secondaryKey]}</span>
            )}
          </div>
        )}

        {/* ========== Tab 切换栏 ========== */}
        <div className="result-tab-bar">
          <button className={`result-tab-btn${activeTab === TAB_SELF ? " is-active" : ""}`}
            type="button" onClick={() => handleTabChange(TAB_SELF)}>
            我的解读
          </button>
          <button className={`result-tab-btn${activeTab === TAB_PAIR ? " is-active" : ""}`}
            type="button" onClick={() => handleTabChange(TAB_PAIR)}>
            相处指南
          </button>
        </div>

        {/* ========== Tab 内容区 ========== */}
        <div className="result-tab-content">

          {/* ====== Tab 1: 我的解读 ====== */}
          {activeTab === TAB_SELF && (
            <div className="result-tab-panel fade-in" key="tab-self">

              {/* 雷达图 — 轻量展示，无外框 */}
              <div className="result-radar-section">
                <p className="result-radar-label">心迹分布</p>
                <RadarChart scores={scores} />
                <div className="score-bar-chart">
                  {Object.entries(scores).map(([key, value]) => {
                    const dimMax = DIMENSION_MAX_SCORES[key] || 20;
                    const pct = Math.round((value / dimMax) * 100);
                    const isTop = value === maxScore;
                    return (
                      <div className={`score-bar-row${isTop ? " is-top" : ""}`} key={key}>
                        <span className="score-bar-label">{scoreLabels[key] || key}</span>
                        <div className="score-bar-track">
                          <div className="score-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="score-bar-value">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ---- 呼吸间距 ---- */}
              <div className="result-spacer" />

              {/* 个人付费区 */}
              {singleOk ? (
                <div className="result-premium-group fade-in">
                  <div className="result-group-header">
                    <span className="result-group-kicker">个人深度解读</span>
                    <div className="unlock-status">
                      <span className="unlock-status-dot" />
                      已解锁 · {doubleOk ? "完整版" : "个人版"}
                    </div>
                  </div>

                  <section className="result-block result-block-description">
                    <div className="result-block-header">
                      <span className="result-block-kicker">心镜独白</span>
                      <h2 className="section-title">你的关系图景</h2>
                    </div>
                    <div className="description-block">{renderLines(result.description)}</div>
                  </section>

                  <ResultListSection title="你的情谊优势" kicker="情谊优势"
                    items={result.strengths} tone="soft-blue" />
                  <ResultListSection title="最易消磨你的瞬间" kicker="关系触发点"
                    items={result.triggers} tone="soft-lilac" />
                  <ResultListSection title="最契合你的相处之道" kicker="相处之道"
                    items={result.fit} tone="soft-mist" />

                  <section className="result-block result-block-reminder">
                    <div className="result-block-header">
                      <span className="result-block-kicker">锦囊</span>
                      <h3 className="section-title">写给你的话</h3>
                    </div>
                    <p className="body-copy result-emphasis-copy">{result.reminder}</p>
                  </section>
                </div>
              ) : (
                <div className="result-paywall">
                  <div className="paywall-lock-icon">🔒</div>
                  <p className="paywall-teaser">你为什么会这样对待亲近的人？</p>
                  <p className="paywall-desc">
                    解锁你的完整关系图景 —— 从深层动机、情谊优势，到容易让你消耗的瞬间和最契合你的相处方式，帮你真正看清自己在关系中的模样。
                  </p>
                  <div className="paywall-preview-list">
                    <span className="paywall-preview-tag">心镜独白</span>
                    <span className="paywall-preview-tag">情谊优势</span>
                    <span className="paywall-preview-tag">关系触发点</span>
                    <span className="paywall-preview-tag">相处之道</span>
                    <span className="paywall-preview-tag">锦囊</span>
                  </div>
                  <form className="paywall-form" onSubmit={handleCodeSubmit}>
                    <input
                      type="text"
                      className={`paywall-input${codeError ? " paywall-input-error" : ""}`}
                      placeholder="在此输入兑换码"
                      value={codeInput}
                      onChange={handleCodeChange}
                      onPaste={handleCodePaste}
                      autoComplete="off" autoCapitalize="characters"
                      spellCheck="false" autoCorrect="off"
                    />
                    {codeError === "invalid" && <p className="paywall-error">这个兑换码似乎不对，请再检查一下</p>}
                    {codeError === "used" && <p className="paywall-error">这个兑换码已经被使用过了</p>}
                    {codeError === "expired" && <p className="paywall-error">这个兑换码已过期</p>}
                    {codeError === "disabled" && <p className="paywall-error">这个兑换码已失效</p>}
                    {codeError === "network" && <p className="paywall-error">网络连接异常，请稍后重试</p>}
                    <button className="primary-button" type="submit"
                      disabled={!codeInput.trim() || codeLoading}>
                      {codeLoading && <span className="btn-spinner" />}
                      {codeLoading ? "验证中…" : "解锁完整报告"}
                    </button>
                  </form>
                </div>
              )}

              {/* ---- 呼吸间距 ---- */}
              <div className="result-spacer" />

              {/* 分享 + 引导 合并为一个轻量底部区 */}
              <div className="result-bottom-actions">
                <button className="primary-button poster-generate-button"
                  type="button" onClick={onGeneratePoster} disabled={posterLoading}>
                  {posterLoading && <span className="btn-spinner" />}
                  {posterLoading ? "正在生成海报…" : "生成专属海报"}
                </button>

                <div className="result-bottom-row">
                  <button className="text-button" type="button"
                    onClick={() => setShareExpanded(!shareExpanded)}>
                    {shareExpanded ? "收起文字版 ↑" : "复制文字版 ↓"}
                  </button>
                  <span className="result-bottom-sep">·</span>
                  <button className="text-button" type="button"
                    onClick={() => handleTabChange(TAB_PAIR)}>
                    查看相处指南 →
                  </button>
                </div>

                {shareExpanded && (
                  <div className="share-text-panel fade-in">
                    <div className="share-copy">
                      <p className="body-copy">「{seriesTag}」</p>
                      <p className="body-copy">{result.title}</p>
                      <br />
                      {renderLines(result.share)}
                      <br />
                      <p className="body-copy">🔗 来测测你的关系距离 → {siteUrl}</p>
                    </div>
                    <button className="secondary-button share-inline-button"
                      type="button" onClick={onCopyShare}>
                      {copied ? "已复制 ✓" : "复制文案"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ====== Tab 2: 相处指南 ====== */}
          {activeTab === TAB_PAIR && (
            <div className="result-tab-panel fade-in" key="tab-pair">
              <CompatibilityGuide
                myTypeKey={resultKey} myTypeTitle={shortTitle}
                onCopyInvite={onCopyInvite} inviteCopied={inviteCopied}
                seriesTag={seriesTag} siteUrl={siteUrl} inviteFrom={inviteFrom}
                onGenerateCompatPoster={onGenerateCompatPoster}
                compatPosterLoading={compatPosterLoading}
                onRerunForTA={onRerunForTA}
              />
            </div>
          )}
        </div>

        {/* ========== 尾部 ========== */}
        <p className="result-disclaimer">
          本测试旨在助你厘清自身于人情往来中的偏好与边界，结果仅映照当下心境的相对倾向，非为固定不变之断语，亦不可作专业心理诊断之用。
        </p>
      </div>

      {/* 重新测验弱化为文字链接 */}
      <div className="result-restart-row">
        <button className="text-button result-restart-link" type="button" onClick={onRestart}>
          重新测验
        </button>
      </div>
    </section>
  );
}

export default ResultScreen;

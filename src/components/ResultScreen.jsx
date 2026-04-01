import { useState } from "react";
import CompatibilityGuide from "./CompatibilityGuide";
import { isSingleUnlocked, isDoubleUnlocked, validateAndUnlock } from "../utils/unlock";

const scoreLabels = {
  CN: "连接",
  SN: "稳定",
  BS: "边界",
  AS: "空间",
  DR: "共鸣"
};

function renderLines(text) {
  return text
    .split("\n")
    .filter((line) => line.trim())
    .map((line, index) => (
      <p key={`${line}-${index}`} className="body-copy">
        {line}
      </p>
    ));
}

function ResultListSection({ title, items, tone = "default", kicker }) {
  return (
    <section className={`result-block result-block-${tone}`}>
      <div className="result-block-header">
        <span className="result-block-kicker">{kicker || title}</span>
        <h3 className="section-title">{title}</h3>
      </div>
      <ul className="result-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function ResultScreen({ result, scores, onRestart, onCopyShare, onGeneratePoster, posterLoading, copied, seriesTag, siteUrl, resultKey, onCopyInvite, inviteCopied, inviteFrom, onCopyInviteLink, inviteLinkCopied, onGenerateCompatPoster, compatPosterLoading }) {
  const [singleOk, setSingleOk] = useState(isSingleUnlocked);
  const [doubleOk, setDoubleOk] = useState(isDoubleUnlocked);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);

  function handleCodeSubmit(e) {
    e.preventDefault();
    const level = validateAndUnlock(codeInput);
    if (level) {
      setSingleOk(true);
      if (level === "double") setDoubleOk(true);
      setCodeError(false);
      setCodeInput("");
    } else {
      setCodeError(true);
    }
  }

  return (
    <section className="screen fade-in">
      <div className="result-story-card">
        {/* ========== 免费区：类型名 + 摘要 + 五维分数 ========== */}
        <div className="result-hero">
          <div className="result-hero-glow result-hero-glow-left" />
          <div className="result-hero-glow result-hero-glow-right" />
          <div className="result-hero-badge">「{seriesTag}」</div>
          <p className="result-hero-label">于你而言，最惬意的羁绊当如是——</p>
          <h1 className="result-hero-title">{result.title}</h1>
          {result.subtitle && (
            <p className="result-hero-subtitle">{result.subtitle}</p>
          )}
          <p className="result-hero-summary">{result.summary}</p>
        </div>

        <section className="result-block result-block-soft-blue">
          <div className="result-block-header">
            <span className="result-block-kicker">心迹分布</span>
            <h3 className="section-title">你的维度分布</h3>
          </div>
          <div className="score-chip-row">
            {Object.entries(scores).map(([key, value]) => (
              <div className="score-chip" key={key}>
                <span>{scoreLabels[key] || key}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>

        {/* ========== 个人付费区 ========== */}
        {singleOk ? (
          <div className="result-premium-content fade-in">
            <section className="result-block result-block-description">
              <div className="result-block-header">
                <span className="result-block-kicker">心镜独白</span>
                <h2 className="section-title">你的关系图景</h2>
              </div>
              <div className="description-block">{renderLines(result.description)}</div>
            </section>

            <ResultListSection
              title="你的情谊优势"
              kicker="情谊优势"
              items={result.strengths}
              tone="soft-blue"
            />

            <ResultListSection
              title="最易消磨你的瞬间"
              kicker="关系触发点"
              items={result.triggers}
              tone="soft-lilac"
            />

            <ResultListSection
              title="最契合你的相处之道"
              kicker="相处之道"
              items={result.fit}
              tone="soft-mist"
            />

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
            <div className="paywall-blur-hint">
              <p className="paywall-teaser">解锁你的完整个人报告</p>
              <p className="paywall-desc">
                包含心镜独白、情谊优势、关系触发点、相处之道、专属锦囊等 5 大深度模块
              </p>
            </div>
            <form className="paywall-form" onSubmit={handleCodeSubmit}>
              <input
                type="text"
                className={`paywall-input${codeError ? " paywall-input-error" : ""}`}
                placeholder="输入兑换码"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value);
                  setCodeError(false);
                }}
                autoComplete="off"
              />
              {codeError && (
                <p className="paywall-error">兑换码无效，请检查后重试</p>
              )}
              <button className="primary-button" type="submit" disabled={!codeInput.trim()}>
                解锁个人报告
              </button>
            </form>
          </div>
        )}

        {/* ========== 分享区（始终免费） ========== */}
        <section className="result-block result-block-share">
          <div className="result-block-header">
            <span className="result-block-kicker">寄语</span>
            <h3 className="section-title">分享预览</h3>
          </div>
          <p className="body-copy centered">
            截图结果页，或复制下方文案发与友人共赏。
          </p>
          <div className="share-copy">
            <p className="body-copy">「{seriesTag}」</p>
            <p className="body-copy">{result.title}</p>
            <br />
            {renderLines(result.share)}
            <br />
            <p className="body-copy">🔗 来测测你的关系距离 → {siteUrl}</p>
          </div>
          <button className="secondary-button share-inline-button" type="button" onClick={onCopyShare}>
            {copied ? "已复制，快去分享吧" : "复制分享文案"}
          </button>
          <button
            className="primary-button poster-generate-button"
            type="button"
            onClick={onGeneratePoster}
            disabled={posterLoading}
          >
            {posterLoading ? "正在生成海报…" : "生成专属海报"}
          </button>
          <button
            className="secondary-button invite-link-button"
            type="button"
            onClick={onCopyInviteLink}
          >
            {inviteLinkCopied ? "邀请链接已复制 ✓" : "生成邀请链接"}
          </button>
        </section>

        {/* ========== 相处指南 ========== */}
        <CompatibilityGuide
          myTypeKey={resultKey}
          myTypeTitle={result.title.replace("你的关系风格：【", "").replace("】", "")}
          onCopyInvite={onCopyInvite}
          inviteCopied={inviteCopied}
          seriesTag={seriesTag}
          siteUrl={siteUrl}
          inviteFrom={inviteFrom}
          onGenerateCompatPoster={onGenerateCompatPoster}
          compatPosterLoading={compatPosterLoading}
        />

        <section className="result-block result-block-disclaimer">
          <div className="result-block-header">
            <span className="result-block-kicker">说明</span>
            <h3 className="section-title">说明</h3>
          </div>
          <p className="body-copy">
            本测试旨在助你厘清自身于人情往来中的偏好与边界，结果仅映照当下心境的相对倾向，非为固定不变之断语，亦不可作专业心理诊断之用。
          </p>
        </section>
      </div>

      <div className="action-row">
        <button className="primary-button" type="button" onClick={onRestart}>
          重新测验
        </button>
      </div>
    </section>
  );
}

export default ResultScreen;

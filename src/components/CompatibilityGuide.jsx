import { useState, useRef, useEffect } from "react";
import { getCompatibility, typeOptions } from "../data/compatibility";
import { getPremiumCompatibility } from "../data/compatibility-premium";
import {
  trackCompatibilityOpen,
  trackCompatibilitySelect,
  trackUnlockDouble,
  trackUnlockFail,
} from "../utils/analytics";
import { isDoubleUnlocked, validateForTier, normalizeCode } from "../utils/unlock";

/* ========== 渲染工具 ========== */
function renderParagraphs(text) {
  return text
    .split("\n")
    .filter((line) => line.trim())
    .map((line, i) => (
      <p key={i} className="body-copy">
        {line}
      </p>
    ));
}

/* ========== 主组件 ========== */
function CompatibilityGuide({ 
  myTypeKey, 
  myTypeTitle, 
  onCopyInvite, 
  inviteCopied, 
  seriesTag, 
  siteUrl, 
  inviteFrom, 
  onGenerateCompatPoster, 
  compatPosterLoading,
  onRerunForTA // 新增：支持重测
}) {
  const [selectedType, setSelectedType] = useState(null);
  const [unlocked, setUnlocked] = useState(isDoubleUnlocked);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");  // "" | "invalid" | "used" | "expired" | "disabled" | "wrong_tier" | "network"
  const [codeLoading, setCodeLoading] = useState(false);
  const guideRef = useRef(null);
  const paywallRef = useRef(null);

  const guide = selectedType ? getCompatibility(myTypeKey, selectedType.key) : null;
  const premiumGuide = selectedType ? getPremiumCompatibility(myTypeKey, selectedType.key) : null;

  // 如果有 ?from= 参数，自动选中对方类型
  useEffect(() => {
    if (inviteFrom) {
      const matchedType = typeOptions.find((t) => t.key === inviteFrom);
      if (matchedType) {
        setSelectedType(matchedType);
        trackCompatibilityOpen(myTypeKey);
        trackCompatibilitySelect(myTypeKey, matchedType.key);
      }
    }
  }, [inviteFrom]);

  // 选完对方类型后滚动到指南区域
  useEffect(() => {
    if (guide && guideRef.current) {
      setTimeout(() => {
        guideRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }, [guide]);

  function handleSelect(typeOption) {
    setSelectedType(typeOption);
    trackCompatibilityOpen(myTypeKey);
    trackCompatibilitySelect(myTypeKey, typeOption.key);
  }

  function handleBack() {
    setSelectedType(null);
    setCodeInput("");
    setCodeError("");
    if (guideRef.current) {
       guideRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleCopyInvite() {
    if (!selectedType) return;
    const text = [
      `「${seriesTag}」`,
      `我测出来是【${myTypeTitle}】，猜你是【${selectedType.title}】`,
      `来测测看我猜对了没 → ${siteUrl}?from=${myTypeKey}`
    ].join("\n");
    onCopyInvite(text, myTypeKey, selectedType.key);
  }

  function handleCompatPoster() {
    if (!selectedType || !premiumGuide) return;
    onGenerateCompatPoster({
      myTitle: myTypeTitle,
      theirTitle: selectedType.title,
      tag: premiumGuide.preview.tag,
      chemistry: premiumGuide.preview.chemistry,
      myTypeKey: myTypeKey,
      theirTypeKey: selectedType.key
    });
  }

  async function handleCodeSubmit(e) {
    e.preventDefault();
    if (codeLoading) return;
    setCodeLoading(true);
    setCodeError("");

    try {
      const result = await validateForTier(codeInput, "double");
      if (result.level === "double" && !result.error) {
        setUnlocked(true);
        setCodeError("");
        setCodeInput("");
        trackUnlockDouble(myTypeKey, selectedType?.key);
        setTimeout(() => {
          if (paywallRef.current) {
            paywallRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      } else {
        setCodeError(result.error || "invalid");
        trackUnlockFail("double");
      }
    } catch {
      setCodeError("network");
    } finally {
      setCodeLoading(false);
    }
  }

  function handleCodeChange(e) {
    setCodeInput(e.target.value);
    setCodeError("");
  }

  function handleCodePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    setCodeInput(normalizeCode(pasted));
    setCodeError("");
  }

  // ========== 未选类型：选择界面 ==========
  if (!selectedType) {
    return (
      <div className="compat-select-view" ref={guideRef}>
        <div className="compat-select-header">
          <span className="result-group-kicker">知己篇</span>
          <h3 className="section-title">TA 最像哪一种？</h3>
          <p className="body-copy compat-select-desc">
            选择你在意的人的类型，看看你们之间会碰撞出什么样的关系化学。
          </p>
        </div>

        <div className="compat-preview-callout">
          <span className="compat-preview-kicker">你将在这里看到</span>
          <div className="compat-preview-grid">
            <div className="compat-preview-pill">更容易默契的地方</div>
            <div className="compat-preview-pill">最可能卡住的摩擦</div>
            <div className="compat-preview-pill">适合你们的相处建议</div>
          </div>
        </div>

        <div className="compat-grid">
          {typeOptions.map((opt) => (
            <button
              key={opt.key}
              className={`compat-type-card${opt.key === myTypeKey ? " is-self" : ""}`}
              type="button"
              onClick={() => handleSelect(opt)}
            >
              <span className="compat-type-name">{opt.title}</span>
              <span className="compat-type-desc">{opt.subtitle}</span>
              {opt.key === myTypeKey && (
                <span className="compat-type-badge">你</span>
              )}
            </button>
          ))}
        </div>

        <div className="compat-rerun-section">
          <p className="body-copy centered compat-hint">
            不确定 TA 的类型？
          </p>
          <button className="secondary-button" type="button" onClick={onRerunForTA}>
             帮 TA 测测
          </button>
          <p className="share-action-hint centered">
            或是：让 TA 自己来测 → <button className="inline-link" onClick={handleCopyInvite}>复制邀请链接</button>
          </p>
        </div>
      </div>
    );
  }

  // ========== 已选类型：指南展示 ==========
  return (
    <div className="compat-guide-view" ref={guideRef}>
      {/* 顶部标题栏 */}
      <div className="compat-guide-header">
        <div className="compat-header-main">
          <span className="result-group-kicker">知己篇 · 相处指南</span>
          <button className="compat-change-button" onClick={handleBack} type="button">
            重新选择
          </button>
        </div>
        <h3 className="section-title">{myTypeTitle} × {selectedType.title}</h3>
      </div>

      {/* ===== 免费区：合并为一张卡片 ===== */}
      <div className="compat-free-card">
        <div className="compat-free-item">
          <span className="compat-label">关系化学</span>
          <p className="body-copy compat-chemistry">{guide.chemistry}</p>
        </div>

        <div className="compat-free-divider" />

        <div className="compat-free-item">
          <span className="compat-label">相处建议</span>
          <ul className="compat-advice-list">
            {guide.advice.map((item, i) => (
              <li key={i} className="body-copy">{item}</li>
            ))}
          </ul>
        </div>

        <div className="compat-free-divider" />

        <div className="compat-free-item">
          <span className="compat-label">一句话提醒</span>
          <p className="body-copy compat-reminder">{guide.reminder}</p>
        </div>
      </div>

      {/* ===== 深度区 ===== */}
      {premiumGuide && (
        <div className="compat-deep-zone" ref={paywallRef}>
          {/* 预览 */}
          <div className="compat-deep-preview">
            <span className="compat-label">深度解读 · 预览</span>
            <p className="body-copy compat-chemistry">{premiumGuide.preview.chemistry}</p>
            <span className="compat-tag">{premiumGuide.preview.tag}</span>
          </div>

          {/* 已解锁 */}
          {unlocked ? (
            <div className="compat-premium-group fade-in">
              <div className="unlock-status unlock-status-double">
                <span className="unlock-status-dot" />
                已解锁 · 双人深度版
              </div>

              {/* 关系画像 */}
              <div className="compat-deep-section">
                <span className="compat-label">关系画像</span>
                <div className="compat-portrait">
                  {renderParagraphs(premiumGuide.premium.portrait)}
                </div>
              </div>

              {/* 天然默契 */}
              <div className="compat-deep-section">
                <span className="compat-label">天然默契</span>
                <div className="compat-pair-list">
                  {premiumGuide.premium.synergy.map((item, i) => (
                    <div key={i} className="compat-pair-item">
                      <strong className="compat-pair-title">{item.title}</strong>
                      <p className="body-copy">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 潜在摩擦 */}
              <div className="compat-deep-section">
                <span className="compat-label">潜在摩擦</span>
                <div className="compat-pair-list">
                  {premiumGuide.premium.friction.map((item, i) => (
                    <div key={i} className="compat-pair-item compat-pair-item-friction">
                      <strong className="compat-pair-title">{item.title}</strong>
                      <p className="body-copy">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 给双方的建议 */}
              <div className="compat-deep-section compat-deep-advice-pair">
                <div className="compat-advice-card">
                  <span className="compat-label">给 {premiumGuide.premium.adviceA.label} 的话</span>
                  <p className="body-copy">{premiumGuide.premium.adviceA.text}</p>
                </div>
                <div className="compat-advice-card">
                  <span className="compat-label">给 {premiumGuide.premium.adviceB.label} 的话</span>
                  <p className="body-copy">{premiumGuide.premium.adviceB.text}</p>
                </div>
              </div>

              {/* 相处锦囊 */}
              <div className="compat-deep-section compat-deep-nugget">
                <span className="compat-label">相处锦囊</span>
                <p className="body-copy compat-nugget">{premiumGuide.premium.nugget}</p>
              </div>

              {/* 关系预警信号 */}
              <div className="compat-deep-section">
                <span className="compat-label">关系预警信号</span>
                <ul className="compat-advice-list">
                  {premiumGuide.premium.warnings.map((item, i) => (
                    <li key={i} className="body-copy">{item}</li>
                  ))}
                </ul>
              </div>

              {/* 一起做的事 */}
              <div className="compat-deep-section">
                <span className="compat-label">推荐一起做的事</span>
                <div className="compat-pair-list">
                  {premiumGuide.premium.activities.map((item, i) => (
                    <div key={i} className="compat-pair-item compat-pair-item-activity">
                      <strong className="compat-pair-title">{item.title}</strong>
                      <p className="body-copy">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* 未解锁：付费墙 */
            <div className="compat-paywall compat-paywall-double">
              <div className="paywall-badge paywall-badge-double">双人版</div>
              <div className="paywall-blur-hint">
                <p className="paywall-teaser">你们之间真正会发生什么？</p>
                <p className="paywall-desc">
                  上面是方向性的相处建议，而深度版会告诉你们之间具体的默契与摩擦、各自的盲区，以及只属于你们两人的相处锦囊。
                </p>
              </div>
              <form className="paywall-form" onSubmit={handleCodeSubmit}>
                <input
                  type="text"
                  className={`paywall-input${codeError ? " paywall-input-error" : ""}`}
                  placeholder="在此输入双人版兑换码"
                  value={codeInput}
                  onChange={handleCodeChange}
                  onPaste={handleCodePaste}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck="false"
                  autoCorrect="off"
                />
                {codeError === "wrong_tier" && (
                  <p className="paywall-error">这是个人版兑换码，双人版需要单独的兑换码</p>
                )}
                {codeError === "invalid" && (
                  <p className="paywall-error">这个兑换码似乎不对，请再检查一下</p>
                )}
                {codeError === "used" && (
                  <p className="paywall-error">这个兑换码已经被使用过了</p>
                )}
                {codeError === "expired" && (
                  <p className="paywall-error">这个兑换码已过期</p>
                )}
                {codeError === "disabled" && (
                  <p className="paywall-error">这个兑换码已失效</p>
                )}
                {codeError === "network" && (
                  <p className="paywall-error">网络连接异常，请稍后重试</p>
                )}
                <button className="primary-button" type="submit" disabled={!codeInput.trim() || codeLoading}>
                  {codeLoading && <span className="btn-spinner" />}
                  {codeLoading ? "验证中…" : "解锁深度相处分析"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ===== 行动区 ===== */}
      <div className="compat-action-zone">
        <span className="compat-action-kicker">如果想看得更准一些</span>
        <p className="body-copy centered compat-action-title">
          让 TA 也来测一测，你们的相处版会更贴近真实
        </p>
        <button
          className="primary-button"
          type="button"
          onClick={handleCopyInvite}
        >
          {inviteCopied ? "已复制，发给 TA 吧 ✓" : "邀请 TA 来测"}
        </button>
        <p className="share-action-hint">复制含链接的邀请文案，直接发给 TA</p>
        {premiumGuide && (
          <div className="share-action-group">
            <button
              className="secondary-button compat-poster-button"
              type="button"
              onClick={handleCompatPoster}
              disabled={compatPosterLoading}
            >
              {compatPosterLoading && <span className="btn-spinner" />}
              {compatPosterLoading ? "正在生成海报…" : "生成相处海报"}
            </button>
            <p className="share-action-hint">适合发朋友圈晒你们的关系化学</p>
          </div>
        )}

        <button className="secondary-button" type="button" onClick={handleBack}>
          返回选择 TA 的类型
        </button>
      </div>
    </div>
  );
}

export default CompatibilityGuide;

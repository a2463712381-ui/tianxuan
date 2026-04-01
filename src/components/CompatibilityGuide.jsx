import { useState, useRef, useEffect } from "react";
import { getCompatibility, typeOptions } from "../data/compatibility";
import { getPremiumCompatibility } from "../data/compatibility-premium";
import {
  trackCompatibilityOpen,
  trackCompatibilitySelect,
  trackInviteCopy
} from "../utils/analytics";
import { isSingleUnlocked, isDoubleUnlocked, validateAndUnlock } from "../utils/unlock";

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
function CompatibilityGuide({ myTypeKey, myTypeTitle, onCopyInvite, inviteCopied, seriesTag, siteUrl, inviteFrom, onGenerateCompatPoster, compatPosterLoading }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [unlocked, setUnlocked] = useState(isDoubleUnlocked);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);
  const guideRef = useRef(null);
  const paywallRef = useRef(null);

  const guide = selectedType ? getCompatibility(myTypeKey, selectedType.key) : null;
  const premiumGuide = selectedType ? getPremiumCompatibility(myTypeKey, selectedType.key) : null;

  // 如果有 ?from= 参数，自动展开并选中对方类型
  useEffect(() => {
    if (inviteFrom && !expanded) {
      const matchedType = typeOptions.find((t) => t.key === inviteFrom);
      if (matchedType) {
        setExpanded(true);
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

  function handleExpand() {
    setExpanded(true);
    trackCompatibilityOpen(myTypeKey);
  }

  function handleSelect(typeOption) {
    setSelectedType(typeOption);
    trackCompatibilitySelect(myTypeKey, typeOption.key);
  }

  function handleBack() {
    setSelectedType(null);
    setCodeInput("");
    setCodeError(false);
  }

  function handleCopyInvite() {
    if (!selectedType) return;
    const text = [
      `「${seriesTag}」`,
      `我测出来是【${myTypeTitle}】，猜你是【${selectedType.title}】`,
      `来测测看我猜对了没 → ${siteUrl}`
    ].join("\n");
    onCopyInvite(text, myTypeKey, selectedType.key);
  }

  function handleCompatPoster() {
    if (!selectedType || !premiumGuide) return;
    onGenerateCompatPoster({
      myTitle: myTypeTitle,
      theirTitle: selectedType.title,
      tag: premiumGuide.preview.tag,
      chemistry: premiumGuide.preview.chemistry
    });
  }

  function handleCodeSubmit(e) {
    e.preventDefault();
    const level = validateAndUnlock(codeInput);
    if (level === "double") {
      setUnlocked(true);
      setCodeError(false);
      setCodeInput("");
      // 解锁后滚到 premium 内容
      setTimeout(() => {
        if (paywallRef.current) {
          paywallRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } else if (level === "single") {
      // single 码不能解锁相处指南，提示用户
      setCodeError(true);
    } else {
      setCodeError(true);
    }
  }

  // 尚未展开：显示入口按钮
  if (!expanded) {
    return (
      <section className="result-block result-block-compat-entry">
        <div className="result-block-header">
          <span className="result-block-kicker">相处指南</span>
          <h3 className="section-title">想知道你和 TA 怎么相处？</h3>
        </div>
        <p className="body-copy">
          选择 TA 的类型，看看你们之间的关系化学。
        </p>
        <button className="primary-button" type="button" onClick={handleExpand}>
          查看相处指南
        </button>
      </section>
    );
  }

  // 展开后：选择对方类型 + 指南展示
  return (
    <section className="result-block result-block-compat">
      <div className="result-block-header">
        <span className="result-block-kicker">相处指南</span>
        <h3 className="section-title">
          {selectedType ? `${myTypeTitle} × ${selectedType.title}` : "选一个 TA 的类型"}
        </h3>
      </div>

      {/* 类型选择网格 */}
      {!selectedType && (
        <>
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
          <p className="body-copy centered compat-hint">
            不确定？让 TA 也来测一测
          </p>
        </>
      )}

      {/* 选中后：免费指南 + 付费预览 + 付费墙/深度内容 */}
      {selectedType && guide && (
        <div className="compat-guide" ref={guideRef}>

          {/* 免费区：基础相处指南 */}
          <div className="compat-section">
            <span className="compat-label">关系化学</span>
            <p className="body-copy compat-chemistry">{guide.chemistry}</p>
          </div>

          <div className="compat-section">
            <span className="compat-label">相处建议</span>
            <ul className="compat-advice-list">
              {guide.advice.map((item, i) => (
                <li key={i} className="body-copy">{item}</li>
              ))}
            </ul>
          </div>

          <div className="compat-section">
            <span className="compat-label">一句话提醒</span>
            <p className="body-copy compat-reminder">{guide.reminder}</p>
          </div>

          {/* 生成相处海报按钮 */}
          {premiumGuide && (
            <button
              className="primary-button compat-poster-button"
              type="button"
              onClick={handleCompatPoster}
              disabled={compatPosterLoading}
            >
              {compatPosterLoading ? "正在生成海报…" : "生成相处海报"}
            </button>
          )}

          {/* 付费预览区：chemistry 一句话 + 兼容性标签 */}
          {premiumGuide && (
            <div className="compat-premium-preview" ref={paywallRef}>
              <div className="compat-section compat-section-preview">
                <span className="compat-label">深度解读 · 预览</span>
                <p className="body-copy compat-chemistry">{premiumGuide.preview.chemistry}</p>
                <span className="compat-tag">{premiumGuide.preview.tag}</span>
              </div>

              {/* 已解锁：显示完整 premium 内容 */}
              {unlocked ? (
                <div className="compat-premium-content fade-in">
                  {/* 关系画像 */}
                  <div className="compat-section">
                    <span className="compat-label">关系画像</span>
                    <div className="compat-portrait">
                      {renderParagraphs(premiumGuide.premium.portrait)}
                    </div>
                  </div>

                  {/* 天然默契 */}
                  <div className="compat-section">
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
                  <div className="compat-section">
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
                  <div className="compat-section">
                    <span className="compat-label">给 {premiumGuide.premium.adviceA.label} 的话</span>
                    <p className="body-copy">{premiumGuide.premium.adviceA.text}</p>
                  </div>
                  <div className="compat-section">
                    <span className="compat-label">给 {premiumGuide.premium.adviceB.label} 的话</span>
                    <p className="body-copy">{premiumGuide.premium.adviceB.text}</p>
                  </div>

                  {/* 相处锦囊 */}
                  <div className="compat-section compat-section-nugget">
                    <span className="compat-label">相处锦囊</span>
                    <p className="body-copy compat-nugget">{premiumGuide.premium.nugget}</p>
                  </div>

                  {/* 关系预警信号 */}
                  <div className="compat-section">
                    <span className="compat-label">关系预警信号</span>
                    <ul className="compat-advice-list">
                      {premiumGuide.premium.warnings.map((item, i) => (
                        <li key={i} className="body-copy">{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 一起做的事 */}
                  <div className="compat-section">
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
                <div className="compat-paywall">
                  <div className="paywall-blur-hint">
                    <p className="paywall-teaser">解锁全部相处分析</p>
                    <p className="paywall-desc">
                      解锁你与 6 种关系风格的完整相处分析，包含关系画像、天然默契、潜在摩擦、双方专属建议、相处锦囊、预警信号、推荐活动等 8 大模块
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
                      <p className="paywall-error">请输入双人版兑换码</p>
                    )}
                    <button className="primary-button" type="submit" disabled={!codeInput.trim()}>
                      解锁双人版
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* 邀请 CTA */}
          <div className="compat-cta">
            <p className="body-copy centered">
              这是你眼中的 TA —— 让 TA 也测测，看看真实结果是什么？
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={handleCopyInvite}
            >
              {inviteCopied ? "已复制，快去邀请 TA" : "复制邀请文案"}
            </button>
          </div>

          <div className="compat-actions">
            <button className="secondary-button" type="button" onClick={handleBack}>
              换一个类型看看
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default CompatibilityGuide;

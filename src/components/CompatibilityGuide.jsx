import { useState, useRef, useEffect } from "react";
import { getCompatibility, typeOptions } from "../data/compatibility";
import { getPremiumCompatibility } from "../data/compatibility-premium";
import {
  trackCompatibilityOpen,
  trackCompatibilitySelect,
  trackUnlockDouble,
  trackUnlockFail,
} from "../utils/analytics";
import { isDoubleUnlocked, validateForTier, normalizeCode, startAfdianPurchase } from "../utils/unlock";

/* ========== 渲染工具 ========== */
const TYPE_TITLES = typeOptions.map((item) => item.title);
const TYPE_TITLE_PATTERN = new RegExp(`(${TYPE_TITLES.join("|")})`, "g");

function renderHighlightedText(text) {
  if (!text) return text;

  return text.split(TYPE_TITLE_PATTERN).map((part, index) => {
    if (TYPE_TITLES.includes(part)) {
      return (
        <span key={`${part}-${index}`} className="compat-type-emphasis">
          {part}
        </span>
      );
    }
    return <span key={`text-${index}`}>{part}</span>;
  });
}

function renderParagraphs(text) {
  return text
    .split("\n")
    .filter((line) => line.trim())
    .map((line, i) => (
      <p key={i} className="body-copy compat-prose-paragraph">
        {renderHighlightedText(line)}
      </p>
    ));
}

function getPoeticPreviewExcerpt(text) {
  if (!text) return "";
  const firstSentenceEnd = text.search(/[。！？]/);
  if (firstSentenceEnd >= 0) {
    const sentence = text.slice(0, firstSentenceEnd + 1);
    return firstSentenceEnd < text.length - 1 ? `${sentence}……` : sentence;
  }
  if (text.length <= 28) return text;
  return `${text.slice(0, 28)}……`;
}

function splitPoemAndAuthor(text) {
  if (!text) {
    return { poem: "", author: "" };
  }

  const parts = text.split(/\s*——\s*/);
  if (parts.length < 2) {
    return { poem: text, author: "" };
  }

  return {
    poem: parts[0].trim(),
    author: parts.slice(1).join(" —— ").trim()
  };
}

const COMPACT_POEM_SET = new Set([
  "庭院深深深几许，杨柳堆烟，帘幕无重数。",
  "众里寻他千百度，蓦然回首，那人却在灯火阑珊处。"
]);

function getPoemClassName(poem) {
  const normalizedPoem = (poem || "").replace(/[“”]/g, "").trim();
  return COMPACT_POEM_SET.has(normalizedPoem)
    ? "compat-poem compat-poem-compact"
    : "compat-poem";
}

function splitAdviceLead(text) {
  const matchedTitle = typeOptions.find((item) => text.startsWith(item.title));
  if (!matchedTitle) {
    return { key: null, lead: null, body: text };
  }

  return {
    key: matchedTitle.key,
    lead: matchedTitle.title,
    body: text.slice(matchedTitle.title.length).trim()
  };
}

function buildAdviceEntries(adviceItems, primaryTypeKey, secondaryTypeKey) {
  const order = new Map([
    [primaryTypeKey, 0],
    [secondaryTypeKey, 1]
  ]);

  return adviceItems
    .map((item, index) => ({
      ...splitAdviceLead(item),
      isSelf: false,
      originalIndex: index
    }))
    .map((item) => ({
      ...item,
      isSelf: item.key === primaryTypeKey
    }))
    .sort((a, b) => {
      const rankA = a.key && order.has(a.key) ? order.get(a.key) : 99 + a.originalIndex;
      const rankB = b.key && order.has(b.key) ? order.get(b.key) : 99 + b.originalIndex;
      return rankA - rankB;
    });
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
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [purchasePolling, setPurchasePolling] = useState(false);
  const [purchaseStopper, setPurchaseStopper] = useState(null);
  const guideRef = useRef(null);
  const paywallRef = useRef(null);

  const guide = selectedType ? getCompatibility(myTypeKey, selectedType.key) : null;
  const premiumGuide = selectedType ? getPremiumCompatibility(myTypeKey, selectedType.key) : null;
  const adviceEntries = guide ? buildAdviceEntries(guide.advice, myTypeKey, selectedType.key) : [];
  const poeticPreview = premiumGuide ? splitPoemAndAuthor(premiumGuide.preview.poem) : { poem: "", author: "" };

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
      poem: premiumGuide.preview.poem,
      poeticChemistryShort: premiumGuide.preview.poeticChemistryShort || "",
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

  function handlePurchaseDouble() {
    if (purchasePolling) return;
    const stopper = startAfdianPurchase("double", (status) => {
      setPurchasePolling(status.polling);
      if (status.found && status.level) {
        setUnlocked(true);
        trackUnlockDouble(myTypeKey, selectedType?.key);
        setTimeout(() => {
          if (paywallRef.current) {
            paywallRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }
    });
    setPurchaseStopper(stopper);
  }

  // 组件卸载时停止轮询
  useEffect(() => {
    return () => { if (purchaseStopper) purchaseStopper.stop(); };
  }, [purchaseStopper]);

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
            <div className="compat-preview-row">
              <span className="compat-preview-pill">关系画像</span>
              <span className="compat-preview-sep">/</span>
              <span className="compat-preview-pill">天然默契</span>
              <span className="compat-preview-sep">/</span>
              <span className="compat-preview-pill">潜在摩擦</span>
              <span className="compat-preview-sep">/</span>
              <span className="compat-preview-pill">双方建议</span>
            </div>
            <div className="compat-preview-row">
              <span className="compat-preview-pill">相处锦囊</span>
              <span className="compat-preview-sep">/</span>
              <span className="compat-preview-pill">关系预警信号</span>
              <span className="compat-preview-sep">/</span>
              <span className="compat-preview-pill">推荐一起做的事</span>
            </div>
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
            {adviceEntries.map((item, i) => (
              <li key={i} className="body-copy">
                {item.lead ? (
                  <>
                    <span className="compat-advice-lead">
                      给{item.lead}的{item.isSelf ? "你" : "TA"}：
                    </span>
                    {item.body}
                  </>
                ) : (
                  item.body
                )}
              </li>
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
          {/* 已解锁 */}
          {unlocked ? (
            <>
                <div className="compat-deep-preview">
                  <span className="compat-label">深度解读 · 预览</span>
                  <span className="compat-tag">{premiumGuide.preview.tag}</span>
                  {poeticPreview.poem && <p className={getPoemClassName(poeticPreview.poem)}>{poeticPreview.poem}</p>}
                  {poeticPreview.author && <p className="compat-poem-author">—— {poeticPreview.author}</p>}
                  {premiumGuide.preview.poeticChemistry && (
                    <p className="body-copy compat-poetic-chemistry">
                      {renderHighlightedText(premiumGuide.preview.poeticChemistry)}
                  </p>
                )}
              </div>

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
                      <p className="body-copy">{renderHighlightedText(item.desc)}</p>
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
                      <p className="body-copy">{renderHighlightedText(item.desc)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 给双方的建议 */}
              <div className="compat-deep-section compat-deep-advice-pair">
                <div className="compat-advice-card">
                  <span className="compat-label">给 {premiumGuide.premium.adviceA.label} 的话</span>
                  <p className="body-copy">{renderHighlightedText(premiumGuide.premium.adviceA.text)}</p>
                </div>
                <div className="compat-advice-card">
                  <span className="compat-label">给 {premiumGuide.premium.adviceB.label} 的话</span>
                  <p className="body-copy">{renderHighlightedText(premiumGuide.premium.adviceB.text)}</p>
                </div>
              </div>

              {/* 相处锦囊 */}
              <div className="compat-deep-section compat-deep-nugget">
                <span className="compat-label">相处锦囊</span>
                <p className="body-copy compat-nugget">{renderHighlightedText(premiumGuide.premium.nugget)}</p>
              </div>

              {/* 关系预警信号 */}
              <div className="compat-deep-section">
                <span className="compat-label">关系预警信号</span>
                <ul className="compat-advice-list">
                  {premiumGuide.premium.warnings.map((item, i) => (
                    <li key={i} className="body-copy">{renderHighlightedText(item)}</li>
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
                      <p className="body-copy">{renderHighlightedText(item.desc)}</p>
                    </div>
                  ))}
                </div>
              </div>
              </div>
            </>
          ) : (
            /* 未解锁：付费墙 */
              <div className="compat-deep-preview compat-paywall compat-paywall-double">
                <span className="compat-label">深度解读 · 预览</span>
                <span className="compat-tag">{premiumGuide.preview.tag}</span>
                <div className="compat-preview-body">
                  {poeticPreview.poem && <p className={getPoemClassName(poeticPreview.poem)}>{poeticPreview.poem}</p>}
                  {poeticPreview.author && <p className="compat-poem-author">—— {poeticPreview.author}</p>}
                  {premiumGuide.preview.poeticChemistry && (
                    <p className="body-copy compat-poetic-chemistry">
                      {premiumGuide.preview.poeticChemistry}
                  </p>
                )}
                </div>
                <div className="paywall-blur-hint">
                  <p className="paywall-teaser">
                    而真正让你们靠近或拉扯的，<br />
                    往往还在后面。
                  </p>
                  <p className="paywall-desc">
                    上面只是这段关系的引子。深度版会继续展开你们之间具体的默契与摩擦、各自的盲区，以及只属于你们两人的相处锦囊。
                  </p>
              </div>
              {/* ===== 购买按钮（主入口）===== */}
              <div className="paywall-purchase-section">
                <button
                  className="primary-button paywall-buy-btn"
                  type="button"
                  onClick={handlePurchaseDouble}
                  disabled={purchasePolling}
                >
                  {purchasePolling && <span className="btn-spinner" />}
                  {purchasePolling ? "等待支付确认…" : "解锁深度相处分析 · ¥2.99"}
                </button>
                <p className="paywall-platform-hint">
                  {purchasePolling
                    ? "支付完成后此页面将自动解锁，请勿关闭"
                    : "通过爱发电支付 · 支付后自动解锁 · 无需填写个人信息"}
                </p>
              </div>

              {/* ===== 兑换码入口（折叠）===== */}
              <div className="paywall-code-section">
                <button
                  className="text-button paywall-code-toggle"
                  type="button"
                  onClick={() => setShowCodeInput(!showCodeInput)}
                >
                  {showCodeInput ? "收起" : "已有兑换码？点此输入"}
                </button>
                {showCodeInput && (
                  <form className="paywall-form fade-in" onSubmit={handleCodeSubmit}>
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
                    <button className="secondary-button" type="submit" disabled={!codeInput.trim() || codeLoading}>
                      {codeLoading && <span className="btn-spinner" />}
                      {codeLoading ? "验证中…" : "兑换"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== 行动区 ===== */}
      <div className="compat-action-zone">
        <span className="compat-action-kicker">如果想看得更准一些</span>
        <p className="body-copy compat-action-title">
          让 TA 也来测一测，<br />
          你们的相处版会更贴近真实
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

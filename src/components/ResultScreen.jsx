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

function ResultScreen({ result, scores, onRestart, onCopyShare, copied }) {
  return (
    <section className="screen fade-in">
      <div className="result-story-card">
        <div className="result-hero">
          <div className="result-hero-glow result-hero-glow-left" />
          <div className="result-hero-glow result-hero-glow-right" />
          <div className="result-hero-badge">关系距离测试结果</div>
          <p className="result-hero-label">你更舒服的关系节奏，是这样靠近你的。</p>
          <h1 className="result-hero-title">{result.title}</h1>
          <p className="result-hero-summary">{result.summary}</p>
        </div>

        <section className="result-block result-block-soft-blue">
          <div className="result-block-header">
            <span className="result-block-kicker">维度倾向</span>
            <h3 className="section-title">你的结果分布</h3>
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

        <section className="result-block result-block-description">
          <div className="result-block-header">
            <span className="result-block-kicker">被说中的描述</span>
            <h2 className="section-title">被说中的描述</h2>
          </div>
          <div className="description-block">{renderLines(result.description)}</div>
        </section>

        <ResultListSection
          title="你的关系优势"
          kicker="关系优势"
          items={result.strengths}
          tone="soft-blue"
        />

        <ResultListSection
          title="你的关系触发点"
          kicker="关系触发点"
          items={result.triggers}
          tone="soft-lilac"
        />

        <ResultListSection
          title="适合你的相处方式"
          kicker="相处建议"
          items={result.fit}
          tone="soft-mist"
        />

        <section className="result-block result-block-reminder">
          <div className="result-block-header">
            <span className="result-block-kicker">给你的提醒</span>
            <h3 className="section-title">给你的提醒</h3>
          </div>
          <p className="body-copy result-emphasis-copy">{result.reminder}</p>
        </section>

        <section className="result-block result-block-share">
          <div className="result-block-header">
            <span className="result-block-kicker">分享文案</span>
            <h3 className="section-title">分享文案</h3>
          </div>
          <p className="body-copy centered">
            这句很适合直接发给朋友，或者配结果截图一起分享。
          </p>
          <p className="share-copy">{result.share}</p>
          <button className="secondary-button share-inline-button" type="button" onClick={onCopyShare}>
            {copied ? "分享文案已复制" : "复制分享文案"}
          </button>
        </section>

        <section className="result-block result-block-disclaimer">
          <div className="result-block-header">
            <span className="result-block-kicker">说明</span>
            <h3 className="section-title">说明</h3>
          </div>
          <p className="body-copy">
            本测试用于帮助你理解自己在人际关系中的偏好与舒适区，结果反映的是相对倾向，不代表固定不变的性格结论，也不用于专业心理诊断。
          </p>
        </section>
      </div>

      <div className="action-row">
        <button className="primary-button" type="button" onClick={onRestart}>
          重新测试
        </button>
      </div>
    </section>
  );
}

export default ResultScreen;
const TYPE_NAMES = {
  companion: "朝暮相依",
  steady: "有常相守",
  boundary: "知止有度",
  free: "闲云野鹤",
  gentle: "静水流深",
  resonance: "高山流水",
};

const ARCHETYPES = [
  { name: "朝暮相依", desc: "需要被回应的确定感" },
  { name: "有常相守", desc: "要的是稳定而不是热烈" },
  { name: "知止有度", desc: "在亲密里也需要呼吸感" },
  { name: "闲云野鹤", desc: "享受关系但拒绝被定义" },
  { name: "静水流深", desc: "信任需要时间来兑现" },
  { name: "高山流水", desc: "等的不是陪伴而是共鸣" }
];

const introMoments = [
  "明明心中有牵挂，却不愿日日传书",
  "旁人靠得太近，便会本能地想退后半步",
  "渴望被真正懂得，又怕被频频追问",
  "情谊淡了觉失落，挨得太紧又生窒息"
];

const notes = [
  "共二十问",
  "约需半盏茶时分",
  "请凭第一直觉与本心作答",
  "无谓对错与成熟，只选最契合你心境的答案"
];

function HomeScreen({ onStart, seriesTag, inviteFrom }) {
  const fromName = inviteFrom && TYPE_NAMES[inviteFrom];

  // 为了实现无缝滚动，我们将数组复制一份
  const scrollList = [...ARCHETYPES, ...ARCHETYPES];

  return (
    <section className="screen screen-home fade-in">
      <div className="hero-glow hero-glow-left" />
      <div className="hero-glow hero-glow-right" />

      {fromName && (
        <div className="invite-banner">
          一位「{fromName}」正等你揭晓你们的相处默契 ✨
        </div>
      )}

      <div className="brand-tag">「{seriesTag}」</div>
      <div className="eyebrow">知交有度 · 情谊留白</div>

      <h1 className="page-title">你的关系距离测试</h1>

      <p className="page-subtitle">
        不是你难以相处，只是你心中自有亲疏深浅。
      </p>

      <button className="primary-button home-cta-top" type="button" onClick={onStart}>
        开启测验
      </button>

      <div className="card intro-card">
        <p className="lead-text">这些心绪，你是否也曾有过一二？</p>
        <ul className="soft-list">
          {introMoments.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="body-copy">
          许多情谊的消耗，并非因为不在意，而是因为彼此需要的距离不同。
        </p>
        <p className="body-copy emphasis">
          完成这份测验，寻出最契合你的羁绊之道。
        </p>
      </div>

      <div className="card preview-card">
        <h2 className="section-title">你会是哪一种？</h2>
        
        <div className="preview-scroll-viewport">
          <div className="preview-scroll-track">
            {scrollList.map((item, index) => (
              <div className="preview-item-row" key={index}>
                <span className="preview-name-row">{item.name}</span>
                <span className="preview-desc-row">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="preview-footer-hint">
          及更多未定义的隐性特质……
        </p>
      </div>

      <div className="card notes-card">
        <h2 className="section-title">测验说明</h2>
        <ul className="info-grid">
          {notes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default HomeScreen;

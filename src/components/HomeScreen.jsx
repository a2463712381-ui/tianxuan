const introMoments = [
  "明明在意一个人，却不想天天联系",
  "别人一靠太近，就会下意识想退一点",
  "想被理解，但又不喜欢被追问太多",
  "关系淡了会难受，太近了又会窒息"
];

const notes = [
  "共 20 题",
  "大约需要 3 分钟",
  "请按照第一直觉作答",
  "不必纠结哪个更成熟，只选哪个更像你"
];

function HomeScreen({ onStart }) {
  return (
    <section className="screen screen-home fade-in">
      <div className="hero-glow hero-glow-left" />
      <div className="hero-glow hero-glow-right" />
      <div className="eyebrow">Relationship Distance Test</div>
      <h1 className="page-title">你的关系距离测试</h1>
      <p className="page-subtitle">
        不是你难相处，只是你需要的亲近方式和别人不同。
      </p>

      <div className="card intro-card">
        <p className="lead-text">你是不是也有过这些时刻：</p>
        <ul className="soft-list">
          {introMoments.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="body-copy">
          很多关系里的消耗，不是因为谁不在意，而是因为彼此需要的距离不一样。
        </p>
        <p className="body-copy emphasis">
          完成这份测试，看看你最适合怎样的关系节奏。
        </p>
      </div>

      <div className="card notes-card">
        <h2 className="section-title">测试说明</h2>
        <ul className="info-grid">
          {notes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <button className="primary-button" type="button" onClick={onStart}>
        开始测试
      </button>
    </section>
  );
}

export default HomeScreen;

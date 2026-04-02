function TransitionScreen() {
  return (
    <section className="screen transition-screen fade-in">
      <div className="card transition-card">
        <div className="pulse-orb" />
        <p className="transition-label">正在生成你的关系风格结果……</p>
        <h2 className="transition-title">请给自己一点点安静的时间</h2>
        <p className="body-copy centered">
          我们会根据你的选择，整理出更适合你的关系节奏、触发点和舒适区。
        </p>
      </div>
    </section>
  );
}

export default TransitionScreen;
